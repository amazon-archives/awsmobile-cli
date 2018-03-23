/* 
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
*/
"use strict";
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const util = require('util')
const _ = require('lodash')

const _featureName = 'appsync'

const appsyncManager = require('./appsync-manager.js')
const serviceRoleHelper = require('./appsync-helper-service-role.js')
const appsyncWaitLogic = require('./appsync-wait-logic.js')
const awsClient = require('../aws-operations/aws-client.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const dfOps = require('../utils/directory-file-ops.js')
const projectInfoManager = require('../project-info-manager.js')
const awsmobilejsConst = require('../utils/awsmobilejs-constant.js')

const authTypes = ["API_KEY", "AWS_IAM", "AMAZON_COGNITO_USER_POOLS"]
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]

function run(projectInfo, awsDetails){

  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let apiKeys = appsyncManager.getApiKeys(projectInfo.ProjectPath)
  let dataSources = appsyncManager.getDataSources(projectInfo.ProjectPath)
  let graphqlApi = appsyncManager.getGraphqlApi(projectInfo.ProjectPath)
  let resolvers = appsyncManager.getResolvers(projectInfo.ProjectPath)
  let schema = appsyncManager.getSchema(projectInfo.ProjectPath)

  let appsyncCreationHandle = {
    projectInfo,
    awsDetails,
    featureDirPath,
    apiKeys, 
    dataSources,
    graphqlApi,
    resolvers,
    schema
  }
  
  return createDDBTables(appsyncCreationHandle)
          .then(createLambdaFunction)
          .then(createServiceRoles)
          .then(putRolePolicies)
          .then(createGraphqlApi)
          .then(startSchemaCreation)
          .then(waitForSchemaCreationToComplete)
          .then(createDataSources)
          .then(createResolvers)
          .then(createApiKey)
          .then(onSuccess)
          .catch(onFailure)
}

function createDDBTables(appsyncCreationHandle){
  console.log('appsync creation: create dynamoDB tables...')
  let createTableTasks = []
  let tableNameSuffix = '-' + nameManager.makeid(8)
  appsyncCreationHandle.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      dataSource.spec.Table.TableName = dataSource.spec.Table.TableName.replace(awsmobilejsConst.Suffix, tableNameSuffix)
      createTableTasks.push(createDDBTable(appsyncCreationHandle, dataSource))
    }
  })
  return Promise.all(createTableTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function createDDBTable(appsyncCreationHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = dataSource.spec.Table
    let dynamoDBClient = awsClient.DynamoDB(appsyncCreationHandle.awsDetails)
    dynamoDBClient.createTable(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create dynamoDB table ' + param.TableName))
        console.log(err)
        reject(err)
      }else{
        dataSource.details = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createLambdaFunction(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createServiceRoles(appsyncCreationHandle){
  console.log('appsync creation: create service roles...')
  let createRoleTasks = []
  let roleNameSuffix = nameManager.makeid(6)
  appsyncCreationHandle.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      dataSource.serviceRoleSpec = serviceRoleHelper.constructCreateRoleParamForDDB(dataSource.details, roleNameSuffix)
      createRoleTasks.push(createServiceRole(appsyncCreationHandle, dataSource))
    }
  })
  return Promise.all(createRoleTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function createServiceRole(appsyncCreationHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = dataSource.serviceRoleSpec
    let iamClient = awsClient.IAM(appsyncCreationHandle.awsDetails)
    iamClient.createRole(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create service roles ' + param.RoleName))
        console.log(err)
        reject(err)
      }else{
        dataSource.serviceRoleDetails = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function putRolePolicies(appsyncCreationHandle){
  console.log('appsync creation: put service roles policies...')
  let putRolePolicyTasks = []
  appsyncCreationHandle.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      dataSource.putServiceRoleSpec = serviceRoleHelper.constructPutRolePolicyParamForDDB(dataSource.serviceRoleDetails)
      putRolePolicyTasks.push(putRolePolicy(appsyncCreationHandle, dataSource))
    }
  })
  return Promise.all(putRolePolicyTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function putRolePolicy(appsyncCreationHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = dataSource.putServiceRoleSpec
    let iamClient = awsClient.IAM(appsyncCreationHandle.awsDetails)
    iamClient.putRolePolicy(param, (err, data)=>{
      if(err){
        console.log(chalk.red('put service role policy err'))
        console.log(err)
        reject(err)
      }else{
        dataSource.putServiceRoleDetails = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createGraphqlApi(appsyncCreationHandle){
  console.log('appsync creation: create graphql api...')
  return new Promise((resolve, reject) => {
    if(appsyncCreationHandle.graphqlApi.name == awsmobilejsConst.AutoGenerate){
      appsyncCreationHandle.graphqlApi.name = nameManager.generateGraphqlAPIName(appsyncCreationHandle.projectInfo)
    }
    let param = {
      name: appsyncCreationHandle.graphqlApi.name,
      authenticationType: appsyncCreationHandle.graphqlApi.authenticationType
    }
    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)

    appsyncClient.createGraphqlApi(param, (err, data)=>{
      if(err){
        console.log(chalk.red('create graphal API err ' + param.name))
        console.log(err)
        reject(err)
      }else{
        appsyncCreationHandle.createGraphqlApiResponse = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function startSchemaCreation(appsyncCreationHandle){
  console.log('appsync creation: create schema...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
      definition: appsyncCreationHandle.schema
    }
    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)
    appsyncClient.startSchemaCreation(param, (err, data)=>{
      if(err){
        console.log(chalk.red('startSchemaCreation err '))
        console.log(err)
        reject(err)
      }else{
        appsyncCreationHandle.schemaCreationResponse = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function waitForSchemaCreationToComplete(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    appsyncWaitLogic.waitForSchemaCreation(appsyncCreationHandle, (err, appsyncCreationHandle)=>{
      if(err){
        reject(err)
      }else{
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createDataSources(appsyncCreationHandle){
  console.log('appsync creation: create data sources...')
  let createDataSourceTasks = []
  appsyncCreationHandle.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      createDataSourceTasks.push(createDataSource(appsyncCreationHandle, dataSource))
    }
  })
  
  return Promise.all(createDataSourceTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function createDataSource(appsyncCreationHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
      name: dataSource.name,
      description: dataSource.description,
      type: dataSource.type,
      serviceRoleArn: dataSource.serviceRoleDetails.Role.Arn,
      dynamodbConfig: getDynamodbConfig(appsyncCreationHandle, dataSource)
    }

    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)

    appsyncClient.createDataSource(param, (err, data)=>{
      if(err){
        console.log(chalk.red('createDataSource err: ' + param.name))
        console.log(err)
        reject(err)
      }else{
        dataSource.dataSourceDetails = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function getDynamodbConfig(appsyncCreationHandle, dataSource){
  let config 
  
  if(dataSource.type == 'AMAZON_DYNAMODB'){
    config = {
      tableName: dataSource.details.TableDescription.TableName,
      awsRegion: appsyncCreationHandle.awsDetails.config.region,
      useCallerCredentials: false
    }
  }
  return config
}

function getLambdaConfig(appsyncCreationHandle, dataSource){
  return undefined
}

function getElasticsearchConfig(appsyncCreationHandle, dataSource){
  return undefined
}

function createResolvers(appsyncCreationHandle){
  console.log('appsync creation: create resolvers...')
  let createResolverTasks = []
  appsyncCreationHandle.resolvers.forEach(resolver => {
    createResolverTasks.push(createResolver(appsyncCreationHandle, resolver))
  })
  return Promise.all(createResolverTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function createResolver(appsyncCreationHandle, resolver){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
      typeName: resolver.typeName,
      fieldName: resolver.fieldName,
      dataSourceName: resolver.dataSourceName,
      requestMappingTemplate: appsyncManager.getMapping(appsyncCreationHandle.projectInfo.ProjectPath, resolver.requestMappingTemplate),
      responseMappingTemplate: appsyncManager.getMapping(appsyncCreationHandle.projectInfo.ProjectPath, resolver.responseMappingTemplate)
    }

    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)

    appsyncClient.createResolver(param, (err, data)=>{
      if(err){
        console.log(chalk.red('createResolver err: ' + param.fieldName))
        console.log(err)
        reject(err)
      }else{
        resolver.details = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createApiKey(appsyncCreationHandle){
  console.log('appsync creation: create Api Key')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
    }
    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)

    appsyncClient.createApiKey(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        appsyncCreationHandle.createApiKeyResponse = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function onSuccess(appsyncCreationHandle){
  let appsyncDetails = constructAppSyncDetails(appsyncCreationHandle)
  projectInfoManager.updateAppSyncDetails(appsyncCreationHandle.projectInfo, appsyncDetails)
  console.log('appsync creation complete: ' + chalk.blue(appsyncCreationHandle.graphqlApi.name))
}

function onFailure(e){
  console.log(chalk.red('appsync creation failed'))
  console.log(e)
  process.exit(1)
}

function constructAppSyncDetails(appsyncCreationHandle)
{
  let result = {}

  result.apiId = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
  result.name = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.name
  result.graphqlEndpoint = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.uris.GRAPHQL
  result.region = appsyncCreationHandle.awsDetails.config.region
  result.authenticationType = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.authenticationType
  result.apiKey = appsyncCreationHandle.createApiKeyResponse.apiKey.id

  return result
}

module.exports = {
  run
}
