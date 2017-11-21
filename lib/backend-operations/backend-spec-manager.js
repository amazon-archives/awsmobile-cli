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
const _ = require('lodash')
const util = require('util')
const chalk = require('chalk')
const path = require('path')
const inquirer = require('inquirer')

const opsUserSignin = require('./ops-user-signin.js')
const backendFormats = require('./backend-formats.js')
const backendFeatures = require('../aws-operations/mobile-features.js')
const awsConfigManager = require('../aws-operations/aws-config-manager')
const awsMobileYamlOps = require('../aws-operations/mobile-yaml-ops.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const dfops = require('../utils/directory-file-ops.js')
const objOps = require('../utils/object-ops.js')
const featureYmalNameMapping = require('../utils/feature-yaml-name-mapping.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')

function listEnabledFeatures(projectInfo){
    let featureNames = getEnabledFeatures(projectInfo)
    if(featureNames){
        if(featureNames.length > 0){
            let featureListDisplay = concatFeatureNames(featureNames)
            console.log('backend awsmobile project enabled features:')
            console.log(chalk.green(featureListDisplay))
        }else{
            console.log(chalk.blue('no backend awsmobile feature is selected for this project'))
        }
    }else{
        console.log(chalk.red('local backend specs appear to be corrupted'))
        console.log('please restored the local backend specs to valid state before continuing')
    }
}

function listAllFeatures(projectInfo){
    let featureListDisplay = concatFeatureNames(backendFeatures)
    console.log('awsmobile features:')
    console.log(chalk.blue(featureListDisplay))
}

function concatFeatureNames(featureNames){
    let sortedFeatureNames = featureNames.sort()
    let featureListDisplay = ''
    sortedFeatureNames.forEach(function(featureName){
        featureListDisplay += ', ' + featureName
    })
    featureListDisplay = featureListDisplay.substr(2)
    return featureListDisplay
}


function getEnabledFeatures(projectInfo)
{
    let backendProject = getBackendProjectObject(projectInfo)
    return  getEnabledFeaturesFromObject(backendProject)
}


function getEnabledFeaturesFromObject(backendProject)
{
    let result
    if(backendProject){
        result = []
        if(backendProject.features){
            let ymlFeatures = _.keys(backendProject.features)
            if(ymlFeatures && ymlFeatures.length > 0){
                ymlFeatures.forEach(function(ymlFeatureName) {
                    let featureName = getFeatureName(ymlFeatureName)
                    if(featureName && !result.includes(featureName)){
                        if(featureName == opsUserSignin.featureName){
                            if(backendProject.features[ymlFeatureName].attributes && 
                                backendProject.features[ymlFeatureName].attributes.enabled){
                                    result.push(featureName)
                            }
                        }else{
                            result.push(featureName)
                        }
                    }
                })
            }
        }
    }
    return result
}

function updataFeatureList(projectInfo, oldFeatures, newFeatures){
    let backendProjectSpec = getBackendProjectObject(projectInfo)
    
    if(backendProjectSpec){
        let featuresToAdd = []
        let featuresToRemove = []

        oldFeatures.forEach(function(oldFeature) {
            if(!newFeatures.includes(oldFeature)){
                featuresToRemove.push(oldFeature)
            }
        })

        newFeatures.forEach(function(newFeature) {
            if(!oldFeatures.includes(newFeature)){
                featuresToAdd.push(newFeature)
            }
        })

        removeFeatures(projectInfo, backendProjectSpec, featuresToRemove).then(()=>{
            if(featuresToAdd.length > 0){
                addFeatures(projectInfo, backendProjectSpec, featuresToAdd)
            }
            listEnabledFeatures(projectInfo)
        })
    }else{
        console.log(chalk.red('local backend specs appear to be corrupted'))
        console.log('please restore the local backend specs before continuing')
    }
}

function enableFeature(projectInfo, featureName, ifUsePrompt){ 
    let backendProjectSpec = getBackendProjectObject(projectInfo)
    if(backendProjectSpec){
        let enabledFeatures = getEnabledFeaturesFromObject(backendProjectSpec)
        if(enabledFeatures.includes(featureName)){
            console.log(featureName + ' is already enabled')
            console.log(chalk.gray('# to configure the feature'))
            console.log('    $ awsmobile ' + featureName + ' configure')
        }else if(ifUsePrompt){
            const featureOpsFilePath = pathManager.getOpsFeatureFilePath(featureName)
            const featureOps = require(featureOpsFilePath)
            featureOps.specify(projectInfo)
        }else{
            addFeatures(projectInfo, backendProjectSpec, [featureName])
            listEnabledFeatures(projectInfo)
        }
    }else{
        console.log(chalk.red('local backend specs appear to be corrupted'))
        console.log('please restore the local backend specs before continuing')
    }
}

function disableFeature(projectInfo, featureName){ 
    let backendProjectSpec = getBackendProjectObject(projectInfo)
    if(backendProjectSpec){
        let enabledFeatures = getEnabledFeaturesFromObject(backendProjectSpec)
        if(!enabledFeatures.includes(featureName)){
            console.log(chalk.red(featureName + ' is not currently enabled'))
        }else{
            removeFeatures(projectInfo, backendProjectSpec, [featureName]).then(function(){
                listEnabledFeatures(projectInfo)
            })
        }
    }else{
        console.log(chalk.red('local backend specs appear to be corrupted'))
        console.log('please restored the local backend specs to valid state before continuing')
    }
}

function configureFeature(projectInfo, featureName){ 
    let backendProjectSpec = getBackendProjectObject(projectInfo)
    if(backendProjectSpec){
        let enabledFeatures = getEnabledFeaturesFromObject(backendProjectSpec)
        if(!enabledFeatures.includes(featureName)){
            console.log(chalk.red(featureName + ' is not currently enabled'))
            console.log(chalk.gray('# to enable the feature'))
            console.log('    $ awsmobile ' + featureName + ' enable')
        }else{
            const featureOpsFilePath = pathManager.getOpsFeatureFilePath(featureName)
            const featureOps = require(featureOpsFilePath)
            featureOps.specify(projectInfo)
        }
    }else{
        console.log(chalk.red('local backend specs appear to be corrupted'))
        console.log('please restored the local backend specs to valid state before continuing')
    }
}
 
function initialize(projectInfo, awsConfig){
    let ymlTemplateFilePath = pathManager.getProjectYmlTemplateFilePath(projectInfo.ProjectPath)
    let backendProject = awsMobileYamlOps.loadYml(ymlTemplateFilePath)
    backendProject.name = nameManager.generateBackendProjectName(projectInfo)
    backendProject.region = awsConfig.region

    setBackendProjectObject(backendProject, projectInfo)
}

//happens with delete or detach backend project
function onClearBackend(projectInfo){
    let backendProject = getBackendProjectObject(projectInfo)
    if(backendFeatures){
        backendProject.name = ''
        setBackendProjectObject(backendProject, projectInfo)
    }
}

function synSpecWithCurrentBackendSpec(projectInfo, callback){
    let backendProject = awsMobileYamlOps.loadYml(pathManager.getCurrentBackendYamlFilePath(projectInfo.ProjectPath))
    if(backendProject){
        setBackendProjectObject(backendProject, projectInfo)
    }
    if(callback){
        callback()
    }
}

function getBackendProjectObject(projectInfo)
{
    let backendProject

    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectInfo.ProjectPath)
    let backendProjectJsonFilePath = pathManager.getBackendSpecProjectJsonFilePath(projectInfo.ProjectPath)

    if(fs.existsSync(backendProjectYamlFilePath)){
        backendProject = awsMobileYamlOps.loadYml(backendProjectYamlFilePath)
    }else if(fs.existsSync(backendProjectJsonFilePath)){
        backendProject = awsMobileYamlOps.loadJson(backendProjectJsonFilePath)
    }else{
        console.log(chalk.red('can not locate mobile-hub-project file inside ' + pathManager.getBackendDirPath_relative(projectInfo.ProjectPath)))
    }

    return backendProject
}

function onBackendFormatChange(projectInfo)
{
    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectInfo.ProjectPath)
    let backendProjectJsonFilePath = pathManager.getBackendSpecProjectJsonFilePath(projectInfo.ProjectPath)
   
    if(fs.existsSync(backendProjectYamlFilePath) && projectInfo.BackendFormat == backendFormats.Json){
        backendProject = awsMobileYamlOps.loadYml(backendProjectYamlFilePath)
        if(backendProject){
            awsMobileYamlOps.dumpJson(backendProject, backendProjectJsonFilePath)
            fs.removeSync(backendProjectYamlFilePath)
        }else{
            console.log(chalk.red('local backend specs appear to be corrupted'))
            console.log('please restored the local backend specs to valid state before continuing')
        }
    }else if(fs.existsSync(backendProjectJsonFilePath) && projectInfo.BackendFormat == backendFormats.Yaml){
        backendProject = awsMobileYamlOps.loadJson(backendProjectJsonFilePath)
        if(backendProject){
            awsMobileYamlOps.dumpYaml(backendProject, backendProjectYamlFilePath)
            fs.removeSync(backendProjectJsonFilePath)
        }else{
            console.log(chalk.red('local backend specs appear to be corrupted'))
            console.log('please restored the local backend specs to valid state before continuing')
        }
    }
}

function setBackendProjectObject(backendProject, projectInfo)
{
    if(projectInfo && backendProject){
        let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectInfo.ProjectPath)
        let backendProjectJsonFilePath = pathManager.getBackendSpecProjectJsonFilePath(projectInfo.ProjectPath)

        switch(projectInfo.BackendFormat){
            case backendFormats.Yaml:
                awsMobileYamlOps.dumpYaml(backendProject, backendProjectYamlFilePath)
            break
            case backendFormats.Json:
                awsMobileYamlOps.dumpJson(backendProject, backendProjectJsonFilePath)
            break
            default:
                awsMobileYamlOps.dumpYaml(backendProject, backendProjectYamlFilePath)
        }
    }
}

function getLastModificationTime(projectInfo){

    let result 
    if(projectInfo){

        let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectInfo.ProjectPath)
        let backendProjectJsonFilePath = pathManager.getBackendSpecProjectJsonFilePath(projectInfo.ProjectPath)
    
        if(fs.existsSync(backendProjectYamlFilePath)){
            result = fs.lstatSync(backendProjectYamlFilePath).mtime
        }else if(fs.existsSync(backendProjectJsonFilePath)){
            result = fs.lstatSync(backendProjectJsonFilePath).mtime
        }else{
            console.log(chalk.red('can not locate mobile-hub-project file inside ' + pathManager.getBackendDirPath_relative(projectInfo.ProjectPath)))
        }
    }
    return result
}

function getYmlFeatureName(featureName){
    return featureYmalNameMapping[featureName]
}

function getFeatureName(ymlFeatureName){
    let result 
    backendFeatures.forEach(function(featureName) {
        if(featureYmalNameMapping[featureName].includes(ymlFeatureName)){
            result = featureName
        }
    })
    return result
}

function addFeatures(projectInfo, backendProjectSpec, featuresToAdd){ //featuresToAdd is an array that's already validated and cleansed
    if(backendProjectSpec){
        if(!backendProjectSpec.features){
            //user might have accidently removed features property, but yml is still valid
            //awsmobile-cli will be tolerant in this scenario
            backendProjectSpec.features = {} 
        }
        let featuresTurnedOn = []

        featuresToAdd.forEach(function(newFeature) {
            let featureYmlFilePath = pathManager.getFeatureYmlTemplateFilePath(projectInfo.ProjectPath, newFeature)
            let featureObject = awsMobileYamlOps.loadYml(featureYmlFilePath)
            Object.assign(backendProjectSpec.features, featureObject.features)
            featuresTurnedOn.push(newFeature)
        })

        backendProjectSpec.features = objOps.sortByPropertyKey(backendProjectSpec.features)
        setBackendProjectObject(backendProjectSpec, projectInfo)

        if(featuresTurnedOn.length > 0){
            featuresTurnedOn = featuresTurnedOn.sort()
            let featureListDisplay = ''
            featuresTurnedOn.forEach(function(featureName){
                onFeatureTurnOn(projectInfo, backendProjectSpec, featureName)
                featureListDisplay += ', ' + featureName
            })
    
            featureListDisplay = featureListDisplay.substr(2)
            console.log('enabled: ' + chalk.green(featureListDisplay))
        }
    }
}

function removeFeatures(projectInfo, backendProjectSpec, featuresToRemove){
    return new Promise(function (resolve, reject) {
        if(featuresToRemove.length > 0){
            console.log(chalk.bgYellow.bold('Warning:') + ' disabled feature can not be recovered locally, even if you enable it again' )
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'disableFeatures',
                    message: 'please confirm to disable: ' + concatFeatureNames(featuresToRemove),
                    default: false
                }
            ]).then(function (answers) {
                if(answers.disableFeatures){
                    if(!backendProjectSpec.features){
                        //user might have accidently removed features property, but yml is still valid
                        //awsmobile-cli will be tolerant in this scenario
                        backendProjectSpec.features = {} 
                    }
                    let featuresTurnedOff = []
            
                    featuresToRemove.forEach(function(oldFeature) {
                        let ymlFeatureNames = getYmlFeatureName(oldFeature)
                        if(ymlFeatureNames){
                            ymlFeatureNames.forEach(function(ymlFeatureName) {
                                delete backendProjectSpec.features[ymlFeatureName]
                            })
                            featuresTurnedOff.push(oldFeature)
                        }
                    })
            
                    backendProjectSpec.features = objOps.sortByPropertyKey(backendProjectSpec.features)
                    setBackendProjectObject(backendProjectSpec, projectInfo)
            
                    if(featuresTurnedOff.length > 0){
                        featuresTurnedOff = featuresTurnedOff.sort()
                        let featureListDisplay = ''
                        featuresTurnedOff.forEach(function(featureName){
                            onFeatureTurnOff(projectInfo, backendProjectSpec, featureName)
                            featureListDisplay += ', ' + featureName
                        })
                        featureListDisplay = featureListDisplay.substr(2)
                        console.log('disabled: ' + chalk.red(featureListDisplay))
                    }
                    resolve()
                }else{
                    resolve()
                }
            })
        }else{
            resolve()
        }
    })
}

function onFeatureTurnOn(projectInfo, backendProjectSpec, featureName){
    try{
        const featureOpsFilePath = pathManager.getOpsFeatureFilePath(featureName)
        const featureOps = require(featureOpsFilePath)
        featureOps.onFeatureTurnOn(projectInfo)
    }catch(e){
        console.log(e)
    }
}

function onFeatureTurnOff(projectInfo, backendProjectSpec, featureName){
    try{
        const featureOpsFilePath = pathManager.getOpsFeatureFilePath(featureName)
        const featureOps = require(featureOpsFilePath)
        featureOps.onFeatureTurnOff(projectInfo)
    }catch(e){
        console.log(e)
    }
}

module.exports = {
    listEnabledFeatures,
    listAllFeatures,
    getEnabledFeatures,
    getEnabledFeaturesFromObject,
    updataFeatureList,
    enableFeature,
    disableFeature,
    configureFeature,
    initialize,
    onClearBackend,
    synSpecWithCurrentBackendSpec,
    getBackendProjectObject,
    onBackendFormatChange,
    setBackendProjectObject,
    getLastModificationTime
}
  