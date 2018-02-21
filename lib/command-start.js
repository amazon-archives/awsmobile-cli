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
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')

const projectInfoManager = require('./project-info-manager.js')
const awsmobileBaseManager = require('./awsm-base-manager.js')
const starterManager = require('./awsm-starter-manager.js')
const backendCreate = require('./backend-create.js')
const starterRepoMapping = require('./utils/starter-repo-mapping.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const npmManager = require('./utils/npm-manager')
const gitManager = require('./utils/git-manager')

let _projectName
let _starterName
let _repo
function start(projectName, starterName){
    if(!projectName){
        projectName = nameManager.generateProjectName()
    }
    let projectPath = path.join(process.cwd(), projectName)

    if(fs.existsSync(projectPath)){
        console.log(chalk.red('Error: \'' + projectName + '\' already exists in the current directory'))
    }else{
        _projectName = projectName
        _starterName = starterName
        if(starterName){
            _repo = starterRepoMapping[starterName]
            if(_repo){
                console.log('Creating project ' + projectName)
                starterManager.placeStarter(projectPath, _repo, function(contentZipFilePath, tempDirPath){
                    setupStarterProject(projectPath, contentZipFilePath, function(){
                        fs.removeSync(tempDirPath)
                    })
                })
            }else{
                console.log(chalk.red('unrecognized starter name \'' + starterName + '\''))
            }
        }else{
            console.log('Creating project ' + projectName)
            starterManager.placeBlankProject(projectPath, function(contentZipFilePath){
                setupStarterProject(projectPath, contentZipFilePath)
            })
        }
    }
}

function setupStarterProject(projectPath, contentZipFilePath, callback){
    awsmobileBaseManager.placeAwsmobileBase(projectPath)
    initialize(projectPath, function(projectInfo){
        process.chdir(projectPath)
        setupBackend(projectInfo, contentZipFilePath, callback)
    })
}

function initialize(projectPath, callback)
{
    npmManager.insertAmplifyDependency(projectPath)
    gitManager.insertAwsmobilejs(projectPath)
    let projectInfo = projectInfoManager.initialize(projectPath, starterManager.getProjectConfig(_starterName))
    if(callback){
        callback(projectInfo)
    }
}

function setupBackend(projectInfo, contentZipFilePath, callback){
    backendCreate.createBackendProject(projectInfo, {contentZipFilePath: contentZipFilePath, syncToDevFlag: 1}, function(){
        printWelcomeMessage(projectInfo)
        if(callback){
            callback()
        }
    })
}

function printWelcomeMessage(projectInfo){
    console.log()
    console.log('Success!')
    console.log('Your have created project ' + chalk.blue(projectInfo.ProjectName))
    if(_repo){
        console.log(' using awsmobilejs starter ' + chalk.blue(_repo))
    }
    console.log()
    console.log('Your project is initialized with awsmobilejs')
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
    start
}