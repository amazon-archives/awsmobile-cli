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
          // .then(listApiKeys)
          // .then(listResolvers)
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

function getIntrospectionSchema(appsyncRetrieveHandle){
  console.log('appsync retrieve: GetIntrospectionSchema...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId, 
      format: 'JSON'
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.getIntrospectionSchema(param, (err, data)=>{
      if(err){
        console.log(chalk.red('GetIntrospectionSchema err '))
        console.log(err)
        reject(err)
      }else{
        console.log(data)
        appsyncRetrieveHandle.getIntrospectionSchemaResponse = data
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
  console.log('appsync retrieve: ListResolvers...')
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncRetrieveHandle.apiId
    }
    let appsyncClient = awsClient.AppSync(appsyncRetrieveHandle.awsDetails)
    appsyncClient.listResolvers(param, (err, data)=>{
      if(err){
        console.log(chalk.red('listResolvers err '))
        console.log(err)
        reject(err)
      }else{
        appsyncRetrieveHandle.listResolversResponse = data
        resolve(appsyncRetrieveHandle)
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
  console.log('appsync retrieve complete: ////////////////////////////////')

  console.log(appsyncRetrieveHandle.listTypesResponse)
  let content = appsyncRetrieveHandle.listTypesResponse.types.map(t=>t.definition).join(os.EOL)

  let filePath = path.join(pathManager.getCurrentBackendInfoDirPath(appsyncRetrieveHandle.projectInfo.ProjectPath), 'schema.graphql')
  //let jsonString = JSON.stringify(appsyncRetrieveHandle.listTypesResponse, null, '\t')
  fs.writeFileSync(filePath, content, 'utf8')
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
