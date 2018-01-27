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
const ora = require('ora')
const opn = require('opn')
const inquirer = require('inquirer')
const moment = require('moment')

const backendCreate = require('./backend-create.js')
const backendRetrieve = require('./backend-retrieve.js')
const projectInfoManager = require('./project-info-manager.js')
const projectBackendBuilder = require('./project-backend-builder.js')
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
let _backendProjectDetails
let _forcedPushFlag = false
let _callback
let _enabledFeatures

function run(callback) {
    _callback = callback
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        awsConfigManager.checkAWSConfig(function(awsDetails){
            _awsDetails = awsDetails
            if(_projectInfo.BackendProjectID && _projectInfo.BackendProjectID.length > 0){
                checkLatestInCloud(function(){
                    updateBackend()
                })
            }else{
                console.log(chalk.red('backend unknown'))
                inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'createBackend',
                        message: "create a new awsmobile project as the backend",
                        default: true
                    }
                ]).then(function (answers) {
                    if(answers.createBackend){
                        backendCreate.createBackendProject(_projectInfo, updateBackend)
                    }
                })
            }
        })
    }
}

function checkLatestInCloud(callback){
    backendRetrieve.getLatestBackendDetails(_projectInfo.BackendProjectID, function(backendDetails){
        _backendProjectDetails = backendDetails
        if(projectInfoManager.checkBackendUpdateNoConflict(_projectInfo, backendDetails)){
            //nothing is changed since last pull, but just to make sure the user didn't delete 
            //or modify this file, because it is used by the following push procedure
            backendInfoManager.setBackendDetails(_projectInfo.ProjectPath, backendDetails, true)
            callback()
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
                    _forcedPushFlag = true
                    backendInfoManager.setBackendDetails(_projectInfo.ProjectPath, backendDetails, true)
                    callback()
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

function updateBackend(){
    projectBackendBuilder.build(function(){
        if(isNewUpdateNeeded() || _forcedPushFlag){
            preUpdateAction()
        }else{
            console.log()
            console.log('no local backend changes detected')
            if(_callback){
                _callback()
            }
        }
    })
}

function isNewUpdateNeeded(){
    let result = false

    let ignoredDirs = []
    let ignoredFiles = []
    let backendBuildDirPath = pathManager.getBackendBuildDirPath(_projectInfo.ProjectPath)
    if(fs.existsSync(backendBuildDirPath)){ 
        let lastBackendBuildDirModificationTime = moment(dfops.getDirContentMTime(backendBuildDirPath, ignoredDirs, ignoredFiles))
        let timeStemp = getTimeStamp(_projectInfo)
        result = !timeStemp.isValid() || 
                !lastBackendBuildDirModificationTime.isValid() ||
                timeStemp.isBefore(lastBackendBuildDirModificationTime) 
    }

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
            featureOps.preBackendUpdate(_projectInfo, _awsDetails, _backendProjectDetails, function(){
                count ++
                if(count == _enabledFeatures.length){
                    console.log('done')
                    updateBackendProject()
                }
            })                
        })
    }else{
        updateBackendProject()
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
        _projectInfo = projectInfoManager.getProjectInfo()
        if(err){
            console.log(chalk.red('Failed to update project ' +  _projectInfo.BackendProjectName))
            awsExceptionHandler.handleMobileException(err)
            
            _projectInfo.BackendLastPushTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
            _projectInfo.BackendLastPushSuccessful = false
            projectInfoManager.setProjectInfo(_projectInfo)
        }else{
            if(data && data.details){
                waitForCloudAPIComplete(data.details, (err, backendDetails) => {
                    if(err){
                        _projectInfo.BackendLastPushSuccessful = false
                    }else{
                        console.log()
                        console.log('Successfully updated the backend awsmobile project: ' + chalk.blue(backendDetails.name))
                        _projectInfo.BackendLastPushSuccessful = true
                    }
                    _projectInfo.BackendLastPushTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
                    projectInfoManager.setProjectInfo(_projectInfo)

                    console.log()
                    backendInfoManager.syncCurrentBackendInfo(_projectInfo, backendDetails, _awsDetails, 1, function(){
                        if(_callback){
                            _callback()
                        }
                    })
                })
            }else{
                console.log(chalk.red('something went wrong'))
            }
        }
    })
}

function waitForCloudAPIComplete(backendDetails, callback){
    if(isWaitForCloudFormationNeeded(backendDetails)){
        console.log('awsmobile update api call returned with no error')
        console.log('waiting for the cloud formation operations to complete')
        let mobile = awsClient.Mobile(_awsDetails)
        let param = {
            projectId: _projectInfo.BackendProjectID,
            syncFromResources: true
        }
        cloudApiWaitLoop(mobile, param, backendDetails, 1, callback)
    }else{
        callback(null, backendDetails)
    }
}

let spinner = ora('waiting ... ') //do not move inside function, the function is called recursively
function cloudApiWaitLoop(mobile, param, backendDetails, loopCount, callback){
    spinner.start()
    if(loopCount > maxCloudApiWaitLoop){
        console.log(chalk.red(err.message))
        callback({code: 0}, backendDetails)
    }else{
        mobile.describeProject(param, function(err,data){
            spinner.stop()
            if(err){
                console.log(chalk.red('wait interrupted'))
                awsExceptionHandler.handleMobileException(err)
                callback({code: 0}, backendDetails)
            }else{
                backendDetails = data.details
                let cloudFormationState = opsCloudApi.getFormationStateSummary(backendDetails)
                if(cloudFormationState){
                    let stateGroup = opsCloudApi.getStateGroup(cloudFormationState)
                    //status group: 
                    //-1: unrecognized status
                    // 0: in-progress
                    // 1: terminal_complate
                    // 2: terminal_failed
                    if(stateGroup < 0){
                        console.log(chalk.red('wait interrupted') + ' unrecognized status code: ' + cloudFormationState)
                        callback({code: -1}, backendDetails)
                    }
                    if( stateGroup == 0){
                        spinner.start('status check #' + chalk.blue(loopCount) + ': ' + cloudFormationState)
                        setTimeout(function(){
                            cloudApiWaitLoop(mobile, param, backendDetails, loopCount + 1, callback)
                        }, 5000)
                    }else if (stateGroup == 1){
                        console.log('cloud-api update finished with status code: ' + chalk.blue(cloudFormationState))
                        callback(null, backendDetails)
                    }else{
                        console.log('cloud-api update finished with status code: ' + chalk.blue(cloudFormationState))
                        callback({code: 2}, backendDetails)
                    }
                }else{
                    console.log(chalk.red('wait interrupted') + ' CloudFormation stack information missing')
                    callback({code: -2}, backendDetails)
                }
            }
        })
    }
}

function isWaitForCloudFormationNeeded(backendDetails){ 
    let isWaitNeeded = false

    let cloudFormationState = opsCloudApi.getFormationStateSummary(backendDetails)
    if(cloudFormationState){
        let stateGroup = opsCloudApi.getStateGroup(cloudFormationState)
        if(stateGroup == 0){
            isWaitNeeded = true
        }
    }
    
    return isWaitNeeded
}

module.exports = {
    run
}
