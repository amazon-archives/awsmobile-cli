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
const awsmobileJSConstant = require('../../../utils/awsmobilejs-constant.js')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]
const DIFF = awsmobileJSConstant.DiffMark
const CREATE = awsmobileJSConstant.DiffMark_Create
const UPDATE = awsmobileJSConstant.DiffMark_Update
const NONE = awsmobileJSConstant.DiffMark_None
const DELETE = awsmobileJSConstant.DiffMark_Delete

function dressForDevBackend(dataSources){
    dataSources.forEach(dataSource=>{
        delete dataSource.dataSourceArn
        dataSource.serviceRoleArn = awsmobileJSConstant.ByAWSMobileCLI
        if(dataSource.dynamodbConfig){
            dataSource.dynamodbConfig.tableName = awsmobileJSConstant.ByAWSMobileCLI
            dataSource.dynamodbConfig.awsRegion = awsmobileJSConstant.ByAWSMobileCLI
        }
        if(dataSource.type == 'AMAZON_DYNAMODB' && dataSource.spec && dataSource.spec.Table){
            dynamoDBHelper.dressForDevBackend(dataSource.spec.Table)
        }
        //todo: add dress logic for lambda and elasticsearch
        delete dataSource.lambdaConfig
        delete dataSource.elasticsearchConfig
    })
}

function diff(appsyncUpdateHandle){
    let diffMarkedDataSources = []
    let currentDataSources = appsyncUpdateHandle.currentAppsyncInfo.dataSources
    let devDataSources = appsyncUpdateHandle.devAppsyncInfo.dataSources
    if(devDataSources && devDataSources.length>0){
        for(let i=0;i<devDataSources.length; i++){
            let devDataSource = devDataSources[i]
            let currentDataSource
            if(devDataSources && devDataSources.length>0){
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
                diffMarkedDataSources.push(markDiff(undefined, currentDataSource[j]))
            }
        }
    }
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
            ((devDataSource.serviceRoleArn == currentDataSource.serviceRoleArn) || 
            (devDataSource.serviceRoleArn == awsmobileJSConstant.ByAWSMobileCLI))&&
            isDynamodbConfigEqual(devDataSource.dynamodbConfig, currentDataSource.dynamodbConfig)
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
