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
const _ = require('lodash')

const _featureName = 'appsync'

const awsClient = require('../aws-operations/aws-client.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const dfOps = require('../utils/directory-file-ops.js')

const authTypes = ["API_KEY", "AWS_IAM", "AMAZON_COGNITO_USER_POOLS"]

function run(projectInfo, awsDetails){

  let appsyncSpec = dfOps.readJsonFile(pathManager.getAppSyncSpecFilePath(projectInfo.ProjectPath))
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let settings = dfOps.readJsonFile(path.join(featureDirPath, 'settings.json'))
 
  let appsyncCreationHandle = {
    projectInfo,
    awsDetails,
    appsyncSpec,
    featureDirPath,
    settings
  }

  console.log('graph ql ////////////////')
  return createDDB(appsyncCreationHandle)
          .then(createLambdaFunction)
          .then(createServiceRole)
          .then(createGraphqlApi)
          .then(startSchemaCreation)
          .then(createDataSources)
          .then(createResolvers)
          .then(createApiKey)
          .then(onSuccess)
          .catch(onFailure)
}

function createDDB(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createDynamoDB()

function createLambdaFunction(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createServiceRole(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createGraphqlApi(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    let param = {
      name: appsyncCreationHandle.settings.APIName,
      authenticationType: 'API_KEY'
    }
    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)

    appsyncClient.createGraphqlApi(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        appsyncCreationHandle.createGraphqlApiResponse = data
        console.log('createGraphqlApi', data)
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function startSchemaCreation(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    let param = {
      apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
      definition: fs.readFileSync(path.join(appsyncCreationHandle.featureDirPath, 'schema.graphql'))
    }
    let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)
    appsyncClient.startSchemaCreation(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        appsyncCreationHandle.startSchemaCreationResponse = data
        console.log('startSchemaCreation', data)
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function createDataSources(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createResolvers(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function createApiKey(appsyncCreationHandle){
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
        console.log('createAPIKey', data)
        resolve(appsyncCreationHandle)
      }
    })
  })
}

function getExportJS(appsyncCreationHandle){
  return new Promise((resolve, reject) => {
    resolve(appsyncCreationHandle)
  })
}

function onSuccess(appsyncCreationHandle){
  console.log('appsync creation done')
}

function onFailure(e){
  console.log(chalk.red('appsync createion failed'))
}

module.exports = {
  run
}
