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
const util = require('util')

const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const projectValidator = require('./project-validator.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')

function initialize(projectPath, initialConfig){
    let projectConfig

    projectConfig = projectConfigTemplate
    
    if(initialConfig){
        Object.assign(projectConfig, initialConfig)
    }

    const jsonString = JSON.stringify(projectConfig, null, '\t')
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8')

    return projectConfig
}

function configureProject(projectInfo, callback){
    let isConfigChanged = false
    
    let projectConfig_0 = getProjectConfig(projectInfo)
    if(!projectConfig_0){
        projectConfig_0 = projectConfigTemplate
        isConfigChanged = true
    }

    inquirer.prompt([
        {
            type: 'input',
            name: 'srcDir',
            message: "Where is your project's source directory: ",
            default: projectConfig_0.SourceDir
        },
        {
            type: 'input',
            name: 'distDir',
            message: "Where is your project's distribution directory that stores build artifacts: ",
            default: projectConfig_0.DistributionDir
        },
        {
            type: 'input',
            name: 'buildCommand',
            message: "What is your project's build command: ",
            default: projectConfig_0.BuildCommand
        },
        {
            type: 'input',
            name: 'startCommand',
            message: "What is your project's start command for local test run: ",
            default: projectConfig_0.StartCommand
        }
    ]).then(function (answers) {

        let projectConfig = {}
        if(answers.srcDir){
            projectConfig.SourceDir = answers.srcDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.SourceDir != projectConfig_0.SourceDir){
                isConfigChanged = true
            }
        }
        if(answers.distDir){
            projectConfig.DistributionDir = answers.distDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.DistributionDir != projectConfig_0.DistributionDir){
                isConfigChanged = true
            }
        }
        if(answers.buildCommand){
            projectConfig.BuildCommand = answers.buildCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.BuildCommand != projectConfig_0.BuildCommand){
                isConfigChanged = true
            }
        }
        if(answers.startCommand){
            projectConfig.StartCommand = answers.startCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.StartCommand != projectConfig_0.StartCommand){
                isConfigChanged = true
            }
        }
                    
        validateNewConfig(projectConfig, projectPath)

        if(isConfigChanged){
            setProjectConfig(projectConfig, projectPath)
        }

        if(callback){
            callback(isConfigChanged, projectConfig_0, projectConfig)
        }
    })
}

function validateNewConfig(projectConfig, projectPath){
    let srcDirPath = path.normalize(path.join(projectPath, projectConfig.SourceDir))
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

function getProjectConfig(projectInfo){ 
    let projectConfig
    
    let projectConfigFilePath = pathManager.getProjectConfigFilePath(projectInfo.ProjectPath)

    if(fs.existsSync(projectConfigFilePath)){
        try{
            projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath, 'utf8'))
        }catch(e){
            projectConfig = undefined
        }
    }else{//if the project was initialized by an older version of the cli, the following line will split the config
        projectConfig = extractProjectConfig(projectInfo)
        if(projectConfig){
            setProjectConfig(projectConfig, projectInfo.ProjectPath)
        }
    }

    return projectConfig
}

function extractProjectConfig(projectInfo){
    let projectConfig

    if(projectInfo.SourceDir && projectInfo.DistributionDir && projectInfo.BuildCommand && projectInfo.StartCommand)
    {
        projectConfig = {}
        projectConfig.SourceDir = projectInfo.SourceDir
        projectConfig.DistributionDir = projectInfo.DistributionDir
        projectConfig.BuildCommand = projectInfo.BuildCommand
        projectConfig.StartCommand = projectInfo.StartCommand
    }

    return projectConfig
}

function setProjectConfig(projectConfig, projectPath){
    try{
        let projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
        let jsonString = JSON.stringify(projectConfig, null, '\t')
        fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8')
    }catch(e){
        console.log(chalk.red('error setting project configuration'))
        console.log(e)
    }
}


const projectConfigTemplate = {
	"SourceDir": "src",
	"DistributionDir": "build",
	"BuildCommand": (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
	"StartCommand": (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start")
}

module.exports = {
    configureProject,
    getProjectConfig
}
