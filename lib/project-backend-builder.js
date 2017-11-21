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
const _ = require('lodash')
const chalk = require('chalk')
const moment = require('moment')
const fs = require('fs-extra')

const projectInfoManager = require('./project-info-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const backendSpecManager = require('./backend-operations/backend-spec-manager.js')
const opsProject = require('./backend-operations/ops-project.js')

let _callback
let _projectInfo
let _backendProject

function build(callback) {
    _callback = callback
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        _backendProject = backendSpecManager.getBackendProjectObject(_projectInfo)
        if(_backendProject){
            console.log('building backend')
            let enabledFeatures = backendSpecManager.getEnabledFeaturesFromObject(_backendProject)
            if(enabledFeatures.length > 0){
                let count = 0
                enabledFeatures.forEach(function(featureName){
                    const opsFeature = require(pathManager.getOpsFeatureFilePath(featureName))
                    opsFeature.build(_projectInfo, _backendProject, function(){
                        count++
                        if(count == enabledFeatures.length){
                            opsProject.build(_projectInfo, _backendProject, onBuildComplete)
                        }
                    })                
                })
            }else{
                opsProject.build(_projectInfo, _backendProject, onBuildComplete)
            }
        }else{
            console.log(chalk.red('local backend specs appear to be corrupted'))
            console.log('please restored the local backend specs to valid state before continuing')
        }
    }
}

function onBuildComplete(){
    _projectInfo = projectInfoManager.getProjectInfo()
    _projectInfo.BackendLastBuildTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
    projectInfoManager.setProjectInfo(_projectInfo)
    console.log()
    console.log('Successfully built backend, build artifacts are saved at: ')
    console.log(chalk.blue(pathManager.getBackendBuildDirPath(_projectInfo.ProjectPath)))
    if(_callback){
        _callback()
    }else{
        console.log()
        console.log('to update project in aws, please execute')
        console.log(chalk.blue('$ awsmobile push'))
    }
}

module.exports = {
    build
}


