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

const projectValidator = require('./project-validator.js')
const projectConfigManager = require('./project-config-manager.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const backendFormats = require('./backend-operations/backend-formats.js')
const versionManager = require('./utils/version-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')

function initialize(projectPath, initialConfig){
    let projectInfo
    if(projectPath){
        projectInfo = projectInfoTemplate
       
        projectInfo.ProjectName = path.basename(projectPath)
        projectInfo.ProjectPath = projectPath 
        projectInfo.InitializationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)  

        const jsonString = JSON.stringify(projectInfo, null, '\t')
        const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
        fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')

        let projectConfig = projectConfigManager.initialize(projectPath, initialConfig)
       
        Object.assign(projectInfo, projectConfig)
    }
    return projectInfo
}

function configureProject(callback){
    let projectInfo = getProjectInfo()
    if(projectInfo){
        projectConfigManager.configureProject(projectInfo, (isConfigChanged, projectConfig_0, projectConfig)=>{
            if(isConfigChanged){
                projectInfo.LastConfigurationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)
                setProjectInfo(projectInfo)
            }
    
            if(callback){
                let projectInfo_1 = getProjectInfo()
                Object.assign(projectInfo, projectConfig_0)
                Object.assign(projectInfo_1, projectConfig)
                callback(projectInfo, projectInfo_1)
            }
        })
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

            let projectConfig = projectConfigManager.getProjectConfig(projectInfo)
            if(projectConfig){
                Object.assign(projectInfo, projectConfig)
            }else{
                if(!noWarningFlag){
                    console.log(chalk.red('Your project is not properly configured'))
                    console.log(chalk.gray('    # configure your project'))
                    console.log('    $ awsmobile configure project')
                }
                projectInfo = undefined
            }
        }catch(e){
            projectInfo = undefined
        }
    }
    
    if(!projectInfo && !noWarningFlag){
        console.log(chalk.red('you are not working inside a valid awsmobilejs project'))
    }

    return projectInfo
}

function listProjectConfig(){
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

        let projectConfig = projectConfigManager.extractProjectConfig(projectInfo)
        trimProjectInfo(projectInfo)
        let jsonString = JSON.stringify(projectInfo, null, '\t')
        fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
        
        Object.assign(projectInfo, projectConfig)
    }else{
        console.log(chalk.red('you are not working inside a valid awsmobilejs project'))
    }
}

function trimProjectInfo(projectInfo){
    //remove deprecated properties to avoid confusion
    delete projectInfo.BackendLastUpdateTime
    delete projectInfo.BackendLastUpdateSuccessful
    delete projectInfo.BackendFormat
    //remove project configuration
    delete projectInfo.SourceDir
    delete projectInfo.DistributionDir
    delete projectInfo.BuildCommand
    delete projectInfo.StartCommand
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
        if(projectValidator.validate(currentPath)){
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
	"InitializationTime": "",
	"LastConfigurationTime": "",
	"LastNPMInstallTime": "",
	"FrontendLastBuildTime": "",
	"LastPublishTime": "",
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
    configureProject,
    getProjectInfo,
    listProjectConfig,
    setProjectInfo,
    updateBackendProjectDetails,
    onClearBackend,
    checkBackendUpdateNoConflict
}
