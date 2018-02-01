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
const ora = require('ora')
const chalk = require('chalk')

const projectInfoManager = require('./project-info-manager')
const baseManager = require('./awsmobilebase-manager.js')
const starterManager = require('./awsmobilestarter-manager.js')
const starterRepoMapping = require('./utils/starter-repo-mapping.js')
const starterConfigMappings = require('./utils/starter-config-mappings.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')
const gitManager = require('./utils/git-manager')

function start(projectName, starterName){
    if(!projectName){
        projectName = nameManager.generateProjectName()
    }
    let projectPath = path.join(process.cwd(), projectName)

    if(fs.existsSync(projectPath)){
        console.log(chalk.red('Error: \'' + projectName + '\' already exists in the current directory'))
    }else{
        if(starterName){
            let repo = starterRepoMapping[starterName]
            if(repo){
                console.log('Creating project ' + projectName)
                starterManager.placeStarter(projectPath, repo, function(contentZipFilePath, tempDirPath){
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
    awsmobileBaseManager.placeAwsmobileBase(projectPath, function(){
        initialize(projectPath, function(projectInfo){
            setupBackend(projectInfo, mobileProjectID)
        })
    })
}

function initialize(projectPath, callback)
{
    setupAmplifyDependency(projectPath)
    gitManager.initialize(projectPath)
    let projectInfo = projectInfoManager.initialize(projectPath)
}

function setupAmplifyDependency(projectPath){
    let packageJsonFilePath = path.normalize(path.join(projectPath, 'package.json'))
    if(fs.existsSync(packageJsonFilePath)){
        let packageObj = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
        if(!packageObj.dependencies){
            packageObj.dependencies = {}
        }
        packageObj.dependencies["aws-amplify"] = "^0.1.x"
        let jsonString = JSON.stringify(packageObj, null, 2)
        fs.writeFileSync(packageJsonFilePath, jsonString, 'utf8')
    }
}

function setupBackend(projectInfo, mobileProjectID){
}

function list(){   
    console.log(chalk.gray('    # awsmobile features'))
    for(var starter in starterRepoMapping){
        console.log('      ' + starter)
    }
}

module.exports = {
    start,
    list
}

