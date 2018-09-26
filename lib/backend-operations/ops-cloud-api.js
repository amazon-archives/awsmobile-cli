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
const ora = require('ora')
const chalk = require('chalk')
const moment = require('moment')
const extract =  require('extract-zip')
const path = require('path')
const https = require('https')

const backendSpecManager = require('./backend-spec-manager.js')
const lambdaBuilder = require('./cloud-api-lambda-builder.js')
const lambdaUploader = require('./cloud-api-lambda-uploader.js')
const dfops = require('../utils/directory-file-ops.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')
const cloudFormationCodes = require('../aws-operations/cloud-formation-codes.js')
const awsClient = require('../aws-operations/aws-client.js')

const _featureName = 'cloud-api'
const _featureCommands ={
    'invoke': 'awsmobile cloud-api invoke <apiname> <method> <path> [init]'
}

function specify(projectInfo) {
    try{
        const featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
        fs.ensureDirSync(featureDirPath)
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.specify(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' feature specification error:'))
        console.log(e)
    }
}

function hasCommand(command){
    return _featureCommands.hasOwnProperty(command)
}

function runCommand(command, projectInfo, args){
    switch(command){
        case 'invoke': 
            commandInvoke(projectInfo, args)
        break
        default: 
            console.log(chalk.red('awsmobile ' + _featureName + ' does NOT recognize the command: ' + command))
        break
    }
}

function commandInvoke(projectInfo, args) {
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.invoke(projectInfo, args)
    }catch(e){
        console.log(chalk.red(_featureName + ' invoke error:'))
        console.log(e)
    }
}

function onFeatureTurnOn(projectInfo, backendProjectSpec){
    try{
        const featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
        fs.ensureDirSync(featureDirPath)
        
        const featureBuildDirPath = pathManager.getBackendBuildFeatureDirPath(projectInfo.ProjectPath, _featureName)
        if(fs.existsSync(featureBuildDirPath)){
            fs.removeSync(featureBuildDirPath)
        }

        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.onFeatureTurnOn(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOn error:'))
        console.log(e)
    }
}

function onFeatureTurnOff(projectInfo, backendProjectSpec){
    try{
        let featureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
        if(fs.existsSync(featureDirPath)){
            fs.removeSync(featureDirPath)
        }
        const featureBuildDirPath = pathManager.getBackendBuildFeatureDirPath(projectInfo.ProjectPath, _featureName)
        if(fs.existsSync(featureBuildDirPath)){
            fs.removeSync(featureBuildDirPath)
        }
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.onFeatureTurnOff(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOff error:'))
        console.log(e)
    }
}

function build(projectInfo, backendProject, callback){
    lambdaBuilder.build(projectInfo, backendProject, _featureName, function(isNewBuildExecuted){
        if(callback){
            callback(isNewBuildExecuted)
        }
    })
}

function preBackendUpdate(projectInfo, backendProjectDetails,  awsDetails, callback) {
    lambdaUploader.uploadLambdaZipFiles(projectInfo, awsDetails, backendProjectDetails, _featureName, callback)
}

//////////////////// sync backend project ////////////////////
function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, callback){
    let lambdaFunctions = backendDetails.resources.filter(isCompleteLamdbaFunction)
    if(lambdaFunctions && lambdaFunctions.length > 0){
        let count = 0
        let spinner = new ora('downloading cloud-api lambda function codebases')
        spinner.start()
        lambdaFunctions.forEach(function(lambdaFunction){
            downloadLambdaFunction(projectInfo, awsDetails, lambdaFunction, function(){
                count ++
                if(count == lambdaFunctions.length){
                    spinner.stop()
                    if(callback){
                        callback()
                    }
                }
            })
        })
    }else{ 
        if(callback){
            callback()
        }
    }
}

function downloadLambdaFunction(projectInfo, awsDetails, lambdaFunction, callback){
    const getParams = { FunctionName: lambdaFunction.name }
    const lambdaClient = awsClient.Lambda(awsDetails, lambdaFunction.attributes.region)
    lambdaClient.getFunction(getParams, (err, data) => {
        if(err){
            console.log(chalk.red('error get lambda function details for ' + lambdaFunction.name))
            console.log(err)
            if(callback){
                callback()
            }
        }else if(data && data.Code && data.Code.Location){ 
            const downloadUrl = data.Code.Location
            const featureCurrentInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
            fs.ensureDirSync(featureCurrentInfoDirPath)
            const handlerName = getHandlerName(lambdaFunction); 
            if(handlerName){
                const functionDestDirPath = path.join(featureCurrentInfoDirPath, handlerName);
                fs.emptyDirSync(functionDestDirPath)

                const tempZipFileName = handlerName +'.zip'
                const tempZipFilePath = path.join(featureCurrentInfoDirPath, tempZipFileName)
                const tempZipFileStream = fs.createWriteStream(tempZipFilePath)

                var request = https.get(downloadUrl, function(response) {
                    response.pipe(tempZipFileStream)
                    .on('close',()=>{
                        extract(tempZipFilePath, {dir: functionDestDirPath}, function (err) {
                            if(err){
                                console.log(chalk.red('error extracting ' + tempZipFileName))
                                console.log(err)
                                console.log('you can try to manually extract the lambda function code base')
                                fs.removeSync(functionDestDirPath)
                            }else{
                                fs.removeSync(tempZipFilePath)
                            }
                            if(callback){
                                callback()
                            }
                        })
                    })
                }).on('error', (err) => {
                    console.log(chalk.red('error downloading codebase for ' + lambdaFunction.name))
                    console.log(err)
                    if(callback){
                        callback()
                    }
                })
            }
        }
    })
}

function getHandlerName(lambdaFunction){
    let result; 
    if(lambdaFunction.attributes && lambdaFunction.attributes.configHandlerName){
        result = lambdaFunction.attributes.configHandlerName; 
    }else if(lambdaFunction.name){
        const substrs = lambdaFunction.name.split('-'); 
        if(substrs.length > 2){
            result = substrs[1]; 
        }
    }
    return result; 
}

function syncToDevBackend(projectInfo, backendProject, enabledFeatures){
    let featureCurrentInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
    if(fs.existsSync(featureCurrentInfoDirPath)){
        let featureBackendDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
        fs.copySync(featureCurrentInfoDirPath, featureBackendDirPath)
    }
}

function isCompleteLamdbaFunction(resource){
    return (resource.type == "AWS::Lambda::Function" &&
                            resource.feature == _featureName &&
                            resource.attributes.status.includes('COMPLETE'))
}

/////////////////Cloud Formation Logic/////////////////
function getStateGroup(stateSummary){
    //-2: unrecognized
    //-1: not-yet-deployed
    // 0: in-progress
    // 1: terminal_complate
    // 2: terminal_failed
    let result = -2 
    if(cloudFormationCodes.stackStatusCodes.includes(stateSummary)){
        result = 0
        if(cloudFormationCodes.terminalState_NotDeployed.includes(stateSummary)){
            result = -1
        }else if(cloudFormationCodes.terminalState_Complete.includes(stateSummary)){
            result = 1
        }else if(cloudFormationCodes.terminalState_Failed.includes(stateSummary)){
            result = 2
        }
    }
    return result
}

function getFormationStateSummary(backendDetails){
    let result
    let cloudFormataion = backendDetails.resources.find(isCloudApiFormation)
    if(cloudFormataion){
        result = cloudFormataion.attributes.stateSummary
    }
    return result
}

function isCloudApiFormation(resource){
    let result = false
    try{
        result = (resource.type == "AWS::CloudFormation::Stack" &&
                                resource.name == 'Development' &&
                                resource.feature == _featureName)
    }catch(e){
        result = false
    }
    return result
}

module.exports = {
    featureName: _featureName,
    featureCommands: _featureCommands,
    specify,
    hasCommand,
    runCommand,
    onFeatureTurnOn,
    onFeatureTurnOff,
    build,
    preBackendUpdate,
    syncCurrentBackendInfo,
    syncToDevBackend,
    getStateGroup,
    getFormationStateSummary
}
  