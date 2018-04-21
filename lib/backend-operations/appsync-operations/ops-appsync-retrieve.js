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
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const util = require('util')

const _featureName = 'appsync'

const appsyncManager = require('./appsync-manager.js')
const awsClient = require('../../aws-operations/aws-client.js')
const resolversHelper = require('./helpers/helper-resolvers.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')

let spinner = ora('retrieving appsync ...')

function run(projectInfo, awsDetails){
  spinner.start()
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
  spinner.start('retrieving appsync: setup handle...')
  return new Promise((resolve, reject) => {
    let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)
    if(appsyncInfo && appsyncInfo.apiId){
      let appsyncRetrieveHandle = {
        projectInfo: projectInfo,
        apiId: appsyncInfo.apiId, 
        awsDetails: awsDetails
      }
      resolve(appsyncRetrieveHandle)
    }else{
      reject('missing appsync info')
    }
  })
}

function getGraphqlApi(appsyncRetrieveHandle){
  spinner.start('retrieving appsync: get graphql api...')
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
  spinner.start('retrieving appsync: get data sources...')
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
  spinner.start('retrieving appsync: get DynamoDB tables...')
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
  spinner.start('retrieving appsync: get types...')
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
  spinner.start('retrieving appsync: get resolvers...')
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
  spinner.start('retrieving appsync: get api keys...')
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
  spinner.start('retrieving appsync: logging current appsync info...')
  logAppSyncJS(appsyncRetrieveHandle)
  let currentAppsyncDetails = logToCurrentBackendInfo(appsyncRetrieveHandle)
  spinner.stop()
  return currentAppsyncDetails
}

function logToCurrentBackendInfo(appsyncRetrieveHandle){
  let appsyncDetails = {}

  let currentInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(appsyncRetrieveHandle.projectInfo.ProjectPath, _featureName)
  fs.ensureDirSync(currentInfoDirPath)

  appsyncDetails.graphqlApi = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi
  let graphqlApiFilePath  = path.join(currentInfoDirPath, 'graphqlApi.json')
  fs.writeFileSync(graphqlApiFilePath, JSON.stringify(appsyncDetails.graphqlApi, null, '\t'), 'utf8')
  
  appsyncDetails.schema = {
    definition: appsyncRetrieveHandle.listTypesResponse.types.map(t=>t.definition.replace(/\n+/g, '\n')).join(os.EOL)
  }
  let schemaFilePath = path.join(currentInfoDirPath, 'schema.graphql')
  fs.writeFileSync(schemaFilePath, appsyncDetails.schema.definition, 'utf8')

  appsyncDetails.apiKeys = appsyncRetrieveHandle.listApiKeysResponse.apiKeys
  let apiKeyFilePath  = path.join(currentInfoDirPath, 'apiKeys.json')
  fs.writeFileSync(apiKeyFilePath, JSON.stringify(appsyncDetails.apiKeys, null, '\t'), 'utf8')

  appsyncRetrieveHandle.listResolversResponse.forEach(resolver=>{
    resolversHelper.writeResolverMappings(currentInfoDirPath, resolver)
  })

  appsyncDetails.resolvers = appsyncRetrieveHandle.listResolversResponse
  let resolversFilePath  = path.join(currentInfoDirPath, 'resolvers.json')
  fs.writeFileSync(resolversFilePath, JSON.stringify(appsyncDetails.resolvers, null, '\t'), 'utf8')

  appsyncDetails.dataSources = {
    dataSources: appsyncRetrieveHandle.listDataSourcesResponse.dataSources,
    tables: appsyncRetrieveHandle.listDDBTablesResponse
  }

  let dataSourcesFilePath  = path.join(currentInfoDirPath, 'dataSources.json')
  fs.writeFileSync(dataSourcesFilePath, JSON.stringify(appsyncDetails.dataSources, null, '\t'), 'utf8')

  return appsyncDetails
}


function logAppSyncJS(appsyncRetrieveHandle){
  let appsyncInfo = appsyncManager.getAppSyncInfo(appsyncRetrieveHandle.projectInfo.ProjectPath)
  if(!appsyncInfo){
    appsyncInfo = {}
  }
  let appsyncInfoUpdate = constructAppSyncInfo(appsyncRetrieveHandle)
  Object.assign(appsyncInfo, appsyncInfoUpdate)
  appsyncManager.setAppSyncInfo(appsyncRetrieveHandle.projectInfo.ProjectPath, appsyncInfo)
  appsyncManager.setAppSyncJS(appsyncRetrieveHandle.projectInfo.ProjectPath, appsyncInfo)
}

function constructAppSyncInfo(appsyncRetrieveHandle)
{
  let appsyncInfo = {}

  appsyncInfo.apiId = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.apiId
  appsyncInfo.region = appsyncRetrieveHandle.awsDetails.config.region
  appsyncInfo.name = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.name
  appsyncInfo.graphqlEndpoint = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.uris.GRAPHQL
  appsyncInfo.authenticationType = appsyncRetrieveHandle.getGraphqlApiResponse.graphqlApi.authenticationType
  setApiKey(appsyncInfo, appsyncRetrieveHandle.listApiKeysResponse)
 
  let now = moment().format(awsmobilejsConstant.DateTimeFormatString)
  appsyncInfo.lastSyncTime = now

  return appsyncInfo
}

function setApiKey(appsyncInfo, listApiKeysResponse){
  if(listApiKeysResponse && listApiKeysResponse.apiKeys && listApiKeysResponse.apiKeys.length>0){
    let keyWithLogestExpiration = listApiKeysResponse.apiKeys[0]
    for(let i=1; i<listApiKeysResponse.apiKeys.length; i++){
      if(listApiKeysResponse.apiKeys[i].expires > keyWithLogestExpiration.expires){
        keyWithLogestExpiration = listApiKeysResponse.apiKeys[i]
      }
    }
    appsyncInfo.apiKey = keyWithLogestExpiration.id
  }
}


function onFailure(e){
  spinner.stop()
  console.log(chalk.red('appsync retrieve failed'))
  console.log(e)
}

module.exports = {
  run,
}
