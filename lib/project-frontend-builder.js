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
const path = require('path')
const fs = require('fs-extra')
const ora = require('ora')
const moment = require('moment')
const _ = require('lodash')

const { exec } = require('child_process')
const { spawn } = require('child_process')

const projectInfoManager = require('./project-info-manager.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const dfops = require('./utils/directory-file-ops.js')
const opsProject = require('./backend-operations/ops-project.js')

let _projectInfo

function build(callback) {
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        runNpmInstall(function(){
            runBuildCommand(function(){
                onBuildComplete(callback)
            })
        })
    }
}

function checkNpmInstall(callback){
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        runNpmInstall(callback)
    }
}

function runNpmInstall(callback){
    if(isNpmInstallNeeded()){
        console.log()
        console.log('executing npm install ...')
        let npmInstall = spawn('npm', ['install'], {cwd: process.cwd(), env: process.env, stdio: 'inherit'})
        npmInstall.on('exit', function(code) {
            console.log('npm install exited with code ' + code.toString())
            if(callback){
                callback()
            }
        })
    }else if(callback){
        callback()
    }
}

function runBuildCommand(callback){
    if(isNewBuildNeeded() && _projectInfo.BuildCommand && _projectInfo.BuildCommand.length > 0){
        console.log()
        let spinner = new ora('executing frontend build command ...')
        spinner.start()
        exec(_projectInfo.BuildCommand, (error, stdout, stderr) => {
            spinner.stop()
            if (error) {
                console.error('frontend build command exec error:' + error)
            }else if(callback){
                callback() 
            }
        })
    }else{
        if(callback){
            callback()
        }
    }
}

function onBuildComplete(callback){
    _projectInfo.FrontendLastBuildTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
    projectInfoManager.setProjectInfo(_projectInfo)
    if(callback){
        callback()
    }
}

function isNpmInstallNeeded(){
    let result = false
    
    let packageJsonFilePath = path.normalize(path.join(_projectInfo.ProjectPath, 'package.json'))
    if(fs.existsSync(packageJsonFilePath)){
        let npm_modules_DirPath = path.normalize(path.join(_projectInfo.ProjectPath, 'node_modules'))
        let packageInfo = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
        if(packageInfo){

            let hasDependency = (packageInfo.dependencies &&  ! _.isEmpty(packageInfo.dependencies)) ||
                                (packageInfo.devDependencies &&  !_.isEmpty(packageInfo.devDependencies))
            if(hasDependency){
                if(!fs.existsSync(npm_modules_DirPath)){
                    result = true
                }else{
                    //npm install --save takes about 1 seond to update package.json after the node_modules are installed/updated
                    let lastNPMInstallTime = moment(dfops.getDirContentMTime(npm_modules_DirPath)).add(3, 'seconds') 
                    let lastPackageJsonFileMTime = moment(fs.lstatSync(packageJsonFilePath).mtime)

                    result = lastNPMInstallTime.isBefore(lastPackageJsonFileMTime)
                }
            }                  
        }
    }

    return result
}

function isNewBuildNeeded(){
    let result = false
    let distributionDirPath = path.normalize(path.join(_projectInfo.ProjectPath, _projectInfo.DistributionDir))

    if(fs.existsSync(distributionDirPath)){ 
        let ignoredDirs = [_projectInfo.DistributionDir, awsmobileJSConstant.AWSMobileJSDirName]
        let ignoredFiles = []

        let lastFrontendBuildTime = moment(_projectInfo.FrontendLastBuildTime, awsmobileJSConstant.DateTimeFormatString)
        let lastConfigurationTime = moment(_projectInfo.LastConfigurationTime, awsmobileJSConstant.DateTimeFormatString)
        let lastProjectModificationTime = moment(dfops.getDirContentMTime(_projectInfo.ProjectPath, ignoredDirs, ignoredFiles))
        let lastDistDirModificationTime = moment(dfops.getDirContentMTime(distributionDirPath))

        result =    !lastFrontendBuildTime.isValid() ||
                    !lastConfigurationTime.isValid() ||
                    !lastProjectModificationTime.isValid() ||
                    !lastDistDirModificationTime.isValid() ||
                    lastFrontendBuildTime.isBefore(lastConfigurationTime) ||
                    lastFrontendBuildTime.isBefore(lastProjectModificationTime) ||
                    lastFrontendBuildTime.isBefore(lastDistDirModificationTime) //user manually changed build
    }else{
        result = true
    }

    return result
}

module.exports = {
    build,
    checkNpmInstall
}
