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
const inquirer = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')

const backendWaitLogic = require('./backend-wait-logic.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const opsProject = require('./backend-operations/ops-project.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')

function createBackendProject(projectInfo, contentZipFilePath, callback){
    awsConfigManager.checkAWSConfig(function(awsDetails){
        let mobile = awsClient.Mobile(awsDetails)

        let mobileProjectName = nameManager.generateBackendProjectName(projectInfo)
        inquirer.prompt([
            {
                type: 'input',
                name: 'mobileProjectName',
                message: "What awsmobile project name would you like to use: ",
                default: mobileProjectName
            }
        ]).then(function (answers) {
            if(answers.mobileProjectName){
                if(!contentZipFilePath){
                    contentZipFilePath = pathManager.getProjectCreationContentZipFilePath()
                }
                let backendContents = fs.readFileSync(contentZipFilePath)
                let param = {
                    name: answers.mobileProjectName,
                    region: awsDetails.config.region,
                    contents: backendContents
                }

                let spinner = ora('creating backend awsmobile project ' + param.name)
                spinner.start()
                mobile.createProject(param, function(err,data){
                    spinner.stop()
                    console.log()
                    if(err){
                        console.log(chalk.red('backend awsmobile project creation error'))
                        awsExceptionHandler.handleMobileException(err)
                    }else if(data && data.details){
                        backendWaitLogic.wait(data.details, awsDetails, (err, backendDetails) => {
                            if(!err){ 
                                console.log('Successfully created AWS Mobile Hub project: ' + chalk.blue(data.details.name))
                                console.log()
                                backendInfoManager.syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, 1, function(){
                                    if(callback){
                                        callback()
                                    }
                                })
                            }
                        })
                    }else{
                        console.log(chalk.red('something went wrong'))
                    }
                })
            } 
        })
        
    })
}

module.exports = {
    createBackendProject
}