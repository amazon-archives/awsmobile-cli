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
const ora = require('ora')
const chalk = require('chalk')

const awsClient = require('../aws-operations/aws-client.js')

const maxCloudApiWaitLoop = 100 //each wait is 5 seconds

function waitForSchemaCreation(appsyncCreationHandle, callback){
    if(isWaitNeeded(appsyncCreationHandle)){
        let appsyncClient = awsClient.AppSync(appsyncCreationHandle.awsDetails)
        let param = {
            apiId:  appsyncCreationHandle.createGraphqlApiResponse.graphqlApi.apiId,
        }
        schemaCreationWaitLoop(appsyncClient, param, appsyncCreationHandle, 1, callback)
    }else{
        callback(null, appsyncCreationHandle)
    }
}

const spinner = ora('waiting ... ') //do not move inside function, the function is called recursively
function schemaCreationWaitLoop(appsyncClient, param, appsyncCreationHandle, loopCount, callback){
    spinner.start()
    if(loopCount > maxCloudApiWaitLoop){
        spinner.stop()
        console.log(chalk.red('exceeded wait limit'))
        callback({code: maxCloudApiWaitLoop}, appsyncCreationHandle)
    }else{
        appsyncClient.getSchemaCreationStatus(param, (err, data)=>{
            spinner.stop()
            if(err){
                console.log(chalk.red('wait interrupted'))
                console.log(err)
                callback({code: 0}, backendDetails)
            }else{
                appsyncCreationHandle.schemaCreationResponse = data
                if(isWaitNeeded(appsyncCreationHandle)){
                    spinner.start('status check #' + chalk.blue(loopCount) + ': ' + appsyncCreationHandle.schemaCreationResponse.status)
                    setTimeout(function(){
                        schemaCreationWaitLoop(appsyncClient, param, appsyncCreationHandle, loopCount + 1, callback)
                    }, 5000)
                }else{
                    callback(null, appsyncCreationHandle)
                }
            }
        })
    }
}

function isWaitNeeded(appsyncCreationHandle){ 
    let isWaitNeeded = false

    if(appsyncCreationHandle.schemaCreationResponse && 
        appsyncCreationHandle.schemaCreationResponse.status != 'SUCCESS'){
        isWaitNeeded = true
    }
    
    return isWaitNeeded
}

module.exports = {
    waitForSchemaCreation
}
