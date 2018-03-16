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
const ora = require('ora')
const opn = require('opn')
const inquirer = require('inquirer')
const moment = require('moment')

const backendRetrieve = require('./backend-retrieve.js')
const projectInfoManager = require('./project-info-manager.js')
const projectBackendBuilder = require('./build-backend.js')
const backendWaitLogic = require('./backend-wait-logic.js')
const opsAppSync = require('./backend-operations/ops-appsync.js')
const backendSpecManager = require('./backend-operations/backend-spec-manager.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const opsCloudApi = require('./backend-operations/ops-cloud-api.js')
const dfops = require('./utils/directory-file-ops.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')

const maxCloudApiWaitLoop = 100 //each wait is 5 seconds

let _projectInfo
let _awsDetails
let _backendDetails
let _callback
let _enabledFeatures
let _syncToDevFlag

function run(callback) {
    _callback = callback
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        if(isNewUpdateNeeded()){
            awsConfigManager.checkAWSConfig(function(awsDetails){
                _awsDetails = awsDetails
                if(_projectInfo.BackendProjectID && _projectInfo.BackendProjectID.length > 0){
                    checkLatestInCloud(function(backendDetails){
                        updateBackend(_projectInfo, backendDetails, awsDetails, 1, callback)
                    })
                }else{
                    console.log(chalk.red('backend awsmobile project unknown'))
                }
            })
        }else{
            console.log('No local changes detected for the backend awsmobile project')
            if(_callback){
                _callback()
            }
        }
    }
}

function checkLatestInCloud(callback){
    backendRetrieve.getLatestBackendDetails(_projectInfo.BackendProjectID, function(backendDetails){
        _backendDetails = backendDetails
        if(projectInfoManager.checkBackendUpdateNoConflict(_projectInfo, backendDetails)){
            //nothing is changed since last pull, but just to make sure the user didn't delete 
            //or modify this file, because it is used by the following push procedure
            backendInfoManager.setBackendDetails(_projectInfo.ProjectPath, backendDetails, true)
            callback(backendDetails)
        }else{
            console.log(chalk.red('the backend awsmobile project is ahead of your local copy'))
            console.log('it might have been updated by others or through other chanels')
            console.log('if you continue with the push, unintended consequences may occur')
            console.log('such as accidental awsmobile feature removal, among others')
            console.log(chalk.gray('# to retrieve the latest details of the backend awsmobile project'))
            console.log('    $ awsmobile pull')
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'forcePush',
                    message: "do you want to continue with the push",
                    default: false
                }
            ]).then(function (answers) {
                if(answers.forcePush){
                    backendInfoManager.setBackendDetails(_projectInfo.ProjectPath, backendDetails, true)
                    callback(backendDetails)
                }else{
                    inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'openConsole',
                            message: "do you want to open the web console of the backend awsmobile project",
                            default: true
                        }
                    ]).then(function (answers) {
                        if(answers.openConsole){
                            console.log(chalk.green(backendDetails.consoleUrl))
                            opn(backendDetails.consoleUrl, {wait: false})
                        }
                    })
                }
            })
        }
    })
}

function updateBackend(projectInfo, backendDetails, awsDetails, syncToDevFlag, callback){
    _projectInfo = projectInfo
    _backendDetails = backendDetails
    _awsDetails = awsDetails
    _syncToDevFlag = syncToDevFla
    _callback = callback
    projectBackendBuilder.build(function(){
        preUpdateAction()
    })
}

function isNewUpdateNeeded(){
    let ignoredDirs = []
    let ignoredFiles = []
    let backendDirPath = pathManager.getBackendDirPath(_projectInfo.ProjectPath)
    
    let lastBackendDirModificationTime = moment(dfops.getDirContentMTime(backendDirPath, ignoredDirs, ignoredFiles))
    let timeStamp = getTimeStamp(_projectInfo)

    let result =!timeStamp.isValid() || 
                !lastBackendDirModificationTime.isValid() ||
                timeStamp.isBefore(lastBackendDirModificationTime) 
    
    return result
}

function getTimeStamp(projectInfo){
    let lastBackendPushTime = moment(projectInfo.BackendLastPushTime, awsmobileJSConstant.DateTimeFormatString)
    let lastBackendSyncTime = moment(projectInfo.BackendLastSyncTime, awsmobileJSConstant.DateTimeFormatString)

    let result = lastBackendSyncTime
    if(projectInfo.BackendLastPushSuccessful && lastBackendPushTime.isValid()){
        if(result.isValid()){
            result = lastBackendPushTime > result ? lastBackendPushTime : result
        }else{
            result = lastBackendPushTime
        }
    }

    return result
}

function preUpdateAction(){
    let count = 0
    _enabledFeatures = backendSpecManager.getEnabledFeatures(_projectInfo)
    if(_enabledFeatures && _enabledFeatures.length > 0){
        console.log()
        console.log('preparing for backend project update: ' + _projectInfo.BackendProjectName)
        _enabledFeatures.forEach(function(featureName){
            const featureOps = require(pathManager.getOpsFeatureFilePath(featureName))
            featureOps.preBackendUpdate(_projectInfo, _awsDetails, _backendDetails, function(){
                count ++
                if(count == _enabledFeatures.length){
                    console.log('done')
                    opsAppSync.update(_projectInfo, _awsDetails, updateBackendProject)
                }
            })                
        })
    }else{
        opsAppSync.update(_projectInfo, _awsDetails, updateBackendProject)
    }
}

function updateBackendProject(){
    let backendContents = fs.readFileSync(pathManager.getBackendContentZipFilePath(_projectInfo.ProjectPath))
    
    let mobile = awsClient.Mobile(_awsDetails)

    let param = {
        contents: backendContents,
        projectId: _projectInfo.BackendProjectID
    }
    
    console.log()
    console.log('updating backend project: ' + _projectInfo.BackendProjectName)
    let spinner = ora('calling awsmobile public api method updateProject ...')
    spinner.start()
    mobile.updateProject(param, function(err,data){
        spinner.stop()
        Object.assign(_projectInfo, projectInfoManager.getProjectInfo())
        if(err){
            _projectInfo.BackendLastPushTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
            _projectInfo.BackendLastPushSuccessful = false
            projectInfoManager.setProjectInfo(_projectInfo)
            console.log(chalk.red('Failed to update project ' +  _projectInfo.BackendProjectName))
            awsExceptionHandler.handleMobileException(err)
        }else if(data && data.details){
            backendWaitLogic.wait(data.details, _awsDetails, (err, backendDetails) => {
                if(err){
                    _projectInfo.BackendLastPushSuccessful = false
                }else{
                    console.log()
                    console.log('Successfully updated the backend awsmobile project: ' + chalk.blue(backendDetails.name))
                    _projectInfo.BackendLastPushSuccessful = true
                }
                _projectInfo.BackendLastPushTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
                projectInfoManager.setProjectInfo(_projectInfo)

                if(!err){
                    console.log()
                    backendInfoManager.syncCurrentBackendInfo(_projectInfo, backendDetails, _awsDetails, _syncToDevFlag, function(){
                        if(_callback){
                            _callback()
                        }
                    })
                }
            })
        }else{
            console.log(chalk.red('something went wrong'))
        }
    })
}

module.exports = {
    run, 
    updateBackend
}
