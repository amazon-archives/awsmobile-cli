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
const chalk = require('chalk')
const archiver = require('archiver')
const moment = require('moment')
const _ = require('lodash')

const backendSpecManager = require('./backend-spec-manager.js')
const dfops = require('../utils/directory-file-ops.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')

let _projectInfo
let _backendProject
let _featureName //cloud-api feature name
let _callback

let _srcDirPath //contains all the lambda function
let _buildDirPath 

let _cloudApiPaths
let _lambdaFuncNames
let _lambdaFuncSrcDirs
let _lambdaFuncZipFiles

function build(projectInfo, backendProject, featureName, callback){
    _projectInfo = projectInfo
    _backendProject = backendProject
    
    _featureName = featureName
    _callback = callback
    if(validateCodebase()){
        buildLambdaFunctions(function(isNewBuildExecuted){
            if(updateLambdaFuncCodeName()){
                backendSpecManager.setBackendProjectObject(_backendProject, _projectInfo)
            }
            if(_callback){
                _callback(isNewBuildExecuted)
            }
        })
    }else{
        console.log(chalk.red('validation failed'))
    }
}

function validateCodebase(){
    let isCodebaseValid = true

    _srcDirPath = pathManager.getBackendFeatureDirPath(_projectInfo.ProjectPath, _featureName)
    _buildDirPath = pathManager.getBackendBuildFeatureDirPath(_projectInfo.ProjectPath, _featureName)
    
    getCloudApiPaths()
    getLambdaFunDirs()
    getExistingZipFiles()

    let paths = _.keys(_cloudApiPaths)
    let srcDirs = _.keys(_lambdaFuncSrcDirs)

    for(let i = 0; i<paths.length; i++){
        let lambdaFunc = _cloudApiPaths[paths[i]]
        if( /[^a-zA-Z0-9]/.test(lambdaFunc.name)){
            console.log(chalk.red('invalid lambda function name: ' + paths[i] + ': ' + lambdaFunc.name))
            console.log('lambda function name can only contain alphanumeric characters:  a-z A-Z 0-9')
            isCodebaseValid = false
        }
        if(!srcDirs.includes(lambdaFunc.name)){
            console.log('      ' + chalk.bgYellow.bold('Warning:') + ' no codebase found for lambda function: ' + paths[i] + ': ' + lambdaFunc.name)
        }
    }

    return isCodebaseValid
}

function getCloudApiPaths(){
    _cloudApiPaths = {}
    _lambdaFuncNames = []
    let components = _backendProject.features.cloudlogic.components
    let apiNames = _.keys(components)

    for(let i = 0; i<apiNames.length; i++){
        let api = components[apiNames[i]]
        if(api.paths){
            let pathNames = _.keys(api.paths)
            for(let j = 0; j < pathNames.length; j++){
                let key  = api.attributes.name + pathNames[j]
                let lambdaFunc = api.paths[pathNames[j]]
                _cloudApiPaths[key] = lambdaFunc
                if(!_lambdaFuncNames.includes(lambdaFunc.name)){
                    _lambdaFuncNames.push(lambdaFunc.name)
                }
            }
        }
    }
}

function getLambdaFunDirs(){
    _lambdaFuncSrcDirs = {}
    if(fs.existsSync(_srcDirPath)){
        let lambdaFunctionDirNames = fs.readdirSync(_srcDirPath)
        for(let i = 0; i < lambdaFunctionDirNames.length; i++) {
            let funcDirPath = path.join(_srcDirPath, lambdaFunctionDirNames[i])
            let stat = fs.lstatSync(funcDirPath)
            if(stat.isDirectory() && _lambdaFuncNames.includes(lambdaFunctionDirNames[i])) {
                _lambdaFuncSrcDirs[lambdaFunctionDirNames[i]] = funcDirPath
            }
        }
    }
}

function getExistingZipFiles(){
    _lambdaFuncZipFiles = {}
    if(fs.existsSync(_buildDirPath)){
        let zipFiles = fs.readdirSync(_buildDirPath)
        for(let i = 0; i < zipFiles.length; i++) {
            let zipFileName = zipFiles[i]
            let funcZipFilePath = path.join(_buildDirPath, zipFileName)
            let stat = fs.lstatSync(funcZipFilePath)
            if(stat.isFile()) {
                let strippedZipFileName = path.basename(zipFileName, '.zip').split('-')[0]
                if(_lambdaFuncNames.includes(strippedZipFileName)){
                    _lambdaFuncZipFiles[strippedZipFileName] = funcZipFilePath
                }else{
                    fs.removeSync(funcZipFilePath)
                }
            }else{
                fs.removeSync(funcZipFilePath)
            }
        }
    }
}


function buildLambdaFunctions(callback){

    let isNewBuildExecuted = false
    let zipFileNameSuffix = '-' + moment().format(awsmobileJSConstant.DateTimeFormatStringCompact)
    let srcFuncNames = _.keys(_lambdaFuncSrcDirs)
   
    if(srcFuncNames.length > 0){
        let count = 0
        for(let i = 0; i<srcFuncNames.length; i++){
            let lambdaFuncName = srcFuncNames[i]
            if(isNewBuildNeeded(lambdaFuncName)){

                fs.ensureDirSync(_buildDirPath)
                if(!isNewBuildExecuted){
                    isNewBuildExecuted = true
                    console.log('   building ' + _featureName)
                }

                let srcCodeDir = _lambdaFuncSrcDirs[lambdaFuncName]
                let zipFileName = lambdaFuncName  + zipFileNameSuffix + '.zip'
                let zipFilePath = path.join(_buildDirPath, zipFileName)

                let existingZipFilePath = _lambdaFuncZipFiles[lambdaFuncName]
                if(fs.existsSync(existingZipFilePath)){
                    fs.removeSync(existingZipFilePath)
                }
                _lambdaFuncZipFiles[lambdaFuncName] = zipFilePath

                buildAWSLambda(srcCodeDir, zipFilePath, function(){  
                    count ++ 
                    if(count == srcFuncNames.length){
                        if(isNewBuildExecuted){
                            console.log('   done')
                        }
                        if(callback){
                            callback(isNewBuildExecuted)
                        }
                    }
                })
            }else{
                count ++ 
                if(count == srcFuncNames.length){
                    if(isNewBuildExecuted){
                        console.log('   done')
                    }
                    if(callback){
                        callback(isNewBuildExecuted)
                    }
                }
            }
        }
    }else{
        if(callback){
            callback(false)
        }
    }
}

function updateLambdaFuncCodeName(){
    let codeFileNameUpdated = false
    let lambdaWithZipFiles = _.keys(_lambdaFuncZipFiles)
    for(let i = 0; i<lambdaWithZipFiles.length; i++){
        let lambdaFuncName = lambdaWithZipFiles[i]
        let zipFileName = path.basename(_lambdaFuncZipFiles[lambdaFuncName])

        let apiPaths = _.keys(_cloudApiPaths)
        for(let i = 0; i<apiPaths.length; i++){
            let lambdaFunc = _cloudApiPaths[apiPaths[i]]
            let codeFileName = 'uploads/' + zipFileName
            if(lambdaFunc.name == lambdaFuncName && lambdaFunc.codeFilename != codeFileName){
                lambdaFunc.codeFilename = codeFileName
                codeFileNameUpdated = true
            }
        }
    }
    return codeFileNameUpdated
}

function buildAWSLambda(srcCodeDir, zipFilePath, callback){

    let npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'
    require('child_process').spawnSync(npm, [ 'install' ], { cwd : srcCodeDir })
    let output = fs.createWriteStream(zipFilePath)
    
    console.log('      zipping ' + path.basename(srcCodeDir))
    output.on('close', function() {
        if(callback){
            callback()
        }
    })
    let zip = archiver.create('zip', {})
    zip.pipe(output)
    zip.directory(srcCodeDir, false)
    zip.finalize()
}


function isNewBuildNeeded(lambdaFuncName){
    let result = false

    let srcCodeDir = _lambdaFuncSrcDirs[lambdaFuncName]
    let existingZipFilePath = _lambdaFuncZipFiles[lambdaFuncName]

    if(srcCodeDir && fs.existsSync(srcCodeDir)){
        if(existingZipFilePath && fs.existsSync(existingZipFilePath)){ 
            let lastBackendBuildTime = moment(_projectInfo.BackendLastBuildTime, awsmobileJSConstant.DateTimeFormatString)
            let lastSrcDirModificationTime = moment(dfops.getDirContentMTime(srcCodeDir, null, null))
            let zipFileModificationTime = moment(fs.lstatSync(existingZipFilePath).mtime)
            result =!lastBackendBuildTime.isValid() ||
                    !lastSrcDirModificationTime.isValid() ||
                    !zipFileModificationTime.isValid() ||
                    zipFileModificationTime.isBefore(lastSrcDirModificationTime) ||
                    lastBackendBuildTime.isBefore(lastSrcDirModificationTime) ||
                    lastBackendBuildTime.isBefore(zipFileModificationTime) //user manually changed build
         
        }else{
            result = true
        }
    }

    return result
}

module.exports = {
    build
}