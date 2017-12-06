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
const chalk = require('chalk')
const ora = require('ora')

const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsClient = require('./aws-operations/aws-client.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')

let _projectInfo

function linkToBackend(projectInfo, mobileProjectID, syncToDevFlag, callback){
    awsConfigManager.checkAWSConfig(function(awsConfig){
         let mobile = awsClient.Mobile()
         
         let param = {
             projectId: mobileProjectID,
             syncFromResources: true
         }
         let spinner = ora('linking to backend awsmobile project ' + mobileProjectID)
         spinner.start()
         mobile.describeProject(param, function(err,data){
             spinner.stop()
             if(err){
                 console.log(chalk.red('failed to link to backend awsmobile project with id = ' + mobileProjectID.toString()))
                 awsExceptionHandler.handleMobileException(err)
             }else{
                 if(data && data.details){
                     console.log('Successfully linked AWS Mobile Hub project: ' + chalk.blue(data.details.name))
                     console.log()
                     backendInfoManager.syncCurrentBackendInfo(projectInfo, data.details, awsConfig, syncToDevFlag, function(){
                        if(callback){
                            callback()
                        }
                     })
                 }else{
                     console.log(chalk.red('no backend details available'))
                 }
             }
         })
    })
}

function getLatestBackend(projectInfo, mobileProjectID, syncToDevFlag, callback){
    awsConfigManager.checkAWSConfig(function(awsConfig){
         let mobile = awsClient.Mobile()
         
         let param = {
             projectId: mobileProjectID,
             syncFromResources: true
         }

         let spinner = ora('connecting to backend awsmobile project ' + mobileProjectID)
         spinner.start()
         mobile.describeProject(param, function(err,data){
             spinner.stop()
             if(err){
                 console.log(chalk.red('failed to connect to backend awsmobile project with id = ' + mobileProjectID.toString()))
                 awsExceptionHandler.handleMobileException(err)
             }else{
                 if(data && data.details){
                     backendInfoManager.syncCurrentBackendInfo(projectInfo, data.details, awsConfig, syncToDevFlag, function(){
                        if(callback){
                            callback()
                        }
                     })
                 }else{
                     console.log(chalk.red('no backend details available'))
                 }
             }
         })
    })
}

module.exports = {
    linkToBackend,
    getLatestBackend
}