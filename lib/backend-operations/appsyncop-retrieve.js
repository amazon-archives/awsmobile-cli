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
const graphql = require('graphql')

const _featureName = 'appsync'

const appsyncManager = require('./appsync-manager.js')
const serviceRoleHelper = require('./appsync-helper-service-role.js')
const appsyncWaitLogic = require('./appsync-wait-logic.js')
const awsClient = require('../aws-operations/aws-client.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const dfOps = require('../utils/directory-file-ops.js')
const projectInfoManager = require('../project-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const awsConfigManager = require('../aws-operations/aws-config-manager.js')

function runTest(projectInfo, args){
  awsConfigManager.checkAWSConfig(function(awsDetails){
    run(projectInfo, awsDetails)
  })
}

function run(projectInfo, awsDetails){
  let appsyncRetrieveHandle = {
    projectInfo: projectInfo,
    apiId: projectInfo.AppsyncApiId, 
    awsDetails: awsDetails
  }

  return listDataSources(appsyncRetrieveHandle)
          .then(listTypes)
          .then(listApiKeys)
          .then(listResolvers)
          .then(onSuccess)
          .catch(onFailure)

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
    appsyncRetrieveHandle.listResolversResponse = values
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
  let currentFeatureInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(appsyncRetrieveHandle.projectInfo.ProjectPath, _featureName)
  fs.ensureDirSync(currentFeatureInfoDirPath)

  let schemaContent = appsyncRetrieveHandle.listTypesResponse.types.map(t=>t.definition.replace(/\n+/g, '\n')).join(os.EOL + os.EOL)
  let schemaFilePath = path.join(currentFeatureInfoDirPath, 'schema.graphql')
  fs.writeFileSync(schemaFilePath, schemaContent, 'utf8')

  let apiKeyFilePath  = path.join(currentFeatureInfoDirPath, 'apiKey.json')
  fs.writeFileSync(apiKeyFilePath, JSON.stringify(appsyncRetrieveHandle.listApiKeysResponse, null, '\t'), 'utf8')


  let resolversFilePath  = path.join(currentFeatureInfoDirPath, 'resolvers.json')
  fs.writeFileSync(resolversFilePath, JSON.stringify(appsyncRetrieveHandle.listResolversResponse, null, '\t'), 'utf8')

  let dataSourcesFilePath  = path.join(currentFeatureInfoDirPath, 'dataSources.json')
  fs.writeFileSync(dataSourcesFilePath, JSON.stringify(appsyncRetrieveHandle.listDataSourcesResponse, null, '\t'), 'utf8')
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
