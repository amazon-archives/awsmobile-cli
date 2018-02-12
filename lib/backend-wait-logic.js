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
const ora = require('ora')

const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const awsClient = require('./aws-operations/aws-client.js')
const opsProject = require('./backend-operations/ops-project.js')
const opsCloudApi = require('./backend-operations/ops-cloud-api.js')

const maxCloudApiWaitLoop = 100 //each wait is 5 seconds

function wait(backendDetails, awsDetails, callback){
    if(isWaitNeeded(backendDetails)){
        console.log('awsmobile api call successful')
        console.log('waiting for the cloud formation to complete') 
        let mobile = awsClient.Mobile(awsDetails)
        let param = {
            projectId: backendDetails.projectId,
            syncFromResources: true
        }
        cloudApiWaitLoop(mobile, param, backendDetails, 1, callback)
    }else{
        callback(null, backendDetails)
    }
}

const spinner = ora('waiting ... ') //do not move inside function, the function is called recursively
function cloudApiWaitLoop(mobile, param, backendDetails, loopCount, callback){
    spinner.start()
    if(loopCount > maxCloudApiWaitLoop){
        spinner.stop()
        console.log(chalk.red('exceeded wait limit'))
        callback({code: maxCloudApiWaitLoop}, backendDetails)
    }else{
        mobile.describeProject(param, function(err,data){
            spinner.stop()
            if(err){
                console.log(chalk.red('wait interrupted'))
                awsExceptionHandler.handleMobileException(err)
                callback({code: 0}, backendDetails)
            }else{
                backendDetails = data.details
                if(opsProject.isInNormalState(backendDetails)){
                    let cloudFormationState = opsCloudApi.getFormationStateSummary(backendDetails)
                    if(cloudFormationState){
                        let stateGroup = opsCloudApi.getStateGroup(cloudFormationState)
                        //status group: 
                        //-2: unrecognized status
                        //-1: not yet deployed
                        // 0: in-progress
                        // 1: terminal_complate
                        // 2: terminal_failed
                        if(stateGroup < -1){
                            console.log(chalk.red('wait interrupted') + ' unrecognized status code: ' + cloudFormationState)
                            callback({code: -2}, backendDetails)
                        }else if(stateGroup == -1){
                            console.log(chalk.red('wait interrupted') + ' illogical status code: ' + cloudFormationState)
                            callback({code: -1}, backendDetails)
                        }else if( stateGroup == 0){
                            spinner.start('status check #' + chalk.blue(loopCount) + ': ' + cloudFormationState)
                            setTimeout(function(){
                                cloudApiWaitLoop(mobile, param, backendDetails, loopCount + 1, callback)
                            }, 5000)
                        }else if (stateGroup == 1){
                            console.log('cloud-api update finished with status code: ' + chalk.blue(cloudFormationState))
                            callback(null, backendDetails)
                        }else{
                            console.log('cloud-api update finished with status code: ' + chalk.blue(cloudFormationState))
                            callback({code: 2}, backendDetails)
                        }
                    }else{
                        console.log(chalk.red('wait interrupted') + ' CloudFormation stack information missing')
                        callback({code: -2}, backendDetails)
                    }
                }else{
                    spinner.start('status check #' + chalk.blue(loopCount) + ': ' + backendDetails.state)
                    setTimeout(function(){
                        cloudApiWaitLoop(mobile, param, backendDetails, loopCount + 1, callback)
                    }, 5000)
                }
            }
        })
    }
}

function isWaitNeeded(backendDetails){ 
    let isWaitNeeded = false

    if(opsProject.isInNormalState(backendDetails)){
        let cloudFormationState = opsCloudApi.getFormationStateSummary(backendDetails)
        if(cloudFormationState){
            let stateGroup = opsCloudApi.getStateGroup(cloudFormationState)
            if(stateGroup == 0){
                isWaitNeeded = true
            }
        }
    }else{
        isWaitNeeded = true
    }
    
    return isWaitNeeded
}

module.exports = {
    wait
}
