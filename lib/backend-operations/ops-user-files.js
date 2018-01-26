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
const chalk = require('chalk')

const pathManager = require('../utils/awsmobilejs-path-manager.js')

const _featureName = 'user-files'
const _featureCommands = {}

let _featureBuildDirPath
let _projectInfo
let _awsConfig
let _backendProjectDetails
let _callback


function specify(projectInfo) {
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(projectInfo.ProjectPath, _featureName))
        projectFeatureOps.specify(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' feature specification error:'))
        console.log(e)
    }
}

function hasCommand(command){
    return _featureCommands.hasOwnProperty(command)
}

function runCommand(command, projectInfo, args){
    console.log(_featureName + ' running ' + command)
}

function onFeatureTurnOn(projectInfo, backendProjectSpec){
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(projectInfo.ProjectPath, _featureName))
        projectFeatureOps.onFeatureTurnOn(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOn error:'))
        console.log(e)
    }
}

function onFeatureTurnOff(projectInfo, backendProjectSpec){
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(projectInfo.ProjectPath, _featureName))
        projectFeatureOps.onFeatureTurnOff(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOff error:'))
        console.log(e)
    }
}

function build(projectInfo, backendProject, callback){
    if(callback){
        callback(false)
    }
}

function preBackendUpdate(projectInfo, awsDetails, backendProjectDetails, callback) {
    if(callback){
        callback()
    }
}

//////////////////// sync backend project ////////////////////
function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, callback){
    if(callback){
        callback()
    }
}

function syncToDevBackend(projectInfo, backendProject, enabledFeatures){
    // let featureCurrentInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
    // if(fs.existsSync(featureCurrentInfoDirPath)){
    //     let featureBackendDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
    //     fs.emptyDirSync(featureBackendDirPath)
    //     fs.copySync(featureCurrentInfoDirPath, featureBackendDirPath)
    // }
}

module.exports = {
    featureName: _featureName,
    featureCommands: _featureCommands,
    specify,
    hasCommand,
    runCommand,
    onFeatureTurnOn,
    onFeatureTurnOff,
    build,
    preBackendUpdate,
    syncCurrentBackendInfo,
    syncToDevBackend
}
  