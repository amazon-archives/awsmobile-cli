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

const awsClient = require('../../../aws-operations/aws-client.js')

const maxCloudApiWaitLoop = 100 //each wait is 5 seconds

////////////////////////////////////////////////////////
///////// wait for schema creation /////////////////////
////////////////////////////////////////////////////////

function waitForSchemaCreation(handle, apiId, callback){
    if(isWaitNeededForSchema(handle)){
        let appsyncClient = awsClient.AppSync(handle.awsDetails)
        let param = {
            apiId: apiId,
        }
        schemaCreationWaitLoop(appsyncClient, param, handle, 1, callback)
    }else{
        callback(null, handle)
    }
}

// const spinner = ora('waiting ... ') //do not move inside function, the function is called recursively
function schemaCreationWaitLoop(appsyncClient, param, handle, loopCount, callback){
    // spinner.start()
    if(loopCount > maxCloudApiWaitLoop){
        // spinner.stop()
        console.log(chalk.red('exceeded schema creation wait limit'))
        callback({code: maxCloudApiWaitLoop}, handle)
    }else{
        appsyncClient.getSchemaCreationStatus(param, (err, data)=>{
            // spinner.stop()
            if(err){
                console.log(chalk.red('wait interrupted'))
                console.log(err)
                callback({code: 2}, backendDetails)
            }else{
                handle.schemaCreationResponse = data
                if(isWaitNeededForSchema(handle)){
                    // spinner.start('status check #' + chalk.blue(loopCount) + ': ' + handle.schemaCreationResponse.status)
                    setTimeout(function(){
                        schemaCreationWaitLoop(appsyncClient, param, handle, loopCount + 1, callback)
                    }, 5000)
                }else if(handle.schemaCreationResponse.status == 'FAILED'){
                    callback({code: 1}, handle)
                }else{
                    callback(null, handle)
                }
            }
        })
    }
}

function isWaitNeededForSchema(handle){ 
    let isWaitNeeded = false

    if(handle.schemaCreationResponse && 
        handle.schemaCreationResponse.status != 'SUCCESS' &&
        handle.schemaCreationResponse.status != 'FAILED'){
        isWaitNeeded = true
    }
    
    return isWaitNeeded
}

////////////////////////////////////////////////////////
///////// wait for dynamoDB table /////////////////////
////////////////////////////////////////////////////////
const waitTableStatus = ["CREATING", "UPDATING", "DELETING"]

function waitForDDBTables(handle){
    if(isWaitNeededForTables(handle)){
        let waitForTableTasks = []
        handle.dataSources.tables.forEach(table => {
            if(isWaitNeededForTable(table)){
                waitForTableTasks.push(waitForDDBTable(handle, table))
            }
        })
        if(waitForTableTasks.length>0){
        return Promise.all(waitForTableTasks).then((values)=>{
            return handle
        })
        }else{
            return handle
        }
    }else{
        return handle
    }
}

function waitForDDBTable(handle, table){
  return new Promise((resolve, reject) => {
    if(isWaitNeededForTable(table)){
        dynamoDBTableWaitLoop(handle, table, 1, (err, data)=>{
            if(err){
                reject(err)
            }else{
                resolve(handle)
            }
        })
    }else{
        resolve(handle)
    }
  })
}

function dynamoDBTableWaitLoop(handle, table, loopCount, callback){
    if(loopCount > maxCloudApiWaitLoop){
        let message = 'exceeded dynamoDB wait limit'
        console.log(chalk.red(message))
        callback({code: maxCloudApiWaitLoop, message: message}, handle)
    }else{
        getTableStatus(handle, table, (err, data)=>{
            if(err){
                let message = 'wait interrupted'
                console.log(chalk.red(message))
                console.log(err)
                callback({code: 2, message: message}, handle)
            }else{
                if(isWaitNeededForTable(table)){
                    setTimeout(function(){
                        dynamoDBTableWaitLoop(handle, table, loopCount+1, callback)
                    }, 5000)
                }else{
                    callback(null, handle)
                }
            }
        })
    }
}

function getTableStatus(handle, table, callback){
    if(isWaitNeededForTable(table)){
        let param = { TableName: table.details.TableName}
        let dynamoDBClient = awsClient.DynamoDB(handle.awsDetails, table.Region)
        dynamoDBClient.describeTable(param, (err, data)=>{
            if(err){
                console.log(chalk.red('Failed to get status for dynamoDB table ' + param.TableName))
                console.log(err)
                callback(err, handle)
            }else{
                // console.log('status updated: ' + param.TableName + ' ' + data.Table.TableStatus)
                table.details = data.Table
                callback(null, handle)
            }
        })
    }else{
        callback(null, handle)
    }
}

function isWaitNeededForTables(handle){ 
    let isWaitNeeded = false
    if(handle.dataSources && handle.dataSources.tables){
        for(let i = 0; i<handle.dataSources.tables.length; i++){
            let table = handle.dataSources.tables[i]
            if(isWaitNeededForTable(table)){
                isWaitNeeded = true
                break;
            }
        }
    }
    return isWaitNeeded
}

function isWaitNeededForTable(table){ 
    let result = false
    if(table.details && table.details.TableStatus){
        let status = table.details.TableStatus
        result = waitTableStatus.includes(status)
    }
    return result
}

module.exports = {
    waitForSchemaCreation, 
    waitForDDBTables,
}
