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
const https = require('https')
const chalk = require('chalk')
const ora = require('ora')
const extract = require('extract-zip')

const awsConfigManager = require('./aws-config-manager.js')
const awsClient = require('./aws-client.js')
const awsExceptionHandler = require('./aws-exception-handler.js')
const dfops = require('../utils/directory-file-ops.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')

function retrieveYaml(projectInfo, callback) {
    if(projectInfo){
        if(projectInfo.BackendProjectID && projectInfo.BackendProjectID.length > 0){
            awsConfigManager.checkAWSConfig(function(awsConfig){
                let mobile = awsClient.Mobile()
                let param = {
                    projectId: projectInfo.BackendProjectID
                }
                let spinner = ora('retrieving backend project specification')
                spinner.start()
                mobile.exportProject(param, function(err,data){
                    spinner.stop()
                    if(err){
                        console.log(chalk.red('failed to retrieve yaml for project ' + projectInfo.BackendProjectName))
                        awsExceptionHandler.handleMobileException(err)
                    }else{
                        if(data && data.downloadUrl){
                            downloadCurrentBackendProjectSpec(data.downloadUrl, projectInfo, callback)
                        }else{
                            console.log(chalk.red('no backend project yaml available'))
                            if(callback){
                                callback()
                            }
                        }
                    }
                })
            })
        }else{
            console.log(chalk.red('backend project unknown'))
        }
    }
}

function downloadCurrentBackendProjectSpec(downloadUrl, projectInfo, callback) { 
    let tempExtractDirPath = pathManager.getYmlExtractTempDirPath(projectInfo.ProjectPath)
    let tempZipFilePath = pathManager.getYmlTempZipFilePath(projectInfo.ProjectPath)
    let tempZipFile = fs.createWriteStream(tempZipFilePath)
    let request = https.get(downloadUrl, function(response) {
        response.pipe(tempZipFile)
        .on('close',()=>{
            extract(tempZipFilePath, {dir: tempExtractDirPath}, function (err) {
                let ymlFilePath = dfops.findFile(tempExtractDirPath, awsmobileJSConstant.BackendProjectYamlFileName)
                if(ymlFilePath){
                    let destinationPath = pathManager.getCurrentBackendYamlFilePath(projectInfo.ProjectPath)
                    fs.copy(ymlFilePath, destinationPath, function (err) {
                        if (err) {
                            console.log(chalk.red('Failed to retrive project yml file: ' + err.message.trim()))
                        }else{
                            console.log('awsmobile project\'s specifications logged at: ' + 
                            chalk.blue(pathManager.getCurrentBackendYamlFilePath_Relative(projectInfo.ProjectPath)))
                            fs.removeSync(tempExtractDirPath) 
                            fs.removeSync(tempZipFilePath)
                            if(callback){
                                callback()
                            }
                        }
                    })
                }
            })
        })
    })
}

module.exports = {
    retrieveYaml
}
