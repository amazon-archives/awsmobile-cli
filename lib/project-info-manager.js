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
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const moment = require('moment')
const util = require('util')
const _ = require('lodash')

const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const templateValidator = require('./project-validator.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const backendFormats = require('./backend-operations/backend-formats.js')
const versionManager = require('./utils/version-manager.js')


function initialize(projectPath, initialConfig){
    let projectInfo
    if(projectPath){
        projectInfo = projectInfoTemplate
       
        projectInfo.ProjectName = path.basename(projectPath)
        projectInfo.ProjectPath = projectPath 
        projectInfo.InitializationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)  
        projectInfo.BackendFormat = backendFormats.Yaml

        if(initialConfig){
            Object.assign(projectInfo, initialConfig)
        }

        const jsonString = JSON.stringify(projectInfo, null, '\t')

        const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)

        fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
    }
    return projectInfo
}

function configureProjectInfo(callback){

    let projectInfo_old = getProjectInfo()
    let projectInfo = getProjectInfo()
    if(projectInfo){
        inquirer.prompt([
            {
                type: 'input',
                name: 'srcDir',
                message: "Where is your project's source directory: ",
                default: projectInfo.SourceDir
            },
            {
                type: 'input',
                name: 'distDir',
                message: "Where is your project's distribution directory that stores build artifacts: ",
                default: projectInfo.DistributionDir
            },
            {
                type: 'input',
                name: 'buildCommand',
                message: "What is your project's build command: ",
                default: projectInfo.BuildCommand
            },
            {
                type: 'input',
                name: 'startCommand',
                message: "What is your project's start command for local test run: ",
                default: projectInfo.StartCommand
            }
        ]).then(function (answers) {
            if(answers.srcDir){
                projectInfo.SourceDir = answers.srcDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            }
            if(answers.distDir){
                projectInfo.DistributionDir = answers.distDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            }
            if(answers.buildCommand){
                projectInfo.BuildCommand = answers.buildCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            }
            if(answers.startCommand){
                projectInfo.StartCommand = answers.startCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            }
            
            onProjectConfigChange(projectInfo_old, projectInfo)

            projectInfo.LastConfigurationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)
            setProjectInfo(projectInfo)

            if(callback){
                callback(projectInfo_old, projectInfo)
            }
        })
    }
}

function onProjectConfigChange(projectInfo_old, projectInfo){
    let srcDirPath = path.normalize(path.join(projectInfo.ProjectPath, projectInfo.SourceDir))
    if(!fs.existsSync(srcDirPath)){
        console.log()
        console.log(chalk.bgYellow.bold('Warning:') + 
            ' the projects\'s source directory you specified: ' + 
            chalk.blue(srcDirPath) + ' does not exist.')
        console.log('   awsmobile-cli gathers this information for two reasons: ')
        console.log('   - awsmobile-cli copies the latest ' + chalk.blue(awsmobileJSConstant.AWSExportFileName) + ' file into that folder')
        console.log('     so the backend awsmobile project\'s resources can be easily accessed by your code')
        console.log('   - awsmobile-cli checks the last modification time of the files in the project\'s source directory')
        console.log('     so awsmobile-cli knows if to run the build command before it publishes your application')
        console.log()
        console.log(chalk.gray('    # to change the settings'))
        console.log('    $ awsmobile configure project')
    }
}

function getProjectInfo(noWarningFlag) { // will do a search up folder tree and find the projectpath first
    let projectInfo
    let projectPath = searchProjectRootPath()
    if(projectPath){
        try{
            let projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
            projectInfo = JSON.parse(fs.readFileSync(projectInfoFilePath, 'utf8'))
            projectInfo.ProjectPath = projectPath
            versionManager.check(projectInfo)
        }catch(e){
            projectInfo = undefined
        }
    }
    
    if(!projectInfo && !noWarningFlag){
        console.log(chalk.red('you are not working inside a valid awsmobilejs project'))
    }

    return projectInfo
}

function listProjectInfo(){
    let projectInfo = getProjectInfo()
    if(projectInfo){
        let projectConfig = {}
        projectConfig.SourceDir = projectInfo.SourceDir
        projectConfig.DistributionDir = projectInfo.DistributionDir
        projectConfig.BuildCommand = projectInfo.BuildCommand
        projectConfig.StartCommand = projectInfo.StartCommand
       
        console.log()
        console.log(util.inspect(projectConfig, false, null))
        console.log()
    }
}

function setProjectInfo(projectInfo){
    let projectPath = searchProjectRootPath()
    if(projectPath){
        let projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
        projectInfo.ProjectPath = projectPath
        trimProjectInfo(projectInfo)
        let jsonString = JSON.stringify(projectInfo, null, '\t')
        fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
    }else{
        console.log(chalk.red('you are not working inside a valid awsmobilejs project'))
    }
}

function trimProjectInfo(projectInfo){
    //remove unused properties to avoid confusion
    delete projectInfo.BackendLastUpdateTime
    delete projectInfo.BackendLastUpdateSuccessful
}

function updateBackendProjectDetails(projectInfo, backendProjectDetails){
    if(backendProjectDetails && backendProjectDetails.projectId && backendProjectDetails.projectId.length > 0){
        _.keys(backendPropertyMappings).forEach(function(propertyName){
            projectInfo[propertyName] = backendProjectDetails[backendPropertyMappings[propertyName]]
        })
    }else{
        _.keys(backendPropertyMappings).forEach(function(propertyName){
            projectInfo[propertyName] = ''
        })
    }
    setProjectInfo(projectInfo)
    return projectInfo
}

function onClearBackend(projectInfo){
    _.keys(backendPropertyMappings).forEach(function(propertyName){
        projectInfo[propertyName] = ''
    })
    setProjectInfo(projectInfo)
}

function checkBackendUpdateNoConflict(projectInfo, backendDetails){
    let result = false
    if(projectInfo && projectInfo.BackendProjectLastUpdatedTime && backendDetails && backendDetails.lastUpdatedDate){
        let localStamp = moment(projectInfo.BackendProjectLastUpdatedTime)
        let cloudStamp = moment(backendDetails.lastUpdatedDate)
        result = !localStamp.isBefore(cloudStamp)
    }
    return result
}

function searchProjectRootPath()
{
    let result
    let currentPath = process.cwd()

    do{
        if(templateValidator.validate(currentPath)){
            result = currentPath 
            break 
        }else{
            let parentPath = path.dirname(currentPath) 
            if(currentPath == parentPath){
                break
            }else{
                currentPath = parentPath
            }
        }
    }while(true)

    return result
}

const projectInfoTemplate = {
	"ProjectName": "",
	"ProjectPath": "",
	"SourceDir": "src",
	"DistributionDir": "build",
	"BuildCommand": (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
	"StartCommand": (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start"),
	"InitializationTime": "",
	"LastConfigurationTime": "",
	"LastNPMInstallTime": "",
	"FrontendLastBuildTime": "",
	"LastPublishTime": "",
    "BackendFormat": "yml",
	"BackendLastSyncTime": "",
	"BackendLastBuildTime": "",
	"BackendLastPushTime": "",
	"BackendLastPushSuccessful": false,
	"BackendProjectID": "",
	"BackendProjectName":  "",
    "BackendProjectConsoleUrl": "",
	"BackendProjectCreationTime": "",
	"BackendProjectLastUpdatedTime": ""
}

const backendPropertyMappings = {
    "BackendProjectName":  "name",
    "BackendProjectID": "projectId",
    "BackendProjectCreationTime": "createdDate",
    "BackendProjectLastUpdatedTime": "lastUpdatedDate",
    "BackendProjectConsoleUrl": "consoleUrl"
}

module.exports = {
    initialize,
    configureProjectInfo,
    getProjectInfo,
    listProjectInfo,
    setProjectInfo,
    updateBackendProjectDetails,
    onClearBackend,
    checkBackendUpdateNoConflict
}
