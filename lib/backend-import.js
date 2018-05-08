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
const inquirer = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')

const projectInfoManager = require('./project-info-manager.js')
const backendUpdate = require('./backend-update.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const opsAppSync = require('./backend-operations/ops-appsync.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')

function run(projectInfo, options, callback){
    awsConfigManager.checkAWSConfig(function(awsDetails){
        let mobileProjectName = nameManager.generateBackendProjectName(projectInfo)
        if(options.yesFlag){
            importProject(projectInfo, awsDetails, mobileProjectName, callback)
        }else{
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'mobileProjectName',
                    message: "What awsmobile project name would you like to use: ",
                    default: mobileProjectName
                }
            ]).then(function (answers) {
                if(answers.mobileProjectName){
                    importProject(projectInfo, awsDetails, answers.mobileProjectName, callback)
                }
            })
        }
    })
}

function importProject(projectInfo, awsDetails, mobileProjectName, callback){
    let mobile = awsClient.Mobile(awsDetails)
    let param = {
        name: mobileProjectName,
        region: awsDetails.config.region
    }

    let spinner = ora('creating backend awsmobile project ' + param.name)
    spinner.start()
    mobile.createProject(param, function(err,data){
        spinner.stop()
        if(err){
            console.log(chalk.red('backend awsmobile project creation error'))
            awsExceptionHandler.handleMobileException(err)
        }else if(data && data.details){
            projectInfo = projectInfoManager.updateBackendProjectDetails(projectInfo, data.details)
            importAppsync(projectInfo, data.details, awsDetails, ()=>{
                backendUpdate.updateBackend(projectInfo, data.details, awsDetails, 1, callback)
            })
        }else{
            console.log(chalk.red('something went wrong'))
        }
    })
}

function importAppsync(projectInfo, backendDetails, awsDetails, callback){
    if(opsAppSync.getEnabledFeatures(projectInfo.ProjectPath).length>0){
        opsAppSync.createApi(projectInfo, awsDetails, ()=>{
            opsAppSync.syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, ()=>{
                opsAppSync.syncToDevBackend(projectInfo)
                if(callback){
                    callback()
                }
            })
        })
    }else{
        if(callback){
            callback()
        }
    }
}

module.exports = {
    run
}