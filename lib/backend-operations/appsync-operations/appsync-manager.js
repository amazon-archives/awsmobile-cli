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
const moment = require('moment')
const lineByLine = require('n-readlines')

const _featureName = 'appsync'

const resolversHelper = require('./helpers/helper-resolvers.js')
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../utils/awsmobilejs-constant.js')
const dfOps = require('../../utils/directory-file-ops.js')

function enable(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  if(fs.existsSync(featureDirPath)){
    let now = new Date()
    fs.utimesSync(featureDirPath, now, now)
    markAppsyncInfoLocalFlag('enable')
  }else{
    let templateDirPath = pathManager.getAppSyncTemplateDirPath()
    fs.copySync(templateDirPath, featureDirPath, {filter: (path)=>{return path.indexOf(awsmobilejsConstant.AppSyncConfigurablesDirName)<0 }})
    markAppsyncInfoLocalFlag('enable')
  }
}


function markAppsyncInfoLocalFlag(freshLocalEnableDisableFlag){
  let appsyncInfo = getAppSyncInfo(projectPath)
  if(!appsyncInfo){
    appsyncInfo = {}
  }
  appsyncInfo.freshLocalEnableDisableFlag = freshLocalEnableDisableFlag
  setAppSyncInfo(projectPath, appsyncInfo)
}

function disable(projectPath){
  //should not completely wipe out the appsync information, the user can change his mind and do a pull
  //and sync to dev, 
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  markAppsyncInfoLocalFlag('disable')
  fs.removeSync(featureDirPath)
}

function getAppSyncInfo(projectPath){
  let appsyncInfoFilePath = pathManager.getAppSyncInfoFilePath(projectPath)
  let appsyncInfo = dfOps.readJsonFile(appsyncInfoFilePath)
  return appsyncInfo
}

function setAppSyncInfo(projectPath, appsyncInfo){
  if(appsyncInfo && appsyncInfo.apiId && appsyncInfo.region){
    appsyncInfo.AppSyncConsoleUrl = awsmobilejsConstant.AppSyncConsoleUrl.replace('{apiId}', appsyncInfo.apiId).replace('{region}', appsyncInfo.region)
  }
  let appsyncInfoFilePath = pathManager.getAppSyncInfoFilePath(projectPath)
  return dfOps.writeJsonFile(appsyncInfoFilePath, appsyncInfo)
}

function clearAppSyncInfo(projectPath){
  let appsyncInfo = {}
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)
  
  setAppSyncInfo(projectPath, appsyncInfo)
  fs.removeSync(featureDirPath)
  fs.removeSync(appsyncJSFilePath)
}

function getEnabledFeatures(projectPath){
  let result = []
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  if(fs.existsSync(featureDirPath)){
    result.push(_featureName)
  }
  return result
}

function getMapping(projectPath, name){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let resolverMappingsDirPath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
  let filePath = path.join(resolverMappingsDirPath, name)
  return fs.readFileSync(filePath).toString()
}

function getCurrentMapping(projectPath, name){
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let resolverMappingsDirPath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
  let filePath = path.join(resolverMappingsDirPath, name)
  return fs.readFileSync(filePath).toString()
}

function getApiKeys(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncApiKeysFileName)
  return dfOps.readJsonFile(filePath)
}

function getCurrentApiKeys(projectPath){
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncApiKeysFileName)
  return dfOps.readJsonFile(filePath)
}

function getDataSources(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncDataSourcesFileName)
  return dfOps.readJsonFile(filePath)
}

function getCurrentDataSources(projectPath){
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncDataSourcesFileName)
  return dfOps.readJsonFile(filePath)
}

function getGraphqlApi(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncGraphqlApiFileName)
  return dfOps.readJsonFile(filePath)
}

function getCurrentGraphqlApi(projectPath){
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncGraphqlApiFileName)
  return dfOps.readJsonFile(filePath)
}

function getResolvers(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolversFileName)
  let resolvers = dfOps.readJsonFile(filePath)

  resolvers.forEach(resolver=>{
    resolversHelper.readResolverMappings(featureDirPath, resolver)
  })

  return resolvers
}

function getCurrentResolvers(projectPath){
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolversFileName)
  let resolvers = dfOps.readJsonFile(filePath)

  if(resolvers){
    resolvers.forEach(resolver=>{
      resolversHelper.readResolverMappings(featureDirPath, resolver)
    })
  }

  return resolvers
}

function getSchema(projectPath){
  let result = {}
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncSchemaFileName)
  result.definition = fs.readFileSync(filePath).toString()
  return result
}

function getCurrentSchema(projectPath){
  let result = {}
  let featureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
  let filePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncSchemaFileName)
  result.definition = fs.readFileSync(filePath).toString()
  return result
}

function getAppSyncJS(projectPath){
  let result
  let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)

  if(fs.existsSync(appsyncJSFilePath)){
    let content = fs.readFileSync(appsyncJSFilePath)
    let lines = content.toString().split(os.EOL)
  
    let inObject = false
    let temp = {}
    for(let i = 0; i<lines.length; i++){
      let line = lines[i]
      if(/{$/.test(line)){
        inObject = true
      }else if(/}$/.test(line)){
        if(inObject){
          result = temp
          break
        }
      }else if(inObject){
        let index = line.indexOf(":")
        let key = line.slice(0, index).trim().replace(/,$/, '').replace(/^"/,'').replace(/"$/,'')
        let value = line.slice(index+1).trim().replace(/,$/, '').replace(/^"/,'').replace(/"$/,'')
        temp[key] = value
      }
    }
  }

  return result
}

function setAppSyncJS(projectPath, appsyncInfo){
  let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)

  let appsyncJS ={
    graphqlEndpoint: appsyncInfo.graphqlEndpoint,
    region: appsyncInfo.region,
    authenticationType: appsyncInfo.authenticationType
  }

  if(appsyncInfo.apiKey){
    appsyncJS.apiKey = appsyncInfo.apiKey
  }

  let content = "export default {" + os.EOL
  Object.keys(appsyncJS).forEach(function(key) {
    var val = appsyncJS[key]
    content += '\t"' + key + '": "' + val + '",' + os.EOL
  })
  content += "}"

  fs.writeFileSync(appsyncJSFilePath, content.trim())
}

const appsyncInfoTemplate = {
  "apiId": "",
  "name": "",
  "graphqlEndpoint": "",
  "region": "us-east-1",
  "authenticationType": "API_KEY",
  "creationTime": "",
  "lastUpdateTime": "",
  "lastSyncTime": "",
  "apiKey": "da2-",
  "lastSyncToDevTime": "",
  "freshLocalEnableFlag": false, 
  "AppSyncConsoleUrl": "",
}

module.exports = {
  enable, 
  disable,
  getAppSyncInfo,
  setAppSyncInfo,
  clearAppSyncInfo,
  getEnabledFeatures,
  getMapping,
  getApiKeys,
  getDataSources,
  getGraphqlApi,
  getResolvers,
  getSchema,
  getCurrentMapping,
  getCurrentApiKeys,
  getCurrentDataSources,
  getCurrentGraphqlApi,
  getCurrentResolvers,
  getCurrentSchema,
  getAppSyncJS,
  setAppSyncJS,
}