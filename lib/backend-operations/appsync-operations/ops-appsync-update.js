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
const helperApiKeys = require('./helpers/helper-apiKeys.js')
const helperDataSources = require('./helpers/helper-dataSources.js')
const helperDynamoDB = require('./helpers/helper-dynamoDB.js')
const helperGraphqlApi = require('./helpers/helper-graphqlApi.js')
const helperResolvers = require('./helpers/helper-resolvers.js')
const helperSchema = require('./helpers/helper-schema.js')
const appsyncRetrieve = require('./ops-appsync-retrieve.js')
const awsClient = require('../../aws-operations/aws-client.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const nameManager = require('../../utils/awsmobilejs-name-manager.js')
const dfOps = require('../../utils/directory-file-ops.js')
const projectInfoManager = require('../../project-info-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const awsConfigManager = require('../../aws-operations/aws-config-manager.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

let spinner = ora('updating appsync ...')

function run(projectInfo, awsDetails){
  spinner.start()

  let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)
  if(!appsyncInfo){
    appsyncInfo = {}
  }
  appsyncInfo.lastPushSuccessful = false
  appsyncManager.setAppSyncInfo(projectInfo.ProjectPath, appsyncInfo)

  return setupHandle(projectInfo, awsDetails)
          .then(diff)
          .then(createDDBTables)
          .then(updateDDBTables)
          // .then(waitForDDBTableToComplete)
          .then(createServiceRoles)
          .then(putRolePolicies)
          .then(updateGraphqlApi)
          .then(startSchemaCreation)
          .then(waitForSchemaCreationToComplete)
          .then(createDataSources)
          .then(createResolvers)
          .then(deleteResolvers)
          .then(deleteDataSources)
          .then(updateDataSources)
          .then(updateResolvers)
          .then(createApiKeys)
          .then(deleteApiKeys)
          .then(updateApiKeys)
          .then(onSuccess)
          .catch(onFailure)
}

function setupHandle(projectInfo, awsDetails){ 
  spinner.start('updating appsync: setup handle...')
  return new Promise((resolve, reject) => {
    let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)
    if(!appsyncInfo){
      reject('can not location the current appsync info')
    }else{
      let appsyncUpdateHandle = {
        projectInfo,
        awsDetails,
        appsyncInfo,
        featureDirPath: pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName),
        currentAppSyncInfo:{
          apiKeys: appsyncManager.getCurrentApiKeys(projectInfo.ProjectPath),
          dataSources: appsyncManager.getCurrentDataSources(projectInfo.ProjectPath),
          graphqlApi: appsyncManager.getCurrentGraphqlApi(projectInfo.ProjectPath),
          resolvers: appsyncManager.getCurrentResolvers(projectInfo.ProjectPath),
          schema: appsyncManager.getCurrentSchema(projectInfo.ProjectPath)
        },
        devAppSyncInfo:{
          apiKeys: appsyncManager.getApiKeys(projectInfo.ProjectPath),
          dataSources: appsyncManager.getDataSources(projectInfo.ProjectPath),
          graphqlApi: appsyncManager.getGraphqlApi(projectInfo.ProjectPath),
          resolvers: appsyncManager.getResolvers(projectInfo.ProjectPath),
          schema: appsyncManager.getSchema(projectInfo.ProjectPath)
        }
      }
      trimDevAppSyncInfo(appsyncUpdateHandle)
      resolve(appsyncUpdateHandle)
    }
  })
}

function trimDevAppSyncInfo(appsyncUpdateHandle){
  //drop orphaned tables from the datasource spec
  let dataSources = appsyncUpdateHandle.devAppSyncInfo.dataSources.dataSources
  let tables = appsyncUpdateHandle.devAppSyncInfo.dataSources.tables
  let trimedTables = []
  for(let i=0; i<tables.length; i++){
    let table = tables[i]
    for(let j=0; j< dataSources.length; j++){
      let dataSource = dataSources[j]
      if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource.dynamodbConfig &&
        table.TableName == dataSource.dynamodbConfig.tableName &&
        table.Region == dataSource.dynamodbConfig.awsRegion){

        trimedTables.push(table)
        break
      }
    }
  }
  appsyncUpdateHandle.devAppSyncInfo.dataSources.tables = trimedTables
}

function diff(appsyncUpdateHandle){
  spinner.start('updating appsync: diff...')
  return new Promise((resolve, reject) => {
    let appSyncInfoDiff = {
      apiKeys: helperApiKeys.diff(appsyncUpdateHandle),
      dataSources: {
        dataSources: helperDataSources.diff(appsyncUpdateHandle),
        tables: helperDynamoDB.diff(appsyncUpdateHandle),
      },
      graphqlApi: helperGraphqlApi.diff(appsyncUpdateHandle),
      resolvers: helperResolvers.diff(appsyncUpdateHandle),
      schema: helperSchema.diff(appsyncUpdateHandle)
    }
    delete appsyncUpdateHandle.currentAppSyncInfo
    delete appsyncUpdateHandle.devAppSyncInfo
    Object.assign(appsyncUpdateHandle, appSyncInfoDiff)
    resolve(appsyncUpdateHandle)
  })
}

function createDDBTables(appsyncUpdateHandle){
  spinner.start('updating appsync: create DynamoDB tables...')
  mapDataSourceAndDDBTable(appsyncUpdateHandle)
  let createTableTasks = []
  let tableNameSuffix = nameManager.makeid(8)
  appsyncUpdateHandle.dataSources.tables.forEach(table => {
    if(table.dataSources && table.dataSources.length>0 && table[DIFF] == CREATE){
      table.TableName = table.TableName.replace(awsmobilejsConstant.Suffix, tableNameSuffix)
      table.dataSources.forEach(dataSource=>{
        dataSource.dynamodbConfig.tableName = table.TableName
      })
      createTableTasks.push(createDDBTable(appsyncUpdateHandle, table))
    }
  })
  return Promise.all(createTableTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function mapDataSourceAndDDBTable(appsyncUpdateHandle){
  let dataSources = appsyncUpdateHandle.dataSources.dataSources
  let tables = appsyncUpdateHandle.dataSources.tables
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

function createDDBTable(appsyncUpdateHandle, table){
  return new Promise((resolve, reject) => {
    let param = helperDynamoDB.constructCreateParam(table)
    let dynamoDBClient = awsClient.DynamoDB(appsyncUpdateHandle.awsDetails, table.Region)
    dynamoDBClient.createTable(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create dynamoDB table ' + param.TableName))
        console.log(err)
        reject(err)
      }else{
        table.details = data.TableDescription
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function updateDDBTables(appsyncUpdateHandle){
  spinner.start('updating appsync: update DynamoDB tables...')
  let updateTableTasks = []
  appsyncUpdateHandle.dataSources.tables.forEach(table => {
    if(table[DIFF] == UPDATE){
      updateTableTasks.push(updateDDBTable(appsyncUpdateHandle, table))
    }
  })
  return Promise.all(updateTableTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function updateDDBTable(appsyncUpdateHandle, table){
  return new Promise((resolve, reject) => {
    let param = helperDynamoDB.constructUpdateParam(table)
    let dynamoDBClient = awsClient.DynamoDB(appsyncUpdateHandle.awsDetails, table.Region)
    dynamoDBClient.updateTable(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to update dynamoDB table ' + param.TableName))
        console.log(err)
        reject(err)
      }else{
        table.details = data.TableDescription
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function waitForDDBTableToComplete(appsyncUpdateHandle){
  return appsyncWaitLogic.waitForDDBTables(appsyncUpdateHandle)
}

function createServiceRoles(appsyncUpdateHandle){ //create service role only for new tables
  spinner.start('updating appsync: create service roles...')
  let createRoleTasks = []
  let roleNameSuffix = nameManager.makeid(6)
  appsyncUpdateHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource.serviceRoleArn == awsmobilejsConstant.ByAWSMobileCLI){
      let tableName = dataSource.dynamodbConfig.tableName
      dataSource.serviceRoleSpec = serviceRoleHelper.constructCreateRoleParamForDDB(tableName, roleNameSuffix)
      createRoleTasks.push(createServiceRole(appsyncUpdateHandle, dataSource))
    }
  })
  return Promise.all(createRoleTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function createServiceRole(appsyncUpdateHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = dataSource.serviceRoleSpec
    let iamClient = awsClient.IAM(appsyncUpdateHandle.awsDetails)
    iamClient.createRole(param, (err, data)=>{
      if(err){
        console.log(chalk.red('Failed to create service roles ' + param.RoleName))
        console.log(err)
        reject(err)
      }else{
        dataSource.serviceRoleDetails = data
        dataSource.serviceRoleArn = dataSource.serviceRoleDetails.Role.Arn,
        resolve(appsyncUpdateHandle)
      }
    })
  })
}
function putRolePolicies(appsyncUpdateHandle){
  spinner.start('updating appsync: put service roles policies...')
  let putRolePolicyTasks = []
  appsyncUpdateHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource.serviceRoleDetails){
      dataSource.putServiceRoleSpec = serviceRoleHelper.constructPutRolePolicyParamForDDB(dataSource)
      putRolePolicyTasks.push(putRolePolicy(appsyncUpdateHandle, dataSource))
    }
  })
  return Promise.all(putRolePolicyTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function putRolePolicy(appsyncUpdateHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = dataSource.putServiceRoleSpec
    let iamClient = awsClient.IAM(appsyncUpdateHandle.awsDetails)
    iamClient.putRolePolicy(param, (err, data)=>{
      if(err){
        console.log(chalk.red('put service role policy err'))
        console.log(err)
        reject(err)
      }else{
        dataSource.putServiceRoleDetails = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function updateGraphqlApi(appsyncUpdateHandle){
  spinner.start('updating appsync: update graphql api...')
  return new Promise((resolve, reject) => {
    if(appsyncUpdateHandle.graphqlApi){
      let param = {
        apiId: appsyncUpdateHandle.appsyncInfo.apiId,
        name: appsyncUpdateHandle.graphqlApi.name
      }
      if(appsyncUpdateHandle.graphqlApi.authenticationType){
        param.authenticationType = appsyncUpdateHandle.graphqlApi.authenticationType
      }
      if(appsyncUpdateHandle.graphqlApi.userPoolConfig){
        param.userPoolConfig = appsyncUpdateHandle.graphqlApi.userPoolConfig
      }

      let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)
      appsyncClient.updateGraphqlApi(param, (err, data)=>{
        if(err){
          console.log(chalk.red('update graphal API err ' + param.name))
          console.log(err)
          reject(err)
        }else{
          appsyncUpdateHandle.updateGraphqlApiResponse = data
          resolve(appsyncUpdateHandle)
        }
      })
    }else{
      resolve(appsyncUpdateHandle)
    }
  })
}

function startSchemaCreation(appsyncUpdateHandle){
  spinner.start('updating appsync: create schema...')
  return new Promise((resolve, reject) => {
    if(appsyncUpdateHandle.schema){
      let param = {
        apiId: appsyncUpdateHandle.appsyncInfo.apiId,
        definition: appsyncUpdateHandle.schema.definition
      }
      let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)
      appsyncClient.startSchemaCreation(param, (err, data)=>{
        if(err){
          console.log(chalk.red('startSchemaCreation err '))
          console.log(err)
          reject(err)
        }else{
          appsyncUpdateHandle.schemaCreationResponse = data
          resolve(appsyncUpdateHandle)
        }
      })
    }else{
      resolve(appsyncUpdateHandle)
    }
  })
}

function waitForSchemaCreationToComplete(appsyncUpdateHandle){
  return new Promise((resolve, reject) => {
    appsyncWaitLogic.waitForSchemaCreation(appsyncUpdateHandle, appsyncUpdateHandle.appsyncInfo.apiId, (err, appsyncUpdateHandle)=>{
      if(err){
        reject(err)
      }else{
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function createDataSources(appsyncUpdateHandle){
  spinner.start('updating appsync: create data sources...')
  let createDataSourceTasks = []
  appsyncUpdateHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource[DIFF] == CREATE){
      createDataSourceTasks.push(createDataSource(appsyncUpdateHandle, dataSource))
    }
  })
  return Promise.all(createDataSourceTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function createDataSource(appsyncUpdateHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId,
      name: dataSource.name,
      description: dataSource.description ? dataSource.description : undefined,
      type: dataSource.type,
      serviceRoleArn: dataSource.serviceRoleArn,
      dynamodbConfig: dataSource.dynamodbConfig? dataSource.dynamodbConfig : undefined,
    }
    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.createDataSource(param, (err, data)=>{
      if(err){
        console.log(chalk.red('createDataSource err: ' + param.name))
        console.log(err)
        reject(err)
      }else{
        dataSource.dataSourceDetails = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function deleteDataSources(appsyncUpdateHandle){
  spinner.start('updating appsync: delete data sources...')
  let deleteDataSourceTasks = []
  appsyncUpdateHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource[DIFF] == DELETE){
      deleteDataSourceTasks.push(deleteDataSource(appsyncUpdateHandle, dataSource))
    }
  })
  return Promise.all(deleteDataSourceTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function deleteDataSource(appsyncUpdateHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId,
      name: dataSource.name
    }
    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.deleteDataSource(param, (err, data)=>{
      if(err){
        console.log(chalk.red('deleteDataSource err: ' + param.name))
        console.log(err)
        reject(err)
      }else{
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function updateDataSources(appsyncUpdateHandle){
  spinner.start('updating appsync: update data sources...')
  let updateDataSourceTasks = []
  appsyncUpdateHandle.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource[DIFF] == UPDATE){
      updateDataSourceTasks.push(updateDataSource(appsyncUpdateHandle, dataSource))
    }
  })
  return Promise.all(updateDataSourceTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function updateDataSource(appsyncUpdateHandle, dataSource){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId,
      name: dataSource.name,
      description: dataSource.description ? dataSource.description : undefined,
      type: dataSource.type,
      serviceRoleArn: dataSource.serviceRoleArn,
      dynamodbConfig: dataSource.dynamodbConfig? dataSource.dynamodbConfig : undefined,
    }
    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.updateDataSource(param, (err, data)=>{
      if(err){
        console.log(chalk.red('updateDataSource err: ' + param.name))
        console.log(err)
        reject(err)
      }else{
        dataSource.dataSourceDetails = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}


function createResolvers(appsyncUpdateHandle){
  spinner.start('updating appsync: create resolvers...')
  let createResolverTasks = []
  appsyncUpdateHandle.resolvers.forEach(resolver => {
    if(resolver[DIFF] == CREATE){
      createResolverTasks.push(createResolver(appsyncUpdateHandle, resolver))
    }
  })
  return Promise.all(createResolverTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function createResolver(appsyncUpdateHandle, resolver){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId,
    }
    Object.assign(param, resolver)
    delete param[DIFF]

    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.createResolver(param, (err, data)=>{
      if(err){
        console.log(chalk.red('createResolver err: ' + param.fieldName))
        console.log(err)
        reject(err)
      }else{
        resolver.details = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function deleteResolvers(appsyncUpdateHandle){
  spinner.start('updating appsync: delete resolvers...')
  let deleteResolverTasks = []
  appsyncUpdateHandle.resolvers.forEach(resolver => {
    if(resolver[DIFF] == DELETE){
      deleteResolverTasks.push(deleteResolver(appsyncUpdateHandle, resolver))
    }
  })
  return Promise.all(deleteResolverTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function deleteResolver(appsyncUpdateHandle, resolver){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId,
      typeName: resolver.typeName,
      fieldName: resolver.fieldName
    }

    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.deleteResolver(param, (err, data)=>{
      if(err){
        console.log(chalk.red('deleteResolver err: ' + param.fieldName))
        console.log(err)
        reject(err)
      }else{
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function updateResolvers(appsyncUpdateHandle){
  spinner.start('updating appsync: update resolvers...')
  let updateResolverTasks = []
  appsyncUpdateHandle.resolvers.forEach(resolver => {
    if(resolver[DIFF] == UPDATE){
      updateResolverTasks.push(updateResolver(appsyncUpdateHandle, resolver))
    }
  })
  return Promise.all(updateResolverTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function updateResolver(appsyncUpdateHandle, resolver){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId
    }
    Object.assign(param, resolver)
    delete param[DIFF]

    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)

    appsyncClient.updateResolver(param, (err, data)=>{
      if(err){
        console.log(chalk.red('updateResolver err: ' + param.fieldName))
        console.log(err)
        reject(err)
      }else{
        resolver.details = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function createApiKeys(appsyncUpdateHandle){
  spinner.start('updating appsync: create api keys...')
  let createApiKeysTasks = []
  appsyncUpdateHandle.apiKeys.forEach(apiKey => {
    if(apiKey[DIFF] == CREATE){
      createApiKeysTasks.push(createApiKey(appsyncUpdateHandle, apiKey))
    }
  })
  return Promise.all(createApiKeysTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function createApiKey(appsyncUpdateHandle, apiKey){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId
    }
    if(apiKey.description){
      param.description = apiKey.description
    }
    if(apiKey.expires){
      param.expires = apiKey.expires
    }

    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)
    appsyncClient.createApiKey(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        apiKey.details = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function deleteApiKeys(appsyncUpdateHandle){
  spinner.start('updating appsync: delete api keys...')
  let deleteApiKeysTasks = []
  appsyncUpdateHandle.apiKeys.forEach(apiKey => {
    if(apiKey[DIFF] == DELETE){
      deleteApiKeysTasks.push(deleteApiKey(appsyncUpdateHandle, apiKey))
    }
  })
  return Promise.all(deleteApiKeysTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function deleteApiKey(appsyncUpdateHandle, apiKey){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId, 
      id: apiKey.id
    }
    
    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)
    appsyncClient.deleteApiKey(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function updateApiKeys(appsyncUpdateHandle){
  spinner.start('updating appsync: update api keys...')
  let updateApiKeysTasks = []
  appsyncUpdateHandle.apiKeys.forEach(apiKey => {
    if(apiKey[DIFF] == UPDATE){
      updateApiKeysTasks.push(updateApiKey(appsyncUpdateHandle, apiKey))
    }
  })
  return Promise.all(updateApiKeysTasks).then((values)=>{
    return appsyncUpdateHandle
  })
}

function updateApiKey(appsyncUpdateHandle, apiKey){
  return new Promise((resolve, reject) => {
    let param = {
      apiId: appsyncUpdateHandle.appsyncInfo.apiId, 
      id: apiKey.id
    }
    if(apiKey.description){
      param.description = apiKey.description
    }
    if(apiKey.expires){
      param.expires = apiKey.expires
    }

    let appsyncClient = awsClient.AppSync(appsyncUpdateHandle.awsDetails)
    appsyncClient.updateApiKey(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        apiKey.details = data
        resolve(appsyncUpdateHandle)
      }
    })
  })
}


function onSuccess(appsyncUpdateHandle){
  spinner.stop()
  console.log('appsync udpate successful')
  let appsyncInfo = appsyncManager.getAppSyncInfo(appsyncUpdateHandle.projectInfo.ProjectPath)
  appsyncInfo.lastPushSuccessful = true
  appsyncManager.setAppSyncInfo(appsyncUpdateHandle.projectInfo.ProjectPath, appsyncInfo)
}

function onFailure(e){
  spinner.stop()
  console.log(chalk.red('appsync update failed'))
  console.log(e)
}

module.exports = {
  run
}
