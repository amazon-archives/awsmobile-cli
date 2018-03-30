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
const chalk = require('chalk')
const ora = require('ora')
const https = require('https')
const extract = require('extract-zip')

const awsClient = require('./aws-client.js')
const awsExceptionHandler = require('./aws-exception-handler.js')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')
const dfops = require('../utils/directory-file-ops.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

let _projectInfo

function getAWSExportFile(projectInfo, awsDetails, callback){
    _projectInfo = projectInfo
    if(projectInfo.BackendProjectID && projectInfo.BackendProjectID.length > 0){
        retrieveAWSExportFile(awsDetails, callback)
    }
}

function onClearBackend(projectInfo){
    _projectInfo = projectInfo
    removeLocalAWSExportFiles()
}

function onProjectConfigChange(projectInfo_old, projectInfo){
    if(projectInfo_old.SourceDir != projectInfo.SourceDir){
        let srcDirExportFilePath_old = pathManager.getSrcDirExportFilePath(projectInfo_old)
        if(srcDirExportFilePath_old && fs.existsSync(srcDirExportFilePath_old)){
            fs.removeSync(srcDirExportFilePath_old)
        }
        let awsExportFilePath = pathManager.getAWSExportFilePath(projectInfo.ProjectPath) 
        if(awsExportFilePath && fs.existsSync(awsExportFilePath)){
            let srcDir = pathManager.getSrcDirPath(projectInfo)
            if(srcDir && fs.existsSync(srcDir)){
                let srcDirExportFilePath = pathManager.getSrcDirExportFilePath(projectInfo)

                fs.copySync(awsExportFilePath, srcDirExportFilePath)
                console.log()
                console.log('aws-exports.js file is copied into your project\'s source directory')
                console.log(chalk.blue(srcDirExportFilePath))
            }
        }
    }
}

function retrieveAWSExportFile(awsDetails, callback)
{
    let spinner = ora('retrieving aws-exports.js')
    spinner.start()

    let mobile = awsClient.Mobile(awsDetails)

    let exportBundleParams = { 
        bundleId: 'app-config',
        projectId: _projectInfo.BackendProjectID,
        platform: 'JAVASCRIPT'
    }
    mobile.exportBundle(exportBundleParams, function (err, data) {
        spinner.stop()
        if(err){
            awsExceptionHandler.handleMobileException(err)
        }else if(data && data.downloadUrl){
            downloadAWSExportFile(data.downloadUrl, callback)
        }
    })
}


function downloadAWSExportFile(downloadUrl, callback) { 
    let tempExtractDirPath = pathManager.getAWSExportExtractTempDirPath(_projectInfo.ProjectPath)
    let tempZipFilePath = pathManager.getAWSExportTempZipFilePath(_projectInfo.ProjectPath)
    let tempZipFile = fs.createWriteStream(tempZipFilePath)
    let request = https.get(downloadUrl, function(response) {
        response.pipe(tempZipFile)
        .on('close',()=>{
            extract(tempZipFilePath, {dir: tempExtractDirPath}, function (err) {
                if(err){
                    console.log(err)
                }else{
                    let tempExportFilePath = dfops.findFile(tempExtractDirPath, awsmobilejsConstant.AWSExportFileName)
                    if(tempExportFilePath){
                        updateCurrentAWSExportFiles(tempExportFilePath)
                        fs.removeSync(tempExtractDirPath) 
                        fs.removeSync(tempZipFilePath)
                        if(callback){
                            callback()
                        }
                    }
                }
            })
        })
    })
}

function updateCurrentAWSExportFiles(sourceFilePath){ 
    let awsExportFilePath = pathManager.getAWSExportFilePath(_projectInfo.ProjectPath) 
    if(awsExportFilePath){
        fs.copySync(sourceFilePath, awsExportFilePath)
        console.log('awsmobile project\'s access information logged at: ' + 
        chalk.blue(pathManager.getAWSExportFilePath_relative(_projectInfo.ProjectPath) ))    
    }
}
 
function removeLocalAWSExportFiles(){ 
    let awsExportFilePath = pathManager.getAWSExportFilePath(_projectInfo.ProjectPath) 
    if(fs.existsSync(awsExportFilePath)){
        fs.removeSync(awsExportFilePath)
    }

    let srcDir = pathManager.getSrcDirPath(_projectInfo)
    if(srcDir && fs.existsSync(srcDir)){
        let srcDirExportFilePath = pathManager.getSrcDirExportFilePath(_projectInfo)
        if(srcDirExportFilePath && fs.existsSync(srcDirExportFilePath)){
            fs.removeSync(srcDirExportFilePath)
        }
    }
}

module.exports = {
    getAWSExportFile,
    onClearBackend,
    onProjectConfigChange
}

