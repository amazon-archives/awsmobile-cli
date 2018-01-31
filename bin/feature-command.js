#!/usr/bin/env node
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
const program = require('commander')
const chalk = require('chalk')
const _ = require('lodash')

const projectInfoManager = require('../lib/project-info-manager.js')
const pathManager = require('../lib/utils/awsmobilejs-path-manager.js')
const backendSpecManager = require('../lib/backend-operations/backend-spec-manager.js')
const mobileFeatures = require('../lib/aws-operations/mobile-features.js')

let _featureName
let _args
let _featureOps

const _commonCommands = 
{
    'enable': 'enable {featureName} in the backend awsmobile project',
    'disable': 'disable {featureName} in the backend awsmobile project',
    'configure': 'configure the feature specifics for {featureName}'
}
  
function run(featureName, args) {
    _featureName = featureName
    _args = args
    let featureOpsFilePath = pathManager.getOpsFeatureFilePath(featureName)
    if(fs.existsSync(featureOpsFilePath)){
        _featureOps = require(featureOpsFilePath)
        if(args.length > 3){
            let command = args[3]
            if(_commonCommands.hasOwnProperty(command)){
                switch(command){
                    case 'enable':
                        enable()
                    break
                    case 'disable':
                        disable()
                    break
                    case 'configure':
                        configure()
                    break;
                }
            }else{
                if(_featureOps.hasCommand(command)){
                    let projectInfo = projectInfoManager.getProjectInfo()
                    if(projectInfo){
                        _featureOps.runCommand(command, projectInfo, args)
                    }
                }else{
                    displayGeneralHelp()
                }
            }
        }else{
            displayGeneralHelp()
        }
    }else{
        console.log(chalk.red('awsmobile cli is corrupted, please re-instal it'))
    }
}

function enable(){
    if( _args.length > 4){
        if(_args[4] == '-p' || _args[4] == '--prompt'){
            let projectInfo = projectInfoManager.getProjectInfo()
            if(projectInfo){
                backendSpecManager.enableFeature(projectInfo, _featureName, true)
            }
        }else{
            displayHelp('enable')
            console.log('   ' + '   -p, --prompt  prompt to configure the enabled feature')
        }
    }else{
        let projectInfo = projectInfoManager.getProjectInfo()
        if(projectInfo){
            backendSpecManager.enableFeature(projectInfo, _featureName, false)
        }
    }
}

function disable(){
    if( _args.length > 4){
        displayHelp('disable')
    }else{
        let projectInfo = projectInfoManager.getProjectInfo()
        if(projectInfo){
            backendSpecManager.disableFeature(projectInfo, _featureName)
        }
    }
}

function configure(){
    if( _args.length > 4){
        displayHelp('configure')
    }else{
        let projectInfo = projectInfoManager.getProjectInfo()
        if(projectInfo){
            backendSpecManager.configureFeature(projectInfo, _featureName)
        }
    }
}

function displayGeneralHelp(){
    console.log('  Usage: awsmobile {featureName} <command> [options]'.replace('{featureName}', _featureName))
    console.log()
    console.log('  contains subcommands of the awsmobile feature ' + _featureName)
    console.log()
    console.log('  Options:'  )
    console.log()
    console.log('   ' + '   -h, --help  output usage information')
    console.log()
    console.log('  Commands:'  )
    console.log()
    _.keys(_commonCommands).forEach(function(command) {
        console.log('   ' + (command + '               ').slice(0,12) + _commonCommands[command].replace('{featureName}', _featureName))
    }, this)
    _.keys(_featureOps.featureCommands).forEach(function(command) {
        console.log('   ' + (command + '               ').slice(0,12) + _featureOps.featureCommands[command])
    }, this)
}

function displayHelp(subcommand){
    if(_commonCommands.hasOwnProperty(subcommand)){
        console.log('   Usage: awsmobile {featureName} {subcommand} [options]'.replace('{featureName}', _featureName).replace('{subcommand}', subcommand))
        console.log()
        console.log('   ' + _commonCommands[subcommand].replace('{featureName}', _featureName))
        console.log()
        console.log('   Options:'  )
        console.log()
        console.log('   ' + '   -h, --help  output usage information')
    }
}

function list(){
    console.log()
    console.log(chalk.gray('    #awsmobile features'))
    for(let i = 0; i < mobileFeatures.length; i++){
        console.log('      ' + mobileFeatures[i])
    }
}

module.exports = {
    run, 
    list
}