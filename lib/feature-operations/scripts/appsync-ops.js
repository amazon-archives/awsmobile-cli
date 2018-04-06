"use strict";

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const yamlSchema = require('../../aws-operations/mobile-yaml-schema')
const yamlOps = require('../../aws-operations/mobile-yaml-ops')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const awsMobileRegions = require('../../aws-operations/aws-regions.js').regions
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

exports.specify = function (projectInfo, appsyncInfo) {
  if(!appsyncInfo){
    appsyncInfo = enableFeature(projectInfo.ProjectPath)
  }
  let defaultAuthType = "AWS_IAM"
  if(appsyncInfo.authenticationType){
    defaultAuthType = appsyncInfo.authenticationType
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
    if(answers.authType != appsyncInfo.authenticationType){
      switchApiAuthType(projectInfo, appsyncInfo, answers.authType)
    }
  })
}

function enableFeature(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  if(fs.existsSync(featureDirPath)){
    fs.removeSync(featureDirPath)
  }
  let templateDirPath = pathManager.getAppSyncTemplateDirPath()
  fs.copySync(templateDirPath, featureDirPath, {filter: (path)=>{return path.indexOf(awsmobilejsConstant.AppSyncConfigurablesDirName)<0 }})

  let appsyncInfo = getAppSyncInfo(projectPath)
  if(!appsyncInfo){
    appsyncInfo = {}
  }
  appsyncInfo.freshLocalEnableDisableFlag = 'enable'
  updateAppSyncInfo(projectPath, appsyncInfo)
  return appsyncInfo
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
    console.log('Please specify the Cognito user pool: ')
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
  }else{
    dfOps.writeJsonFile(destFilePath, graphqlApiObj)
  }
}

exports.onFeatureTurnOn = function (projectInfo, cloudProjectSpec) {
  console.log('appsync on......')
}

exports.onFeatureTurnOff = function (projectInfo, cloudProjectSpec) {
  console.log('appsync off......')
}