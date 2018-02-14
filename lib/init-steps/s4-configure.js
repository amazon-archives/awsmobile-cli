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
const fs = require('fs-extra')
const inquirer = require('inquirer')

const pathManager = require('../utils/awsmobilejs-path-manager.js')
const frameworkConfigMappings = require('../utils/framework-config-mappings.js')

function run(initInfo){
    let result = initInfo

	if(initInfo.strategy){
        if(initInfo.projectConfig){
            persistProjectConfig(initInfo)
        }else{
            console.log('Please tell us about your project:')
            result = configureProject(initInfo)
        }
    }

    return result
}

function persistProjectConfig(initInfo){
    let projectConfigFilePath = pathManager.getProjectConfigFilePath(initInfo.projectPath)
    let jsonString = JSON.stringify(initInfo.projectConfig, null, '\t')
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8')
}

function configureProject(initInfo){
    let config = frameworkConfigMappings['default']
    if(initInfo.framework){
        config = frameworkConfigMappings[initInfo.framework]
    }

    const questions = [
        {
            type: 'input',
            name: 'srcDir',
            message: "Where is your project's source directory: ",
            default: config.SourceDir
        },
        {
            type: 'input',
            name: 'distDir',
            message: "Where is your project's distribution directory that stores build artifacts: ",
            default: config.DistributionDir
        },
        {
            type: 'input',
            name: 'buildCommand',
            message: "What is your project's build command: ",
            default: config.BuildCommand
        },
        {
            type: 'input',
            name: 'startCommand',
            message: "What is your project's start command for local test run: ",
            default: config.StartCommand
        }
    ]
    
    return inquirer.prompt(questions).then(function (answers) {
        let projectConfig = {}
        if(answers.srcDir){
            projectConfig.SourceDir = answers.srcDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.SourceDir != config.SourceDir){
                isConfigChanged = true
            }
        }
        if(answers.distDir){
            projectConfig.DistributionDir = answers.distDir.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.DistributionDir != config.DistributionDir){
                isConfigChanged = true
            }
        }
        if(answers.buildCommand){
            projectConfig.BuildCommand = answers.buildCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.BuildCommand != config.BuildCommand){
                isConfigChanged = true
            }
        }
        if(answers.startCommand){
            projectConfig.StartCommand = answers.startCommand.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
            if(projectConfig.StartCommand != config.StartCommand){
                isConfigChanged = true
            }
        }

        validateNewConfig(projectConfig, initInfo.projectInfo)

        initInfo.projectConfig = projectConfig
        persistProjectConfig(initInfo)

        return initInfo
    })
}
        

function validateNewConfig(projectConfig, projectInfo){
    let srcDirPath = path.normalize(path.join(projectInfo.ProjectPath, projectConfig.SourceDir))
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

module.exports = {
    run
}
