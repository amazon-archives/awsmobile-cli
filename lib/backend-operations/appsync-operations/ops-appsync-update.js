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

function runTest(projectInfo, args){
  awsConfigManager.checkAWSConfig(function(awsDetails){
    run(projectInfo, awsDetails)
  })
}

function run(projectInfo, awsDetails){
  return setupHandle(projectInfo, awsDetails)
          .then(diff)
          .then(createDDBTables)
          .then(createServiceRoles)
          .then(putRolePolicies)
          .then(updateDDBTables)
          .then(updateGraphqlApi)
          .then(startSchemaCreation)
          .then(waitForSchemaCreationToComplete)
          .then(createDataSources)
          .then(updateDataSources)
          .then(createResolvers)
          .then(updateResolvers)
          .then(createApiKeys)
          .then(updateApiKeys)
          .then(onSuccess)
          .catch(onFailure)
}

function setupHandle(projectInfo, awsDetails){ 
  return new Promise((resolve, reject) => {
    let appsyncUpdateHandle = {
      projectInfo,
      awsDetails,
      featureDirPath: pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName),
      currentAppSyncInfo:{
        apiKeys: helperApiKeys.dressForDevBackend(appsyncManager.getCurrentApiKeys(projectInfo.ProjectPath)),
        dataSources: helperDataSources.dressForDevBackend(appsyncManager.getCurrentDataSources(projectInfo.ProjectPath)),
        graphqlApi: helperGraphqlApi.dressForDevBackend(appsyncManager.getCurrentGraphqlApi(projectInfo.ProjectPath)),
        resolvers: helperResolvers.dressForDevBackend(appsyncManager.getCurrentResolvers(projectInfo.ProjectPath)),
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
    resolve(appsyncUpdateHandle)
  })
}

function diff(appsyncUpdateHandle){
  console.log('appsync update: diff...')
  return new Promise((resolve, reject) => {
    appsyncUpdateHandle.appSyncInfoDiff = {
      apiKeys: helperApiKeys.diff(appsyncUpdateHandle),
      dataSources: {
        dataSources: helperDataSources.diff(appsyncUpdateHandle),
        tables: helperDynamoDB.diff(appsyncUpdateHandle),
      },
      graphqlApi: helperGraphqlApi.diff(appsyncUpdateHandle),
      resolvers: helperResolvers.diff(appsyncUpdateHandle),
      schema: helperSchema.diff(appsyncUpdateHandle)
    }
    resolve(appsyncUpdateHandle)
  })
}

function createDDBTables(appsyncUpdateHandle){
  console.log('appsync update: createDDBTables...')
  mapDataSourceAndDDBTable(appsyncUpdateHandle)
  console.log(util.inspect(appsyncUpdateHandle.appSyncInfoDiff, false, null))
  let createTableTasks = []
  let tableNameSuffix = nameManager.makeid(8)
  appsyncUpdateHandle.appSyncInfoDiff.dataSources.tables.forEach(table => {
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
  let dataSources = appsyncUpdateHandle.appSyncInfoDiff.dataSources.dataSources
  let tables = appsyncUpdateHandle.appSyncInfoDiff.dataSources.tables
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
    let param = {}
    Object.assign(param, table)
    delete param.Region
    delete param.dataSources
    delete param.diff
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

function createServiceRoles(appsyncUpdateHandle){ //create service role only for new tables
  console.log('appsync update: createServiceRoles...')
  let createRoleTasks = []
  let roleNameSuffix = nameManager.makeid(6)
  appsyncUpdateHandle.appSyncInfoDiff.dataSources.dataSources.forEach(dataSource => {
    if(dataSource.type == 'AMAZON_DYNAMODB' && 
    dataSource.serviceRoleArn == awsmobilejsConstant.ByAWSMobileCLI &&
    dataSource.table && dataSource.table[DIFF] && dataSource.table[DIFF] == CREATE){
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
        resolve(appsyncUpdateHandle)
      }
    })
  })
}

function putRolePolicies(appsyncUpdateHandle){
  console.log('appsync update: putRolePolicies...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function updateDDBTables(appsyncUpdateHandle){
  console.log('appsync update: updateDDBTables...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function updateGraphqlApi(appsyncUpdateHandle){
  console.log('appsync update: updateGraphqlApi...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function startSchemaCreation(appsyncUpdateHandle){
  console.log('appsync update: startSchemaCreation...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function waitForSchemaCreationToComplete(appsyncUpdateHandle){
  console.log('appsync update: waitForSchemaCreationToComplete...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function createDataSources(appsyncUpdateHandle){
  console.log('appsync update: createDataSources...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function updateDataSources(appsyncUpdateHandle){
  console.log('appsync update: updateDataSources...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function createResolvers(appsyncUpdateHandle){
  console.log('appsync update: createResolvers...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function updateResolvers(appsyncUpdateHandle){
  console.log('appsync update: updateResolvers...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function createApiKeys(appsyncUpdateHandle){
  console.log('appsync update: createApiKeys...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}

function updateApiKeys(appsyncUpdateHandle){
  console.log('appsync update: updateApiKeys...')
  return new Promise((resolve, reject) => {
    resolve(appsyncUpdateHandle)
  })
}


function onSuccess(appsyncUpdateHandle){
  console.log(util.inspect(appsyncUpdateHandle.appSyncInfoDiff, false, null))
  console.log('appsync udpate successful...')
}

function onFailure(e){
  console.log(chalk.red('appsync update failed'))
  console.log(e)
  process.exit(1)
}

module.exports = {
  run, 
  runTest
}
