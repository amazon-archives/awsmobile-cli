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
const ora = require('ora')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const util = require('util')
const _ = require('lodash')

const _featureName = 'appsync'

const appsyncManager = require('./appsync-manager.js')
const serviceRoleHelper = require('./helpers/helper-serviceRoles.js')
const appsyncWaitLogic = require('./helpers/appsync-wait-logic.js')
const awsClient = require('../../aws-operations/aws-client.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const nameManager = require('../../utils/awsmobilejs-name-manager.js')
const dfOps = require('../../utils/directory-file-ops.js')
const projectInfoManager = require('../../project-info-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const awsConfigManager = require('../../aws-operations/aws-config-manager.js')

const authTypes = ["API_KEY", "AWS_IAM", "AMAZON_COGNITO_USER_POOLS"]
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]

let spinner = ora('creating appsync ...')

function runTest(projectInfo, args){
  awsConfigManager.checkAWSConfig(function(awsDetails){
    run(projectInfo, awsDetails)
  })
}

function run(projectInfo, awsDetails){
  spinner.start()
  return setupHandle(projectInfo, awsDetails)
          .then(createDDBTables)
          .then(createServiceRoles)
          .then(putRolePolicies)
          .then(createGraphqlApi)
          .then(startSchemaCreation)
          .then(waitForSchemaCreationToComplete)
          .then(createDataSources)
          .then(createResolvers)
          .then(createApiKeys)
          .then(onSuccess)
          .catch(onFailure)
}

function setupHandle(projectInfo, awsDetails){
  spinner.start('creating appsync: setup handle...')
  return new Promise((resolve, reject) => {
    let appsyncCreationHandle = {
      projectInfo,
      awsDetails,
      featureDirPath: pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName),
      apiKeys: appsyncManager.getApiKeys(projectInfo.ProjectPath),
      dataSources: appsyncManager.getDataSources(projectInfo.ProjectPath),
      graphqlApi: appsyncManager.getGraphqlApi(projectInfo.ProjectPath),
      resolvers: appsyncManager.getResolvers(projectInfo.ProjectPath),
      schema: appsyncManager.getSchema(projectInfo.ProjectPath)
    }
    resolve(appsyncCreationHandle)
  })
}

function createDDBTables(appsyncCreationHandle){
  spinner.start('creating appsync: create DynamoDB tables...')
  mapDDBConnections(appsyncCreationHandle)
  let createTableTasks = []
  let tableNameSuffix = nameManager.makeid(8)
  appsyncCreationHandle.dataSources.tables.forEach(table => {
    if(table.dataSources && table.dataSources.length>0){
      table.TableName = table.TableName.replace(awsmobilejsConstant.Suffix, tableNameSuffix)
      table.dataSources.forEach(dataSource=>{
        dataSource.dynamodbConfig.tableName = table.TableName
      })
      createTableTasks.push(createDDBTable(appsyncCreationHandle, table))
    }
  })
  return Promise.all(createTableTasks).then((values)=>{
    return appsyncCreationHandle
  })
}


function mapDDBConnections(appsyncCreationHandle){
  let dataSources = appsyncCreationHandle.dataSources.dataSources
  let tables = appsyncCreationHandle.dataSources.tables
  dataSources.forEach(dataSource =>{
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      for(let i=0; i<tables.length; i++){
        let table = tables[i]
        if(table.TableName == dataSource.dynamodbConfig.tableName &&
          table.Region == dataSource.dynamodbConfig.awsRegion){
            dataSource.table = table
            if(!table.dataSources){
              table.dataSources = []
            }
            table.dataSources.push(dataSource)
            break
          }
      }
    }
  })
}

function createDDBTable(appsyncCreationHandle, table){
  return new Promise((resolve, reject) => {
    let param = {}
    Object.assign(param, table)
    delete param.Region
    delete param.dataSources
    let dynamoDBClient = awsClient.DynamoDB(appsyncCreationHandle.awsDetails, table.Region)
    dynamoDBClient.createTable(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create dynamoDB table ' + param.TableName))
        console.log(err)
        reject(err)
      }else{
        table.details = data.TableDescription
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createServiceRoles(appsyncCreationHandle){
  spinner.start('creating appsync: create service roles...')
  let createRoleTasks = []
  let roleNameSuffix = nameManager.makeid(6)
  appsyncCreationHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource.serviceRoleArn == awsmobilejsConstant.ByAWSMobileCLI){
      let tableName = dataSource.dynamodbConfig.tableName
      dataSource.serviceRoleSpec = serviceRoleHelper.constructCreateRoleParamForDDB(tableName, roleNameSuffix)
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
  spinner.start('creating appsync: put service roles policies...')
  let putRolePolicyTasks = []
  appsyncCreationHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      dataSource.putServiceRoleSpec = serviceRoleHelper.constructPutRolePolicyParamForDDB(dataSource)
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
  spinner.start('creating appsync: create graphql api...')
  return new Promise((resolve, reject) => {
    if(appsyncCreationHandle.graphqlApi.name == awsmobilejsConstant.ByAWSMobileCLI){
      appsyncCreationHandle.graphqlApi.name = nameManager.generateGraphqlAPIName(appsyncCreationHandle.projectInfo)
    }
    let param = {
      name: appsyncCreationHandle.graphqlApi.name,
      authenticationType: appsyncCreationHandle.graphqlApi.authenticationType
    }
    if(appsyncCreationHandle.graphqlApi.userPoolConfig){
      param.userPoolConfig = appsyncCreationHandle.graphqlApi.userPoolConfig
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
  spinner.start('creating appsync: create schema...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
      definition: appsyncCreationHandle.schema.definition
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
    let apiId = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
    appsyncWaitLogic.waitForSchemaCreation(appsyncCreationHandle, apiId, (err, appsyncCreationHandle)=>{
      if(err){
        reject(err)
      }else{
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createDataSources(appsyncCreationHandle){
  spinner.start('creating appsync: create data sources...')
  let createDataSourceTasks = []
  appsyncCreationHandle.dataSources.dataSources.forEach(dataSource => {
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
      dynamodbConfig: dataSource.dynamodbConfig
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

function createResolvers(appsyncCreationHandle){
  spinner.start('creating appsync: create resolvers...')
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
      apiId: appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
    }
    Object.assign(param, resolver)

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

function createApiKeys(appsyncCreationHandle){
  spinner.start('creating appsync: create api keys...')
  let createApiKeysTasks = []
  if(!appsyncCreationHandle.apiKeys || appsyncCreationHandle.apiKeys.length == 0){
    appsyncCreationHandle.apiKeys = [{}]
  }
  appsyncCreationHandle.apiKeys.forEach(apiKey => {
    createApiKeysTasks.push(createApiKey(appsyncCreationHandle, apiKey))
  })
  return Promise.all(createApiKeysTasks).then((values)=>{
    return appsyncCreationHandle
  })
}

function createApiKey(appsyncCreationHandle, apiKey){
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
    }
    if(apiKey.description){
      param.description = apiKey.description
    }
    if(apiKey.expires){
      param.expires = apiKey.expires
    }

    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)
    appsyncClient.createApiKey(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        apiKey.details = data
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function onSuccess(appsyncCreationHandle){
  spinner.stop()
  let appsyncInfo = constructAppSyncInfo(appsyncCreationHandle)
  delete appsyncInfo.freshLocalEnableDisableFlag
  appsyncManager.updateAppSyncInfo(appsyncCreationHandle.projectInfo.ProjectPath, appsyncInfo)
  console.log('appsync creation complete: ' + chalk.blue(appsyncCreationHandle.graphqlApi.name))
}

function onFailure(e){
  spinner.stop()
  console.log(chalk.red('appsync creation failed'))
  console.log(e)
  process.exit(1)
}

function constructAppSyncInfo(appsyncCreationHandle)
{
  let result = {}

  result.apiId = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId
  result.name = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.name
  result.graphqlEndpoint = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.uris.GRAPHQL
  result.region = appsyncCreationHandle.awsDetails.config.region
  result.authenticationType = appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.authenticationType
  result.apiKey = appsyncCreationHandle.apiKeys[0].details.id

  let now = moment().format(awsmobilejsConstant.DateTimeFormatString)
  result.creationTime = now
  result.lastUpdateTime = now
  result.lastSyncTime = now

  return result
}

module.exports = {
  run,
  runTest
}
