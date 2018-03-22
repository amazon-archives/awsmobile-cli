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
const util = require('util')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]

////////////////////////constructPutRolePolicyParam////////////////////////
function constructPutRolePolicyParamForDDB(roleDescription){
    let result = {
        RoleName: roleDescription.Role.RoleName,
        PolicyName: roleDescription.Role.RoleName,
        PolicyDocument: constructPolicyDocumentForDDB(roleDescription)
    }
    return result
}

function constructPolicyDocumentForDDB(roleDescription){
    let policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:DeleteItem",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem"
                ],
                "Resource": [
                    roleDescription.Role.Arn,
                    roleDescription.Role.Arn + '/*'
                ]
            }
        ]
    }
    return JSON.stringify(policy)
}
////////////////////////constructCreateRoleParamForDDB////////////////////////
function constructCreateRoleParamForDDB(tableDescription, roleNameSuffix){
    let result = {
        RoleName: constructDDBRoleName(tableDescription, roleNameSuffix), 
        Description: constructDDBDescription(tableDescription),
        Path: constructDDBPath(tableDescription), 
        AssumeRolePolicyDocument: constructDDBAssumeRolePolicyDocument(tableDescription)
    }
    return result
}

function constructDDBRoleName(tableDescription, roleNameSuffix){
    let dataSource = {
        type: 'AMAZON_DYNAMODB', 
        name: tableDescription.TableDescription.TableName
    }
    let RoleName = generateAppsyncServiceRoleName(dataSource, roleNameSuffix)
    return RoleName
}

function constructDDBDescription(tableDescription){
    return 'Allows the AWS AppSync service to access your data source.'
}

function constructDDBPath(tableDescription){
    return "/"
}

function constructDDBAssumeRolePolicyDocument(tableDescription){
    let assumeRolePolicy = {
        "Version" : "2012-10-17",
        "Statement": [ {
           "Effect": "Allow",
           "Principal": {
              "Service": [ "appsync.amazonaws.com" ]
           },
           "Action": [ "sts:AssumeRole" ]
        } ]
     }
    return JSON.stringify(assumeRolePolicy)
}

function generateAppsyncServiceRoleName(dataSource, roleNameSuffix)
{
    let dataSourceType = ''
    switch(dataSource.type){
        case 'AMAZON_DYNAMODB':
            dataSourceType = '-ddb-'
        break
        case 'AWS_LAMBDA':
            dataSourceType = '-lmd-'
        break
        case 'AMAZON_ELASTICSEARCH': 
            dataSourceType = '-els-'
        break
    }
    let dataSourceName = '-' + dataSource.name.slice(0, 20)
    let roleName = 'appsync-datasource' + dataSourceType + roleNameSuffix + dataSourceName
    return roleName
}

module.exports = {
    constructCreateRoleParamForDDB,
    constructPutRolePolicyParamForDDB
}
