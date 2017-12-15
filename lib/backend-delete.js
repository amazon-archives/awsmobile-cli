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
const chalk = require('chalk')
const inquirer = require('inquirer')
const ora = require('ora')

const projectInfoManager = require('./project-info-manager.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')

let _projectInfo

function run(){
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        if(_projectInfo.BackendProjectID && _projectInfo.BackendProjectID.length > 0){
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'deleteBackend',
                    message: 'delete backend project ' + _projectInfo.BackendProjectName,
                    default: false
                }
            ]).then(function (answers) {
                if(answers.deleteBackend){
                    deleteBackendProject()
                }
            })
        }else{
            console.log(chalk.red('backend project unknown'))
        }
    }
} 

function deleteBackendProject(){
    awsConfigManager.checkAWSConfig(_projectInfo, function(awsConfig){
        let mobile = awsClient.Mobile()

        let param = {
            projectId: _projectInfo.BackendProjectID
        }

        let backendProjectName = _projectInfo.BackendProjectName

        let spinner = ora('deleting backend project ' + backendProjectName)
        spinner.start()
        mobile.deleteProject(param, function(err,data){
            spinner.stop()
            if(err){
                console.log(chalk.red('delete mobile projection error '))
                awsExceptionHandler.handleMobileException(err)
            }else{
                backendInfoManager.clearBackendInfo(_projectInfo)
                console.log('backend project deleted: ' + chalk.blue(backendProjectName))
            }
        })
    })
}

module.exports = {
    run
}

  

  