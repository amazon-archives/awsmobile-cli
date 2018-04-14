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

  let graphqlApiObj = dfOps.readJsonFile(srcFilePath)

  let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
  let destFilePath = path.join(featureDirPath, 'graphqlApi.json')

  if(authType == "AMAZON_COGNITO_USER_POOLS"){
    let questions = [
      {
          type: 'input',
          name: 'userPoolId',
          message: "user pool id: ",
          default: graphqlApiObj.userPoolConfig.userPoolId
      },
      {
          type: 'list',
          name: 'awsRegion',
          message: "region: ",
          choices: awsMobileRegions,
          default: graphqlApiObj.userPoolConfig.awsRegion
      },
      {
          type: 'list',
          name: 'defaultAction',
          message: "default action: ",
          choices: DEFAULT_ACTIONS,
          default: graphqlApiObj.userPoolConfig.defaultAction
      }
    ]
    inquirer.prompt(questions).then((answers) => {
      Object.assign(graphqlApiObj.userPoolConfig, answers)
      dfOps.writeJsonFile(destFilePath, graphqlApiObj)
    })
  }else if(authType == "API_KEY"){
    dfOps.writeJsonFile(destFilePath, graphqlApiObj)
    let apiKeys = appsyncManager.getApiKeys(projectInfo.ProjectPath)
    if(!apiKeys || apiKeys.length == 0){
      apiKeys = [{}]
      appsyncManager.setApiKeys(projectInfo.ProjectPath, apiKeys)
    }
  }else if(authType == "AWS_IAM"){
    dfOps.writeJsonFile(destFilePath, graphqlApiObj)
  }
}

function configureForAuthTypeCognito(){

}

function configureForAuthTypeCognito(){
  
}

function configureForAuthTypeCognito(){
  
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
