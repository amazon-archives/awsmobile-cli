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

const starterManager = require('./awsmobilestarter-manager.js')
const starterRepoMapping = require('./utils/starter-repo-mapping.js')
const starterConfigMappings = require('./utils/starter-config-mappings.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')

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
                starterManager.placeStarter(projectPath, repo, function(contentZipFilePath){
                    console.log(contentZipFilePath)
                })
            }else{
                console.log(chalk.red('unrecognized starter name \'' + starterName + '\''))
            }
        }else{
            console.log('Creating project ' + projectName)
            starterManager.placeBlankProject(projectPath, function(contentZipFilePath){
                console.log(contentZipFilePath)
            })
        }
    }
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

