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
const dynamoDBHelper = require('./helper-dynamoDB.js')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function dressForDevBackend(dataSources){
    dataSources.dataSources.forEach(dataSource=>{
        dressDataSourceForDevBackend(dataSource)
    })
    dataSources.tables.forEach(table=>{
        dynamoDBHelper.dressForDevBackend(table)
    })
    return dataSources
}

function dressDataSourceForDevBackend(dataSource){
    delete dataSource.dataSourceArn
    dataSource.serviceRoleArn = awsmobilejsConstant.ByAWSMobileCLI
    //todo: add dress logic for lambda and elasticsearch
    // delete dataSource.lambdaConfig
    // delete dataSource.elasticsearchConfig
}

function diff(appsyncUpdateHandle){
    let diffMarkedDataSources = []
    let currentDataSources = appsyncUpdateHandle.currentAppSyncInfo.dataSources.dataSources
    let devDataSources = appsyncUpdateHandle.devAppSyncInfo.dataSources.dataSources
    resolveExistingServiceRoles(currentDataSources, devDataSources)
    if(devDataSources && devDataSources.length>0){
        for(let i=0;i<devDataSources.length; i++){
            let devDataSource = devDataSources[i]
            let currentDataSource
            if(currentDataSources && currentDataSources.length>0){
                for(let j=0;j<currentDataSources.length; j++){
                    if(currentDataSources[j].name==devDataSource.name){
                        currentDataSource = currentDataSources[j]
                        break
                    }
                }
            }
            diffMarkedDataSources.push(markDiff(devDataSource, currentDataSource))
        }
    }
    if(currentDataSources && currentDataSources.length>0){
        for(let j=0;j<currentDataSources.length; j++){
            if(!currentDataSources[j][DIFF]){
                diffMarkedDataSources.push(markDiff(undefined, currentDataSources[j]))
            }
        }
    }
    diffMarkedDataSources = diffMarkedDataSources.filter(item=>item[DIFF] != NONE)
    return diffMarkedDataSources
}

function markDiff(devDataSource, currentDataSource){
    let result = devDataSource
    if(!currentDataSource){
        devDataSource[DIFF] = CREATE
    }else if(!devDataSource){
        currentDataSource[DIFF] = DELETE
        result = currentDataSource
    }else{
        if(devDataSource.description == currentDataSource.description && 
            devDataSource.type == currentDataSource.type &&
            devDataSource.serviceRoleArn == currentDataSource.serviceRoleArn &&
            deepEqual(devDataSource.dynamodbConfig, currentDataSource.dynamodbConfig)
        ){
                devDataSource[DIFF] = NONE
                currentDataSource[DIFF] = NONE
        }else{
            devDataSource[DIFF] = UPDATE
            currentDataSource[DIFF] = UPDATE
        }
    }
    return result
}

function resolveExistingServiceRoles(currentDataSources, devDataSources){
    if(devDataSources && devDataSources.length>0){
        for(let i=0;i<devDataSources.length; i++){
            let devDataSource = devDataSources[i]
            if(devDataSource.type != "AMAZON_DYNAMODB" || 
            devDataSource.serviceRoleArn != awsmobilejsConstant.ByAWSMobileCLI){
                continue
            }
            if(currentDataSources && currentDataSources.length>0){
                for(let j=0;j<currentDataSources.length; j++){
                    let currentDataSource = currentDataSources[j]
                    if(currentDataSource.type == "AMAZON_DYNAMODB" && 
                    deepEqual(devDataSource.dynamodbConfig, currentDataSource.dynamodbConfig)){
                        devDataSource.serviceRoleArn = currentDataSource.serviceRoleArn
                        break
                    }
                }
            }else{
                break
            }
        }
    }
}

module.exports = {
    dressForDevBackend, 
    diff
}
