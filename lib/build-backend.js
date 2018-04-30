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
const chalk = require('chalk')
const moment = require('moment')
const fs = require('fs-extra')

const projectInfoManager = require('./project-info-manager.js')
const awsmobilejsConstant = require('./utils/awsmobilejs-constant.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const backendSpecManager = require('./backend-operations/backend-spec-manager.js')
const opsProject = require('./backend-operations/ops-project.js')

let _callback
let _projectInfo
let _backendProject
let _isNewBuildExecuted = false

function build(callback) {
    _callback = callback
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        ensureFolderStructure(_projectInfo.ProjectPath)
        _backendProject = backendSpecManager.getBackendProjectObject(_projectInfo)
        if(_backendProject){
            console.log('checking the backend contents')
            let enabledFeatures = backendSpecManager.getEnabledFeatures(_projectInfo, _backendProject)
            if(enabledFeatures.length > 0){
                let count = 0
                enabledFeatures.forEach(function(featureName){
                    const opsFeature = require(pathManager.getOpsFeatureFilePath(featureName))
                    opsFeature.build(_projectInfo, _backendProject, function(isNewBuildExecuted){
                        if(isNewBuildExecuted){
                            _isNewBuildExecuted = true
                        }
                        count++
                        if(count == enabledFeatures.length){
                            opsProject.build(_projectInfo, _backendProject, function(isNewBuildExecuted){
                                if(isNewBuildExecuted){
                                    _isNewBuildExecuted = true
                                }
                                onBuildComplete()
                            })
                        }
                    })                
                })
            }else{
                opsProject.build(_projectInfo, _backendProject, function(isNewBuildExecuted){
                    if(isNewBuildExecuted){
                        _isNewBuildExecuted = true
                    }
                    onBuildComplete()
                })
            }
        }else{
            console.log(chalk.red('local backend specs appear to be corrupted'))
            console.log('please restore the local backend specs to a valid state before continuing')
        }
    }
}

function onBuildComplete(){
    if(_isNewBuildExecuted){
        _projectInfo.BackendLastBuildTime = moment().format(awsmobilejsConstant.DateTimeFormatString) 
        projectInfoManager.setProjectInfo(_projectInfo)
        console.log('backend build artifacts are saved at: ')
        console.log(chalk.blue(pathManager.getBackendBuildDirPath(_projectInfo.ProjectPath)))
    }
    if(_callback){
        _callback()
    }
}

function ensureFolderStructure(projectPath){
    let backendBuildPath = pathManager.getBackendBuildDirPath(projectPath)
    fs.ensureDirSync(backendBuildPath)
}

module.exports = {
    build
}


