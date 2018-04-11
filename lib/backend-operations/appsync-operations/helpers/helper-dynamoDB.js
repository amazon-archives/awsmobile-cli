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
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function constructCreateParam(spec){
    let param = dressForDevBackend(spec)
    delete param.Region
    delete param.dataSources

    return param
}

function constructUpdateParam(spec){
    let param = {}

    Object.assign(param, spec)
    delete param.Region
    delete param.dataSources
    delete param.diff

    return param
}

function dressForDevBackend(table){
    let dressedTable = {}
    Object.assign(dressedTable, table)

    delete dressedTable.TableStatus
    delete dressedTable.CreationDateTime
    delete dressedTable.TableSizeBytes
    delete dressedTable.ItemCount
    delete dressedTable.TableArn
    delete dressedTable.TableId
    delete LatestStreamLabel
    delete LatestStreamArn
    delete RestoreSummary

    if(dressedTable.ProvisionedThroughput){
        delete dressedTable.ProvisionedThroughput.NumberOfDecreasesToday
        delete dressedTable.ProvisionedThroughput.LastDecreaseDateTime
        delete dressedTable.ProvisionedThroughput.LastIncreaseDateTime
    }

    if(dressedTable.SSEDescription){
        dressedTable.SSESpecification = {
           Enabled: (dressedTable.SSEDescription.Status == "ENABLING" || dressedTable.SSEDescription.Status == "ENABLED")
        }
        delete dressedTable.SSEDescription
    }

    if(dressedTable.LocalSecondaryIndexes){
        dressedTable.LocalSecondaryIndexes.forEach(LocalSecondaryIndex=>{
            delete LocalSecondaryIndex.IndexSizeBytes
            delete LocalSecondaryIndex.ItemCount
            delete LocalSecondaryIndex.IndexArn
        })
    }

    if(dressedTable.GlobalSecondaryIndexes){
        dressedTable.GlobalSecondaryIndexes.forEach(GlobalSecondaryIndex=>{
            delete GlobalSecondaryIndex.IndexStatus
            delete GlobalSecondaryIndex.Backfilling
            delete GlobalSecondaryIndex.IndexSizeBytes
            delete GlobalSecondaryIndex.ItemCount
            delete GlobalSecondaryIndex.IndexArn
            if(GlobalSecondaryIndex.ProvisionedThroughput){
                delete GlobalSecondaryIndex.ProvisionedThroughput.NumberOfDecreasesToday
                delete GlobalSecondaryIndex.ProvisionedThroughput.LastDecreaseDateTime
                delete GlobalSecondaryIndex.ProvisionedThroughput.LastIncreaseDateTime
            }
        })
    }
    return dressedTable
}

function diff(appsyncUpdateHandle){
    let diffMarkedTables = []
    let currentTables = appsyncUpdateHandle.currentAppSyncInfo.dataSources.tables
    let devTables = appsyncUpdateHandle.devAppSyncInfo.dataSources.tables
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
    diffMarkedTables = diffMarkedTables.filter(item=>item[DIFF] != NONE)
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
        dressForDevBackend(currentTable)
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

module.exports = {
    constructCreateParam,
    constructUpdateParam,
    dressForDevBackend, 
    diff
}
