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
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')

const projectInfoManager = require('./project-info-manager')
const awsmobileBaseManager = require('./awsmobilebase-manager.js')
const projectValidator = require('./project-validator.js')
const backendCreate = require('./backend-create.js')
const backendRetrieve = require('./backend-retrieve.js')
const gitManager = require('./utils/git-manager')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')
const backendSpecManager = require('./backend-operations/backend-spec-manager.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const opsProject = require('./backend-operations/ops-project.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsConfigManager = require('./aws-operations/aws-config-manager')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')

function init(mobileProjectID){
    let projectPath = process.cwd()
    if(projectValidator.validate(projectPath)){
        awsmobileBaseManager.syncBase(projectPath, function(projectInfo){
            setupBackend(projectInfo, mobileProjectID)
        })
    }else{
        awsmobileBaseManager.placeAwsmobileBase(projectPath, function(){
            initialize(projectPath, function(projectInfo){
                setupBackend(projectInfo, mobileProjectID)
            })
        })
    }
}

function initialize(projectPath, callback)
{
    setupAmplifyDependency(projectPath)

    fs.emptyDirSync(pathManager.getCurrentBackendInfoDirPath(projectPath))
    fs.removeSync(pathManager.getBackendBuildDirPath(projectPath))

    gitManager.initialize(projectPath)
    let projectInfo = projectInfoManager.initialize(projectPath)

    console.log('Please tell us about your project:')
    projectInfoManager.configureProjectInfo(function(projectInfo_old, projectInfo){
        if(callback){
            callback(projectInfo)
        }
    })
}

function setupAmplifyDependency(projectPath){
    let packageJsonFilePath = path.normalize(path.join(projectPath, 'package.json'))
    if(fs.existsSync(packageJsonFilePath)){
        let packageObj = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
        if(!packageObj.dependencies){
            packageObj.dependencies = {}
        }
        packageObj.dependencies["aws-amplify"] = "^0.1.0"
        let jsonString = JSON.stringify(packageObj, null, 2)
        fs.writeFileSync(packageJsonFilePath, jsonString, 'utf8')
    }
}

function setupBackend(projectInfo, mobileProjectID){
    console.log()
    if(mobileProjectID){
        linkBackend(projectInfo, mobileProjectID, function(){
            console.log()
            console.log('Success! your project is now initialized with awsmobilejs')
            printWelcomeMessage(projectInfo)
        })
    }else{
        createBackend(projectInfo, function(){
            console.log()
            console.log('Success! your project is now initialized with awsmobilejs')
            printWelcomeMessage(projectInfo)
        })
    }
}

function linkBackend(projectInfo, mobileProjectID, callback){
    if(projectInfo.BackendProjectID && projectInfo.BackendProjectID.length > 0){
        if(projectInfo.BackendProjectID != mobileProjectID){
            console.log('this project currently has this awsmobile project as its backend ' + chalk.blue(projectInfo.BackendProjectName))
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'switchBackend',
                    message: 'switch backend to awsmobile project with id: ' + mobileProjectID,
                    default: false
                }
            ]).then(function (answers) {
                if(answers.switchBackend){
                    backendRetrieve.linkToBackend(projectInfo, mobileProjectID, 1, callback)
                }else{
                    if(callback){
                        callback()
                    }
                }
            })
        }else{
            backendRetrieve.pullBackend(projectInfo, mobileProjectID, 1, callback)
        }
    }else{
        backendRetrieve.linkToBackend(projectInfo, mobileProjectID, 1, callback)
    }
}

function createBackend(projectInfo, callback){
    if(projectInfo.BackendProjectID && projectInfo.BackendProjectID.length > 0){
        console.log('this project currently has this awsmobile project as its backend ' + chalk.blue(projectInfo.BackendProjectName))
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'createNewBackend',
                message: 'create a new awsmobile project as the backend',
                default: false
            }
        ]).then(function (answers) {
            if(answers.createNewBackend){
                backendCreate.createBackendProject(projectInfo, callback)
            }else{
                if(callback){
                    callback()
                }
            }
        })
    }else{
        backendCreate.createBackendProject(projectInfo, callback)
    }
}

function printWelcomeMessage(projectInfo){
    console.log()
    console.log('   ' + chalk.blue(pathManager.getDotAWSMobileDirPath_relative(projectInfo.ProjectPath)))
    console.log('     is the workspace of awsmobile-cli, please do not modify its contents')
    console.log()
    console.log('   ' + chalk.blue(pathManager.getCurrentBackendInfoDirPath_relative(projectInfo.ProjectPath)))
    console.log('     contains information of the backend awsmobile project from the last')
    console.log('     synchronization with the cloud')
    console.log()
    console.log('   ' + chalk.blue(pathManager.getBackendDirPath_relative(projectInfo.ProjectPath)))
    console.log('     is where you develop the codebase of the backend awsmobile project')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile console'))
    console.log('     opens the web console of the backend awsmobile project')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile run'))
    console.log('     pushes the latest development of the backend awsmobile project to the cloud,')
    console.log('     and runs the frontend application locally')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile publish'))
    console.log('     pushes the latest development of the backend awsmobile project to the cloud,') 
    console.log('     and publishes the frontend application to aws S3 for hosting')
    console.log()
    console.log('Happy coding with awsmobile!')
}

module.exports = {
    init
}

