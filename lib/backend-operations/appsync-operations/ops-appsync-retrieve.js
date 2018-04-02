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
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const util = require('util')
const _ = require('lodash')

const _featureName = 'appsync'

const appsyncManager = require('./appsync-manager.js')
const resolversHelper = require('./helpers/helper-resolvers.js')
const serviceRoleHelper = require('./helpers/helper-serviceRoles.js')
const appsyncWaitLogic = require('./helpers/appsync-wait-logic.js')
const awsClient = require('../../aws-operations/aws-client.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const nameManager = require('../../utils/awsmobilejs-name-manager.js')
const dfOps = require('../../utils/directory-file-ops.js')
const projectInfoManager = require('../../project-info-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const awsConfigManager = require('../../aws-operations/aws-config-manager.js')

function runTest(projectInfo, args){
  awsConfigManager.checkAWSConfig(function(awsDetails){
    run(projectInfo, awsDetails)
  })
}

function run(projectInfo, awsDetails){
  return setupHandle(projectInfo, awsDetails)
          .then(getGraphqlApi)
          .then(listDataSources)
          .then(listDDBTables)
          .then(listTypes)
          .then(listApiKeys)
          .then(listResolvers)
          .then(onSuccess)
          .catch(onFailure)

}

function setupHandle(projectInfo, awsDetails){
  return new Promise((resolve, reject) => {
    let appsyncRetrieveHandle = {
      projectInfo: projectInfo,
      apiId: projectInfo.AppSyncApiId, 
      awsDetails: awsDetails
    }
    resolve(appsyncRetrieveHandle)
  })
}

function getGraphqlApi(appsyncRetrieveHandle){
  console.log('appsync retrieve: getGraphqlApi...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.getGraphqlApi(param, (err, data)=>{
      if(err){
        console.log(chalk.red('getGraphqlApi err '))
        console.log(err)
        reject(err)
      }else{
        appsyncRetrieveHandle.getGraphqlApiResponse = data
        resolve(appsyncRetrieveHandle)
      }
    })
  })
}

function listDataSources(appsyncRetrieveHandle){
  console.log('appsync retrieve: listDataSources...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.listDataSources(param, (err, data)=>{
      if(err){
        console.log(chalk.red('listDataSources err '))
        console.log(err)
        reject(err)
      }else{
        appsyncRetrieveHandle.listDataSourcesResponse = data
        resolve(appsyncRetrieveHandle)
      }
    })
  })
}

function listDDBTables(appsyncRetrieveHandle){
  console.log('appsync retrieve: listDDBTables...')
  let uniqueTables = []
  let listDDBTablesTasks = []
  appsyncRetrieveHandle.listDataSourcesResponse.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB'){
      let isNewTable = true
      for(let i = 0; i<uniqueTables.length; i++){
        if(dataSource.dynamodbConfig.awsRegion == uniqueTables[i].awsRegion &&
          dataSource.dynamodbConfig.tableName == uniqueTables[i].tableName){
            isNewTable = false
            break
          }
      }
      if(isNewTable){
        uniqueTables.push(dataSource.dynamodbConfig)
      }
    }
  })

  uniqueTables.forEach(dynamodbConfig => {
    listDDBTablesTasks.push(listDDBTable(appsyncRetrieveHandle, dynamodbConfig))
  })

  return Promise.all(listDDBTablesTasks).then((values)=>{
    appsyncRetrieveHandle.listDDBTablesResponse = values
    return appsyncRetrieveHandle
  })
}

function listDDBTable(appsyncRetrieveHandle, dynamodbConfig){
  return new Promise((resolve, reject) => {
    let param = {
      TableName: dynamodbConfig.tableName
    }
    let dynamoDBClient = awsClient.DynamoDB(appsyncRetrieveHandle.awsDetails, dynamodbConfig.awsRegion)
    dynamoDBClient.describeTable(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create dynamoDB table ' + param.TableName))
        console.log(err)
        reject(err)
      }else{
        data.Table.Region = dynamodbConfig.awsRegion
        resolve(data.Table)
      }
    })
  })
}

function listTypes(appsyncRetrieveHandle){
  console.log('appsync retrieve: listTypes...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId, 
      format: 'SDL'
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.listTypes(param, (err, data)=>{
      if(err){
        console.log(chalk.red('listTypes err '))
        console.log(err)
        reject(err)
      }else{
        appsyncRetrieveHandle.listTypesResponse = data
        resolve(appsyncRetrieveHandle)
      }
    })
  })
}

function listResolvers(appsyncRetrieveHandle){
  console.log('appsync retrieve: listResolvers...')
  let listResolversTasks = []
  appsyncRetrieveHandle.listTypesResponse.types.forEach(type => {
      listResolversTasks.push(listResolversForType(appsyncRetrieveHandle, type))
  })
  return Promise.all(listResolversTasks).then((values)=>{
    appsyncRetrieveHandle.listResolversResponse = []
    values.forEach(r=>{
      appsyncRetrieveHandle.listResolversResponse = appsyncRetrieveHandle.listResolversResponse.concat(r.resolvers)
    })
    
    return appsyncRetrieveHandle
  })
}

function listResolversForType(appsyncRetrieveHandle, type){
  console.log('appsync retrieve: ListResolversForType...' + type.name)
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId,
      typeName: type.name
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.listResolvers(param, (err, data)=>{
      if(err){
        console.log(chalk.red('listResolvers err for type ' + type.name))
        console.log(err)
        reject(err)
      }else{
        type.listResolversResponse = data
        resolve(data)
      }
    })
  })
}

function listApiKeys(appsyncRetrieveHandle){
  console.log('appsync retrieve: ListApiKeys...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.listApiKeys(param, (err, data)=>{
      if(err){
        console.log(chalk.red('ListApiKeys err '))
        console.log(err)
        reject(err)
      }else{
        appsyncRetrieveHandle.listApiKeysResponse = data
        resolve(appsyncRetrieveHandle)
      }
    })
  })
}

function onSuccess(appsyncRetrieveHandle){
  console.log('appsync retrieve: logging current appsync info...')
  logAppSyncJS(appsyncRetrieveHandle)
  let appsyncInfo = logAppSyncInfo(appsyncRetrieveHandle)
  console.log('appsync retrieve successful')
  return appsyncInfo
}

function logAppSyncInfo(appsyncRetrieveHandle){
  let appsyncInfo = {}

  let currentInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(appsyncRetrieveHandle.projectInfo.ProjectPath, _featureName)
  fs.ensureDirSync(currentInfoDirPath)

  appsyncInfo.graphqlApi = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi
  let graphqlApiFilePath  = path.join(currentInfoDirPath, 'graphqlApi.json')
  fs.writeFileSync(graphqlApiFilePath, JSON.stringify(appsyncInfo.graphqlApi, null, '\t'), 'utf8')
  
  appsyncInfo.schema = {
    definition: appsyncRetrieveHandle.listTypesResponse.types.map(t=>t.definition.replace(/\n+/g, '\n')).join(os.EOL)
  }
  let schemaFilePath = path.join(currentInfoDirPath, 'schema.graphql')
  fs.writeFileSync(schemaFilePath, appsyncInfo.schema.definition, 'utf8')

  appsyncInfo.apiKeys = appsyncRetrieveHandle.listApiKeysResponse.apiKeys
  let apiKeyFilePath  = path.join(currentInfoDirPath, 'apiKeys.json')
  fs.writeFileSync(apiKeyFilePath, JSON.stringify(appsyncInfo.apiKeys, null, '\t'), 'utf8')

  appsyncRetrieveHandle.listResolversResponse.forEach(resolver=>{
    resolversHelper.writeResolverMappings(currentInfoDirPath, resolver)
  })

  appsyncInfo.resolvers = appsyncRetrieveHandle.listResolversResponse
  let resolversFilePath  = path.join(currentInfoDirPath, 'resolvers.json')
  fs.writeFileSync(resolversFilePath, JSON.stringify(appsyncInfo.resolvers, null, '\t'), 'utf8')

  appsyncInfo.dataSources = {
    dataSources: appsyncRetrieveHandle.listDataSourcesResponse.dataSources,
    tables: appsyncRetrieveHandle.listDDBTablesResponse
  }

  let dataSourcesFilePath  = path.join(currentInfoDirPath, 'dataSources.json')
  fs.writeFileSync(dataSourcesFilePath, JSON.stringify(appsyncInfo.dataSources, null, '\t'), 'utf8')

  return appsyncInfo
}


function logAppSyncJS(appsyncRetrieveHandle){
  let appsyncInfo = projectInfoManager.getAppSyncInfo(appsyncRetrieveHandle.projectInfo)
  let appsyncInfoUpdate = constructAppSyncInfo(appsyncRetrieveHandle)
  Object.assign(appsyncInfo, appsyncInfoUpdate)
  projectInfoManager.updateAppSyncInfo(appsyncRetrieveHandle.projectInfo, appsyncInfo)
  appsyncManager.setAppSyncJS(appsyncRetrieveHandle.projectInfo.ProjectPath, appsyncInfo)
}

function constructAppSyncInfo(appsyncRetrieveHandle)
{
  let result = {}

  result.apiId = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.apiId
  result.name = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.name
  result.graphqlEndpoint = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.uris.GRAPHQL
  result.region = appsyncRetrieveHandle.awsDetails.config.region
  result.authenticationType = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.authenticationType
  result.apiKey = appsyncRetrieveHandle.listApiKeysResponse.apiKeys[0].id
 
  let now = moment().format(awsmobilejsConstant.DateTimeFormatString)
  result.lastSyncTime = now

  return result
}

function onFailure(e){
  console.log(chalk.red('appsync retrieve failed'))
  console.log(e)
  process.exit(1)
}

module.exports = {
  run, 
  runTest
}
