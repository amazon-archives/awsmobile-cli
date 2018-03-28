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
const dynamoDBHelper = require('./helper-dynamoDB.js')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]

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

function diff(dataSources){
    dataSources.forEach(dataSource=>{
    })
}

module.exports = {
    dressForDevBackend, 
    diff
}
