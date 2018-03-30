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
const deepEqual = require('deep-equal')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]
const awsmobileJSConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobileJSConstant.DiffMark
const CREATE = awsmobileJSConstant.DiffMark_Create
const UPDATE = awsmobileJSConstant.DiffMark_Update
const NONE = awsmobileJSConstant.DiffMark_None
const DELETE = awsmobileJSConstant.DiffMark_Delete

function dressForDevBackend(table){
    delete table.TableStatus
    delete table.CreationDateTime
    delete table.TableSizeBytes
    delete table.ItemCount
    delete table.TableArn
    delete table.TableId
    if(table.ProvisionedThroughput){
        delete table.ProvisionedThroughput.NumberOfDecreasesToday
    }
    if(table.LocalSecondaryIndexes){
        table.LocalSecondaryIndexes.forEach(LocalSecondaryIndex=>{
            delete LocalSecondaryIndex.IndexSizeBytes
            delete LocalSecondaryIndex.ItemCount
            delete LocalSecondaryIndex.IndexArn
        })
    }
    if(table.GlobalSecondaryIndexes){
        table.GlobalSecondaryIndexes.forEach(GlobalSecondaryIndex=>{
            delete GlobalSecondaryIndex.IndexSizeBytes
            delete GlobalSecondaryIndex.ItemCount
            delete GlobalSecondaryIndex.IndexArn
            if(GlobalSecondaryIndex.ProvisionedThroughput){
                delete GlobalSecondaryIndex.ProvisionedThroughput.NumberOfDecreasesToday
            }
        })
    }
    return table
}


function diff(appsyncUpdateHandle){
    let diffMarkedTables = []
    let currentTables = appsyncUpdateHandle.currentAppsyncInfo.dataSources.tables
    let devTables = appsyncUpdateHandle.devAppsyncInfo.dataSources.tables
    if(devTables && devTables.length>0){
        for(let i=0;i<devTables.length; i++){
            let devTable = devTables[i]
            let currentTable
            if(currentTables && currentTables.length>0){
                for(let j=0;j<currentTables.length; j++){
                    if(currentTables[j].TableName==devTable.TableName &&
                        currentTables[j].Region==devTable.Region){
                        currentTable = currentTables[j]
                        break
                    }
                }
            }
            diffMarkedTables.push(markDiff(devTable, currentTable))
        }
    }
    if(currentTables && currentTables.length>0){
        for(let j=0;j<currentTables.length; j++){
            if(!currentTables[j][DIFF]){
                diffMarkedTables.push(markDiff(undefined, currentTables[j]))
            }
        }
    }
    return diffMarkedTables
}

function markDiff(devTable, currentTable){
    let result = devTable
    if(!currentTable){
        devTable[DIFF] = CREATE
    }else if(!devTable){
        currentTable[DIFF] = DELETE
        result = currentTable
    }else{
        if(deepEqual(devTable, currentTable)){
                devTable[DIFF] = NONE
                currentTable[DIFF] = NONE
        }else{
            devTable[DIFF] = UPDATE
            currentTable[DIFF] = UPDATE
        }
    }
    return result
}

//todo: needs revisit
function isDynamodbConfigEqual(devDynamodbConfig, currentDynamodbConfig){
    let isEqual = false
    
    if(!devDynamodbConfig && !currentDynamodbConfig){
        isEqual = true
    }else if(devDynamodbConfig && currentDynamodbConfig){
        isEqual =   (devDynamodbConfig.tableName == currentDynamodbConfig.tableName || 
                    devDynamodbConfig.tableName == awsmobileJSConstant.ByAWSMobileCLI)&&
                    (devDynamodbConfig.awsRegion == currentDynamodbConfig.awsRegion || 
                    devDynamodbConfig.awsRegion == awsmobileJSConstant.ByAWSMobileCLI)&&
                    devDynamodbConfig.useCallerCredentials == currentDynamodbConfig.useCallerCredentials
    }

    return isEqual
}

module.exports = {
    dressForDevBackend, 
    diff
}
