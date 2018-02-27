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
const moment = require('moment')
const _ = require('lodash')

const _featureName = 'appsync'

const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const dfOps = require('../utils/directory-file-ops.js')

function enable(projectPath){
  let appsyncInfo = getSpec(projectPath)
  if(!appsyncInfo){
    appsyncInfo = appsyncSpecTemplate
  }
  appsyncInfo.AppSyncEnabled = true
  updateSpec(projectPath, appsyncInfo)

  placeAppSync(projectPath)
}

function disable(projectPath){
  let appsyncInfo = getSpec(projectPath)
  if(!appsyncInfo){
    appsyncInfo = appsyncSpecTemplate
  }
  appsyncInfo.AppSyncEnabled = false
  updateSpec(projectPath, appsyncInfo)
  
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
  let specFilePath = pathManager.getAppSyncSpecFilePath(projectPath)
  return dfOps.readJsonFile(specFilePath)
}

function updateSpec(projectPath, appSyncInfo){
  let specFilePath = pathManager.getAppSyncSpecFilePath(projectPath)
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

const appsyncSpecTemplate = {
  "AppSyncEnabled": true
}

module.exports = {
  enable, 
  disable,
  getSpec,
  updateSpec,
  placeAppSync,
  removeAppSync,
  getEnabledFeatures
}