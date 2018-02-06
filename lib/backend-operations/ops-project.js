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
const chalk = require('chalk')
const moment = require('moment')
const ora = require('ora')

const backendSpecManager = require('./backend-spec-manager.js')
const backendContentManager = require('../aws-operations/mobile-api-content-generator.js')
const mobileProjectExport = require('../aws-operations/mobile-project-export-manager.js')
const awsMobileYamlOps = require('../aws-operations/mobile-yaml-ops.js')
const mobileProjectStates = require('../aws-operations/mobile-project-states.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

//////////////////// build backend project ////////////////////
function build(projectInfo, backendProject, callback){
    if(isNewBuildNeeded(projectInfo)){
        console.log('   generating backend project content')
        backendContentManager.generateContents(projectInfo, backendProject, function(){
            console.log('   done')
            if(callback){
                callback(true)
            }
        })
    }else{
        if(callback){
            callback(false)
        }
    }
}

function isNewBuildNeeded(projectInfo){
    let result = false

    let backendContentZipFilePath = pathManager.getBackendContentZipFilePath(projectInfo.ProjectPath)
    if(fs.existsSync(backendContentZipFilePath)){

        let lastBackendBuildTime = moment(projectInfo.BackendLastBuildTime, awsmobileJSConstant.DateTimeFormatString)
        let lastBackendSpecModificationTime = moment(backendSpecManager.getLastModificationTime(projectInfo))
        let lastBackendBuildZipFileMTime = moment(fs.lstatSync(backendContentZipFilePath).mtime)

        result =!lastBackendBuildTime.isValid() || 
                !lastBackendSpecModificationTime.isValid() ||
                !lastBackendBuildZipFileMTime.isValid() ||
                lastBackendBuildZipFileMTime.isBefore(lastBackendSpecModificationTime) ||
                lastBackendBuildTime.isBefore(lastBackendSpecModificationTime) ||
                lastBackendBuildTime.isBefore(lastBackendBuildZipFileMTime) //user manually changed build
    }else{
        result = true
    }

    return result
}

//////////////////// sync backend project ////////////////////
function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, callback){
    mobileProjectExport.retrieveYaml(projectInfo, function(){
        let currentBackendYamlFilePath = pathManager.getCurrentBackendYamlFilePath(projectInfo.ProjectPath)
        let backendProject = awsMobileYamlOps.readYamlFileSync(currentBackendYamlFilePath)
        if(callback){
            callback(backendProject)
        }
    })
}

function syncToDevBackend(projectInfo, backendProject, enabledFeatures){
    backendSpecManager.setBackendProjectObject(backendProject, projectInfo)
}

//////////////////// backend project state check ////////////////////
function isInNormalState(backendDetails){
    let result = false
    if(backendDetails && backendDetails.state){
        result = backendDetails.state == 'NORMAL'
    }
    return result
}

module.exports = {
    build,
    syncCurrentBackendInfo,
    syncToDevBackend, 
    isInNormalState
}
  