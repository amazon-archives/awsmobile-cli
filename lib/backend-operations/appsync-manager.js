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

const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const dfOps = require('../utils/directory-file-ops.js')

function enable(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  if(fs.existsSync(featureDirPath)){
    let appsyncSpec = getSpec(projectPath)
    if(!appsyncSpec){
      appsyncSpec = appsyncSpecTemplate
    }
    appsyncSpec.AppSyncEnabled = true
    updateSpec(projectPath, appsyncSpec)
  }else{
    placeAppSync(projectPath)
  }
}

function disable(projectPath){
  removeAppSync(projectPath)
}

function getEnabledFeatures(projectPath){
  let result = []
  let spec = getSpec(projectPath)
  if(spec && spec.AppSyncEnabled){
    result.push(_featureName)
  }
  return result
}

function getSpec(projectPath){
  let specFilePath = getAppSyncSpecFilePath(projectPath)
  return dfOps.readJsonFile(specFilePath)
}

function updateSpec(projectPath, appSyncInfo){
  let specFilePath = getAppSyncSpecFilePath(projectPath)
  const jsonString = JSON.stringify(appSyncInfo, null, '\t')
  fs.writeFileSync(specFilePath, jsonString, 'utf8')
}

function placeAppSync(projectPath) {
  let templateDirPath = pathManager.getAppSyncTemplateDirPath()
  let appSyncDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  fs.copySync(templateDirPath, appSyncDirPath)
}

function removeAppSync(projectPath) {
  let appSyncDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  fs.removeSync(appSyncDirPath)
}

function getAppSyncSpecFilePath(projectPath){
  let featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
  return path.join(featureDirPath, 'appsync-spec.json')
}

function setAppSyncJS(projectPath, appsyncJSObj){
  let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)

  let content = "export default {" + os.EOL

  Object.keys(appsyncJSObj).forEach(function(key) {
    var val = appsyncJSObj[key]
    content += '\t"' + key + '": "' + val + '",' + os.EOL
  })

  content += "}"

  fs.writeFileSync(appsyncJSFilePath, content.trim())
}

function getAppSyncJS(projectPath){
  let result
  let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)

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

  return result
}

module.exports = {
  enable, 
  disable,
  getSpec,
  updateSpec,
  placeAppSync,
  removeAppSync,
  getEnabledFeatures,
  getAppSyncSpecFilePath, 
  getAppSyncJS,
  setAppSyncJS
}