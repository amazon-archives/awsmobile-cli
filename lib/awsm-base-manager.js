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

const pathManager = require('./utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')

function placeAwsmobileBase(projectPath) {
  let backupAWSMobileJSDirPath = backupAwsmobileBase(projectPath)
  ensureFolderStructure(projectPath)
  return backupAWSMobileJSDirPath
}

function backupAwsmobileBase(projectPath){
  let backupAWSMobileJSDirPath

  const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
  if(fs.existsSync(awsmobilejsDirPath)){
    const backupAWSMobileJSDirName =  awsmobileJSConstant.AWSMobileJSBackUpDirName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
    backupAWSMobileJSDirPath = path.normalize(path.join(projectPath, backupAWSMobileJSDirName))
    fs.renameSync(awsmobilejsDirPath, backupAWSMobileJSDirPath)
  }

  return backupAWSMobileJSDirPath
}

function cloneAWSMobileBase(projectPath){
	let backupAWSMobileJSDirPath
  
	const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
	if(fs.existsSync(awsmobilejsDirPath)){
	  const backupAWSMobileJSDirName =  awsmobileJSConstant.AWSMobileJSBackUpDirName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
	  backupAWSMobileJSDirPath = path.normalize(path.join(projectPath, backupAWSMobileJSDirName))
	  fs.copySync(awsmobilejsDirPath, backupAWSMobileJSDirPath)
	}
  
	return backupAWSMobileJSDirPath
}

function ensureFolderStructure(projectPath){
  
  const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)

  fs.ensureDirSync(awsmobilejsDirPath)

  const dotAwsMobileDirPath = pathManager.getDotAWSMobileDirPath(projectPath)
  const infoSubDirPath = pathManager.getInfoDirPath(projectPath)
  const currentBackendInfoDirPath = pathManager.getCurrentBackendInfoDirPath(projectPath)
  const backendDirPath = pathManager.getBackendDirPath(projectPath)
  const backendBuildDirPath = pathManager.getBackendBuildDirPath(projectPath)

  fs.ensureDirSync(dotAwsMobileDirPath)
  fs.ensureDirSync(backendBuildDirPath)
  fs.ensureDirSync(infoSubDirPath)
  fs.ensureDirSync(currentBackendInfoDirPath)
  fs.ensureDirSync(backendDirPath)
}

module.exports = {
  placeAwsmobileBase, 
  backupAwsmobileBase,
  cloneAWSMobileBase,
  ensureFolderStructure
}