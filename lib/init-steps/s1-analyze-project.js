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
const moment = require('moment')

const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsMobileYamlOps = require('../aws-operations/mobile-yaml-ops.js')
const dfOps = require('../utils/directory-file-ops.js')

const framework = [
    'react',
    'react-native',
    'angular',
    'ionic',
	'vue'
]

const projectStage = [
    'clean-slate',
    'invalid',
    'backend-valid',
    'project-info-valid',
    'valid'
]

function run(initInfo){
    return new Promise((resolve, reject)=>{
        if(fs.existsSync(initInfo.projectPath)){
            initInfo.backupAWSMobileJSDirPath = undefined
            initInfo.projectInfo = getProjectInfo(initInfo.projectPath)
            initInfo.projectConfig = getProjectConfig(initInfo.projectPath)
            initInfo.backendProject = getBackendProject(initInfo.projectPath, initInfo.initNewProject)
            initInfo.packageJson = getPackageJson(initInfo.projectPath)
            initInfo.framework = guessFramework(initInfo)
            initInfo.initialStage = guessProjectStage(initInfo)
            resolve(initInfo)
        }else{
            reject(new Error('project path does not exist :' + initInfo.projectPath))
        }
    })
}
  
function getProjectInfo(projectPath){
    let result 
    let projectInfo = dfOps.readJsonFile(pathManager.getProjectInfoFilePath(projectPath))
    if(projectInfo && projectInfo.InitializationTime && projectInfo.BackendProjectID && projectInfo.BackendProjectName){
        let initTimeStamp = moment(projectInfo.InitializationTime, awsmobileJSConstant.DateTimeFormatString)
        if(initTimeStamp.isValid()){
            result = projectInfo
        }
    }
    return result
}

function getProjectConfig(projectPath){
    let result 
    let config = dfOps.readJsonFile(pathManager.getProjectConfigFilePath(projectPath))
    if(config && config.SourceDir && config.DistributionDir && config.BuildCommand && config.StartCommand ){
        let srcDirPath = path.normalize(path.join(projectPath, config.SourceDir))
        if(fs.existsSync(srcDirPath)){
            result = config
        }
    }
    return result
}

function getBackendProject(projectPath, suppressErrors = false){
    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    let backendProject = awsMobileYamlOps.readYamlFileSync(backendProjectYamlFilePath, suppressErrors)
    return backendProject
}

function getPackageJson(projectPath){
    return dfOps.readJsonFile(path.normalize(path.join(projectPath, 'package.json')))
}

function guessProjectStage(initInfo){
    let stage = 'clean-slate'
    let awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(initInfo.projectPath)
    if(fs.existsSync(awsmobilejsDirPath)){
        stage = 'invalid'
        if(initInfo.backendProject && initInfo.projectInfo){
            stage = 'valid'
        }else if(initInfo.backendProject){
            stage = 'backend-valid'
        }else if(initInfo.projectInfo){
            stage = 'project-info-valid'
        }
    }
    return stage
}

function guessFramework(initInfo){
    let frameWorkName
    let packageJson = initInfo.packageJson
    if(packageJson && packageJson.dependencies){
        if(packageJson.dependencies['react']){
            frameWorkName = 'react'
            if(packageJson.dependencies['react-native']){
                frameWorkName = 'react-native'
            }
        }else if(packageJson.dependencies['@angular/core']){
            frameWorkName = 'angular'
            if(packageJson.dependencies['ionic-angular']){
                frameWorkName = 'ionic'
            }
        }else if(packageJson.dependencies['vue']){
            frameWorkName = 'vue'
        }
    }
    return frameWorkName
}

module.exports = {
    run
}
