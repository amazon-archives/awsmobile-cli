/* 
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const downloadGitRepo = require('download-git-repo')
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')
const moment = require('moment')
const _ = require('lodash')

const projectValidator = require('./project-validator.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const backendFormats = require('./backend-operations/backend-formats.js')

function placeAwsmobileBase(projectPath, callback) {
  
  let awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
  if(fs.existsSync(awsmobilejsDirPath)){
    let backupAWSMobileJSDirName =  awsmobileJSConstant.AWSMobileJSBackUpDirName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
    let backupAWSMobileJSDirPath = path.normalize(path.join(projectPath, backupAWSMobileJSDirName))
    fs.renameSync(awsmobilejsDirPath, backupAWSMobileJSDirPath)
    fs.emptydir(awsmobilejsDirPath)
  }

  let srcDirPath = path.normalize(path.join(__dirname, '../awsmobilejs'))
 
  fs.copySync(srcDirPath, awsmobilejsDirPath)

  if(callback){
    callback()
  }
}

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//sync base operations on the new awsmobilejs folder:
// .awsmobile/backend-build: do nothing, leave empty
// .awsmobile/info: fill in the existing values from the backup file
// #current-backend-info: copy over from the backup dir
// backend: copy over from the backup dir
function syncBase(projectPath, callback) {
    let currentAWSMobileJSDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
    let backupAWSMobileJSDirName =  awsmobileJSConstant.AWSMobileJSBackUpDirName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
    let backupAWSMobileJSDirPath = path.normalize(path.join(projectPath, backupAWSMobileJSDirName))
    fs.renameSync(currentAWSMobileJSDirPath, backupAWSMobileJSDirPath)
    fs.emptydir(currentAWSMobileJSDirPath)

    placeAwsmobileBase(projectPath, function(){
      let projectInfo = fillProjectInfo(projectPath, backupAWSMobileJSDirPath)
      copyCurrentBackendInfo(projectPath, backupAWSMobileJSDirPath)
      copyBackend(projectPath, backupAWSMobileJSDirPath)
      if(callback){
        callback(projectInfo)
      }
    })
}

function fillProjectInfo(projectPath, backupAWSMobileJSDirPath){

  let projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
  let projectInfo = JSON.parse(fs.readFileSync(projectInfoFilePath, 'utf8'))

  let backupDotAwsmobileDirPath = path.join(backupAWSMobileJSDirPath, awsmobileJSConstant.DotAWSMobileSubDirName)
  let backupInfoDirPath = path.join(backupDotAwsmobileDirPath, awsmobileJSConstant.InfoDirName)
  let backupProjectInfoFilePath = path.join(backupInfoDirPath, awsmobileJSConstant.ProjectInfoFileName)
  let backupProjectInfo = JSON.parse(fs.readFileSync(backupProjectInfoFilePath, 'utf8'))

  _.keys(projectInfo).forEach(function(key){
      if(backupProjectInfo.hasOwnProperty(key)){
          projectInfo[key] = backupProjectInfo[key]
      }
  })

  if(!projectInfo.ProjectName ||   projectInfo.ProjectName.length == 0){
    projectInfo.ProjectName = path.basename(projectPath)
  }
  projectInfo.ProjectPath = projectPath 
  projectInfo.InitializationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)  
  projectInfo.BackendFormat = backendFormats.Yaml

  let jsonString = JSON.stringify(projectInfo, null, '\t')
  fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')

  return projectInfo
}

function copyCurrentBackendInfo(projectPath, backupAWSMobileJSDirPath){
  let currentBackendInfoDirPath = pathManager.getCurrentBackendInfoDirPath(projectPath)
  let backupBackendInfoDirPath = path.join(backupAWSMobileJSDirPath, awsmobileJSConstant.CurrentBackendInfoSubDirName)
  fs.copySync(backupBackendInfoDirPath, currentBackendInfoDirPath)
}

function copyBackend(projectPath, backupAWSMobileJSDirPath){
  let backendDirPath = pathManager.getBackendDirPath(projectPath)
  let backupBackendDirPath = path.join(backupAWSMobileJSDirPath, awsmobileJSConstant.BackendSubDirName)
  fs.copySync(backupBackendDirPath, backendDirPath)
}


module.exports = {
  placeAwsmobileBase,
  syncBase
}