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
const npmManager = require('./utils/npm-manager')
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
        let projectInfo
        try{
            let projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
            projectInfo = JSON.parse(fs.readFileSync(projectInfoFilePath, 'utf8'))
            projectInfo.ProjectPath = projectPath
        }catch(e){
            projectInfo = undefined
        }

        if(projectInfo){
            if(projectInfo.BackendProjectID && projectInfo.BackendProjectID.length > 0){
                let ifSetupBackend = true
                let confirmMessage = 'create a new awsmobile project as the backend'

                if(mobileProjectID){
                    if(projectInfo.BackendProjectID != mobileProjectID){
                        confirmMessage = 'switch backend to awsmobile project with id = ' + mobileProjectID
                    }else{
                        ifSetupBackend = false
                        console.log('the current backend awsmobile project is: ' + chalk.blue(projectInfo.BackendProjectName))
                        console.log('it has the same id: ' + chalk.blue(projectInfo.BackendProjectID))
                        console.log(chalk.gray('# to retrieve the latest details of the backend awsmobile project'))
                        console.log('    $ awsmobile pull')
                    }
                }

                if(ifSetupBackend){
                    console.log('the current backend awsmobile project is: ' + chalk.blue(projectInfo.BackendProjectName))
                    console.log('with id = ' + chalk.blue(projectInfo.BackendProjectID))

                    inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'confirmInit',
                            message: confirmMessage,
                            default: false
                        }
                    ]).then(function (answers) {
                        if(answers.confirmInit){
                            console.log()
                            setupBackend(projectInfo, mobileProjectID)
                        }
                    })
                }
            }else{ // valid project, but backend is not setup
                setupBackend(projectInfo, mobileProjectID)
            }
        }else{
            runInit(projectPath, mobileProjectID)
        }
    }else{
        runInit(projectPath, mobileProjectID)
    }
}

function runInit(projectPath, mobileProjectID){
    awsmobileBaseManager.backupAwsmobileBase(projectPath)
    awsmobileBaseManager.placeAwsmobileBase(projectPath, function(){
        initialize(projectPath, function(projectInfo){
            setupBackend(projectInfo, mobileProjectID)
        })
    })
}

function initialize(projectPath, callback)
{
    npmManager.setupAmplifyDependency(projectPath)
    gitManager.initialize(projectPath)

    let projectInfo = projectInfoManager.initialize(projectPath)

    console.log('Please tell us about your project:')
    projectInfoManager.configureProjectInfo(function(projectInfo_old, projectInfo){
        if(callback){
            callback(projectInfo)
        }
    })
}

function setupBackend(projectInfo, mobileProjectID){
    console.log()
    if(mobileProjectID){
        backendRetrieve.linkToBackend(projectInfo, mobileProjectID, 1, function(){
            printWelcomeMessage(projectInfo)
        })
    }else{
        backendCreate.createBackendProject(projectInfo, null, function(){
            printWelcomeMessage(projectInfo)
        })
    }
}

function printWelcomeMessage(projectInfo){
    console.log()
    console.log('Success! your project is now initialized with awsmobilejs')
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

