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
const inquirer = require('inquirer')
const awsMobileRegions = require('../../aws-operations/aws-regions.js').regions
const appsyncManager = require('../../backend-operations/appsync-operations/appsync-manager.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const dfOps = require('../../utils/directory-file-ops.js')

const _featureName = 'appsync'

const AUTH_TYPES = [ 
  "AWS_IAM", 
  "API_KEY", 
  "AMAZON_COGNITO_USER_POOLS"
]

const DEFAULT_ACTIONS = [
  "ALLOW",
  "DENY"
]

function specify(projectInfo) {
  let graphqlApi = ensureFeatureEnabled(projectInfo)

  let defaultAuthType = "AWS_IAM"
  if(graphqlApi.authenticationType){
    defaultAuthType = graphqlApi.authenticationType
  }

  inquirer.prompt([
    {
        type: 'list',
        name: 'authType',
        message: "Please specify the auth type: ",
        choices: AUTH_TYPES,
        default: defaultAuthType
    }
  ]).then(function (answers) {
    if(answers.authType != graphqlApi.authenticationType){
      switchApiAuthType(projectInfo, graphqlApi, answers.authType)
    }else{
      switch(answers.authType){
        case "AWS_IAM": 
          configureForAuthTypeIAM(projectInfo, graphqlApi)
        break
        case "API_KEY": 
          configureForAuthTypeApiKey(projectInfo, graphqlApi)
        break
        case "AMAZON_COGNITO_USER_POOLS": 
          configureForAuthTypeCognitoUserPool(projectInfo, graphqlApi)
        break
      }
    }
  })
}

function ensureFeatureEnabled(projectInfo){
  let enabled = appsyncManager.getEnabledFeatures(projectInfo.ProjectPath)
  if(enabled.length == 0){
    appsyncManager.enable(projectInfo.ProjectPath)
  }
  return appsyncManager.getGraphqlApi(projectInfo.ProjectPath)
}


function switchApiAuthType(projectInfo, appsyncInfo, authType){
  let srcFileName = 'graphqlApi_iam.json'
  switch(authType){
    case "AWS_IAM": 
      srcFileName = 'graphqlApi_iam.json'
    break
    case "API_KEY": 
      srcFileName = 'graphqlApi_apiKey.json'
    break
    case "AMAZON_COGNITO_USER_POOLS": 
      srcFileName = 'graphqlApi_cognito.json'
    break
  }

  let templateDirPath = pathManager.getAppSyncTemplateDirPath()
  let configurableDirPath = path.join(templateDirPath, awsmobilejsConstant.AppSyncConfigurablesDirName)
  let srcFilePath = path.join(configurableDirPath, srcFileName)

  let graphqlApi = dfOps.readJsonFile(srcFilePath)

  switch(authType){
    case "AWS_IAM": 
      configureForAuthTypeIAM(projectInfo, graphqlApi)
    break
    case "API_KEY": 
      configureForAuthTypeApiKey(projectInfo, graphqlApi)
    break
    case "AMAZON_COGNITO_USER_POOLS": 
      configureForAuthTypeCognitoUserPool(projectInfo, graphqlApi)
    break
  }
}

function configureForAuthTypeIAM(projectInfo, graphqlApi){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let graphqlApiFilePath = path.join(featureDirPath, 'graphqlApi.json')
  dfOps.writeJsonFile(graphqlApiFilePath, graphqlApi)
}

function configureForAuthTypeCognitoUserPool(projectInfo, graphqlApi){
  checkUserPoolConfig(projectInfo, graphqlApi)
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let graphqlApiFilePath = path.join(featureDirPath, 'graphqlApi.json')
  let questions = [
    {
        type: 'input',
        name: 'userPoolId',
        message: "user pool id: ",
        default: graphqlApi.userPoolConfig.userPoolId
    },
    {
        type: 'list',
        name: 'awsRegion',
        message: "region: ",
        choices: awsMobileRegions,
        default: graphqlApi.userPoolConfig.awsRegion
    },
    {
        type: 'list',
        name: 'defaultAction',
        message: "default action: ",
        choices: DEFAULT_ACTIONS,
        default: graphqlApi.userPoolConfig.defaultAction
    }
  ]
  inquirer.prompt(questions).then((answers) => {
    Object.assign(graphqlApi.userPoolConfig, answers)
    dfOps.writeJsonFile(graphqlApiFilePath, graphqlApi)
  })
}

function configureForAuthTypeApiKey(projectInfo, graphqlApi){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let graphqlApiFilePath = path.join(featureDirPath, 'graphqlApi.json')
  dfOps.writeJsonFile(graphqlApiFilePath, graphqlApi)
  let apiKeys = appsyncManager.getApiKeys(projectInfo.ProjectPath)
  if(!apiKeys || apiKeys.length == 0){
    apiKeys = [{}]
    appsyncManager.setApiKeys(projectInfo.ProjectPath, apiKeys)
  }
}

function checkUserPoolConfig(projectInfo, graphqlApi){
  if(!graphqlApi.userPoolConfig){
    graphqlApi.userPoolConfig = {
      "userPoolId": "<userPoolId>",
      "awsRegion": "us-east-1",
      "defaultAction": "ALLOW",
      "appIdClientRegex": null
    }
  }
  if(!graphqlApi.userPoolConfig.userPoolId || 
    graphqlApi.userPoolConfig.userPoolId == '<userPoolId>'){
    let currentUserPool = getCurentUserPool(projectInfo.ProjectPath)
    if(currentUserPool){
      graphqlApi.userPoolConfig.userPoolId = currentUserPool['user-pools-id']
      graphqlApi.userPoolConfig.awsRegion = currentUserPool['region']
    }
  }
  if(!graphqlApi.userPoolConfig.defaultAction || !DEFAULT_ACTIONS.includes(graphqlApi.userPoolConfig.defaultAction)){
    graphqlApi.defaultAction = "ALLOW"
  }
}

function getCurentUserPool(projectPath){
  let currentUserPool
  let currentBackendDetailsFilePath = pathManager.getCurrentBackendDetailsFilePath(projectPath)
  if(fs.existsSync(currentBackendDetailsFilePath)){
    let backendDetails = dfOps.readJsonFile(currentBackendDetailsFilePath)
    if(backendDetails && backendDetails.resources && backendDetails.resources.length>0){
      for(let i=0; i<backendDetails.resources.length; i++){
        let resource = backendDetails.resources[i]
        if(resource.type == "AWS::Cognito::UserPool" && 
          resource.feature == "user-signin" && 
          resource.attributes && resource.attributes['user-pools-id'] && resource.attributes['region']){
          currentUserPool = {
            'user-pools-id': resource.attributes['user-pools-id'], 
            'region': resource.attributes['region']
          }
          break
        }else{
          continue
        }
      }
    }
  }
  return currentUserPool
}

function onFeatureTurnOn(projectInfo, cloudProjectSpec) {
}

function onFeatureTurnOff(projectInfo, cloudProjectSpec) {
}

module.exports = {
  specify,
  onFeatureTurnOn,
  onFeatureTurnOff
}
