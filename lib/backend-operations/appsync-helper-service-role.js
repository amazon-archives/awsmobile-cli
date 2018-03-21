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
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]

function constructCreateRoleParamList(appsyncCreationHandle)
{
    let paramList = []
    Object.keys(appsyncCreationHandle.createDDBTableResponse).forEach(TableName => {
        paramList.push(constructServiceRoleParamForDDB(appsyncCreationHandle.createDDBTableResponse[TableName].TableDescription))
    })
    return paramList
}

function constructServiceRoleParamForDDB(info){
    let result = {
        RoleName: constructDDBRoleName(info), 
        Description: constructDDBDescription(info),
        Path: constructDDBPath(info), 
        AssumeRolePolicyDocument: constructDDBAssumeRolePolicyDocument(info)
    }

    return result
}

function constructDDBRoleName(info){
    let dataSource = {
        type: 'AMAZON_DYNAMODB', 
        name: info.TableName
    }
    let RoleName = nameManager.generateAppsyncServiceRoleName(dataSource)
    return RoleName
}

function constructDDBDescription(info){
    return 'Allows the AWS AppSync service to access your data source.'
}

function constructDDBPath(info){
    return "/"
}

function constructDDBAssumeRolePolicyDocument(info){
    let assumeRolePolicyDocument = {
        "Version" : "2012-10-17",
        "Statement": [ {
           "Effect": "Allow",
           "Principal": {
              "Service": [ "appsync.amazonaws.com" ]
           },
           "Action": [ "sts:AssumeRole" ]
        } ]
     }
    return JSON.stringify(assumeRolePolicyDocument)
}

module.exports = {
  constructCreateRoleParamList
}
