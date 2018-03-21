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

const appsyncManager = require('./appsync-manager.js')
const appsyncCreate = require('./appsyncop-create.js')
const appsyncRetrieve = require('./appsyncop-retrieve.js')
const appsyncUpdate = require('./appsyncop-update.js')
const appsyncDelete = require('./appsyncop-delete.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsConfigManager = require('../aws-operations/aws-config-manager.js')

const _featureName = 'appsync'
const _featureCommands = {
    'test': 'test'
}

let _featureBuildDirPath
let _projectInfo
let _awsConfig
let _backendProjectDetails
let _callback


function specify(projectInfo) {
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
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
    switch(command){
        case 'test': 
            awsConfigManager.checkAWSConfig(function(awsDetails){
                let appsyncJS = appsyncCreate.run(projectInfo, awsDetails)
            })
        break
        default: 
            console.log(chalk.red('awsmobile ' + _featureName + ' does NOT recognize the command: ' + command))
        break
    }
}

function onFeatureTurnOn(projectInfo, backendProjectSpec){
    try{
        appsyncManager.enable(projectInfo.ProjectPath)
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.onFeatureTurnOn(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOn error:'))
        console.log(e)
    }
}

function onFeatureTurnOff(projectInfo, backendProjectSpec){
    try{
        appsyncManager.disable(projectInfo.ProjectPath)
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
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

function createApi(projectInfo, awsDetails, callback) {
    appsyncCreate.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function retrieveApi(projectInfo, awsDetails, callback) {
    appsyncRetrieve.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function updateApi(projectInfo, awsDetails, callback) {
    if(projectInfo.AppsyncApiId){
        // appsyncUpdate.run(projectInfo, awsDetails).then(()=>{
        //     if(callback){
        //         callback()
        //     }
        // })
        appsyncCreate.run(projectInfo, awsDetails).then(()=>{
            if(callback){
                callback()
            }
        })
    }else{
        appsyncCreate.run(projectInfo, awsDetails).then(()=>{
            if(callback){
                callback()
            }
        })
    }
}

function deleteApi(projectInfo, awsDetails, callback) {
    appsyncDelete.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

//////////////////// sync backend project ////////////////////
function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, callback){
    if(callback){
        callback()
    }
}

function syncToDevBackend(projectInfo, backendProject, enabledFeatures){
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
    createApi,
    retrieveApi,
    updateApi,
    deleteApi,
    preBackendUpdate,
    syncCurrentBackendInfo,
    syncToDevBackend
}
  