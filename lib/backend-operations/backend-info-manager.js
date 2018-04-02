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
const chalk = require('chalk')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const os = require('os')
const moment = require('moment')

const backendSpecManager = require('./backend-spec-manager.js')
const projectOps = require('./ops-project.js')
const awsExportFileManager = require('../aws-operations/mobile-exportjs-file-manager.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const projectInfoManager = require('../project-info-manager.js')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')
const appsyncManager = require('./appsync-operations/appsync-manager.js')

function getBackendDetails(projectPath) {
    ensureFolderStructure(projectPath)
    let backendDetails 
    try{
        let backendDetailsFilePath = pathManager.getCurrentBackendDetailsFilePath(projectPath)
        backendDetails = JSON.parse(fs.readFileSync(backendDetailsFilePath, 'utf8'))
    }catch(e){
        console.log(chalk.red('failed to read backend details'))
    }
    return backendDetails
}

function clearBackendInfo(projectInfo){
    projectInfoManager.onClearBackend(projectInfo)
    backendSpecManager.onClearBackend(projectInfo)
    awsExportFileManager.onClearBackend(projectInfo)
    fs.emptyDirSync(pathManager.getCurrentBackendInfoDirPath(projectInfo.ProjectPath))
}

function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, syncToDevFlag, callback) {
    ensureFolderStructure(projectInfo.ProjectPath)
    if(backendDetails && backendDetails.projectId && backendDetails.projectId.length > 0){
        console.log('retrieving the latest backend awsmobile project information')
        projectInfo = projectInfoManager.updateBackendProjectDetails(projectInfo, backendDetails)
        setBackendDetails(projectInfo.ProjectPath, backendDetails)
        projectOps.syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, function(backendProject){
            let enabledFeatures = backendSpecManager.getEnabledFeatures(projectInfo, backendProject)
            if(enabledFeatures && enabledFeatures.length > 0){
                let count = 0
                enabledFeatures.forEach(function(featureName){
                    const featureOps = require(pathManager.getOpsFeatureFilePath(featureName))
                    featureOps.syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, function(){
                        count ++
                        if(count == enabledFeatures.length){
                            onSyncComplete(projectInfo, awsDetails, backendProject, enabledFeatures, syncToDevFlag, callback)
                        }
                    })      
                })
            }else{
                onSyncComplete(projectInfo, awsDetails, backendProject, enabledFeatures, syncToDevFlag, callback)
            }
        })
    }else{
        clearBackendInfo(projectInfo)
    }
}

function updateAWSExportFile(projectInfo, awsDetails, callback){ 
    awsExportFileManager.getAWSExportFile(projectInfo, awsDetails, ()=>{
        insertAppSyncJSIntoAWSExportJSFile(projectInfo.ProjectPath)
        let awsExportFilePath = pathManager.getAWSExportFilePath(projectInfo.ProjectPath) 
        let srcDir = pathManager.getSrcDirPath(projectInfo)
        if(srcDir && fs.existsSync(srcDir)){
            let srcDirExportFilePath = pathManager.getSrcDirExportFilePath(projectInfo)
            fs.copySync(awsExportFilePath, srcDirExportFilePath)
            console.log('awsmobile project\'s access information copied to: ' + 
            chalk.blue(pathManager.getSrcDirExportFilePath_relative(projectInfo)))    
        }
        if(callback){
            callback()
        }
    })
}

function insertAppSyncJSIntoAWSExportJSFile(projectPath){
    let appsyncJSObj = appsyncManager.getAppSyncJS(projectPath)
    if(appsyncJSObj && Object.keys(appsyncJSObj).length > 0){
        let awsExportFilePath = pathManager.getAWSExportFilePath(projectPath)
        let content = fs.readFileSync(awsExportFilePath).toString()
        let extraContent = ""

        Object.keys(appsyncJSObj).forEach(function(key) {
            var val = appsyncJSObj[key]
            extraContent += "    'aws_appsync_" + key + "': '" + val + "'," + os.EOL
        })
        
        let index = content.lastIndexOf('}')

        content = content.slice(0, index) + extraContent + content.slice(index)

        fs.writeFileSync(awsExportFilePath, content, 'utf8')
    }
}

function onProjectConfigChange(projectInfo_old, projectInfo){
    awsExportFileManager.onProjectConfigChange(projectInfo_old, projectInfo)
}


function setBackendDetails(projectPath, backendDetails, silentFlag) {
    try{    
        ensureFolderStructure(projectPath)
        let backendDetailsFilePath = pathManager.getCurrentBackendDetailsFilePath(projectPath)
        let jsonString = JSON.stringify(backendDetails, null, '\t')
        fs.writeFileSync(backendDetailsFilePath, jsonString, 'utf8')
        if(!silentFlag){
            console.log('awsmobile project\'s details logged at: ' + 
            chalk.blue(pathManager.getCurrentBackendDetailsFilePath_Relative(projectPath)))
        }
    }catch(e){
        console.log(chalk.red('failed to write backend details'))
    }
}


//syncToDevFlag
//<0: no sync to backend
//0: prompt for confirmation
//1: sync mobile hub project spec (yaml) 
//>1: sync project spec and feature contents
function onSyncComplete(projectInfo, awsDetails, backendProject, enabledFeatures, syncToDevFlag, callback){
    updateAWSExportFile(projectInfo, awsDetails, ()=>{
        console.log('contents in #current-backend-info/ is synchronized with the latest in the aws cloud')
        if(!syncToDevFlag){
            syncToDevFlag = 0
        }
        if(syncToDevFlag > 1){
            syncAllToDev(projectInfo, backendProject, enabledFeatures)
            if(callback){
                callback()
            }
        }else if(syncToDevFlag == 1){
            syncOnlySpecToDev(projectInfo, backendProject, enabledFeatures)
            if(callback){
                callback()
            }
        }else if(syncToDevFlag == 0){
            let message = 'sync corresponding contents in backend/ with #current-backend-info/'
            inquirer.prompt([
            {
                type: 'confirm',
                name: 'syncToDevBackend',
                message: message,
                default: false
            }
            ]).then(function (answers) {
                if(answers.syncToDevBackend){
                    syncAllToDev(projectInfo, backendProject, enabledFeatures)
                }
                if(callback){
                    callback()
                }
            })
        }else{
            if(callback){
                callback()
            }
        }
    })
}

function syncOnlySpecToDev(projectInfo, backendProject, enabledFeatures){
    projectOps.syncToDevBackend(projectInfo, backendProject, enabledFeatures)
    updateBackendSyncTime(projectInfo)
}

function syncAllToDev(projectInfo, backendProject, enabledFeatures){
    projectOps.syncToDevBackend(projectInfo, backendProject, enabledFeatures)
    if(enabledFeatures && enabledFeatures.length > 0){
        enabledFeatures.forEach(function(featureName){
            const featureOps = require(pathManager.getOpsFeatureFilePath(featureName))
            featureOps.syncToDevBackend(projectInfo, backendProject, enabledFeatures)
        })
    }
    updateBackendSyncTime(projectInfo)
}

function updateBackendSyncTime(projectInfo){
    projectInfo.BackendLastSyncTime = moment().format(awsmobilejsConstant.DateTimeFormatString) 
    projectInfoManager.setProjectInfo(projectInfo)
}

function ensureFolderStructure(projectPath){
    const currentBackendInfoDirPath = pathManager.getCurrentBackendInfoDirPath(projectPath)
    fs.ensureDirSync(currentBackendInfoDirPath)
}

module.exports = {
    getBackendDetails,
    setBackendDetails,
    clearBackendInfo,
    syncCurrentBackendInfo,
    onProjectConfigChange
}
  