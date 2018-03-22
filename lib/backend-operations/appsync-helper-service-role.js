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
function constructPutRolePolicyParamForDDB(serviceRoleDetails){
    let result = {
        RoleName: serviceRoleDetails.Role.RoleName,
        PolicyName: serviceRoleDetails.Role.RoleName,
        PolicyDocument: constructPolicyDocumentForDDB(serviceRoleDetails)
    }
    return result
}

function constructPolicyDocumentForDDB(serviceRoleDetails){
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
                    serviceRoleDetails.Role.Arn,
                    serviceRoleDetails.Role.Arn + '/*'
                ]
            }
        ]
    }
    return JSON.stringify(policy)
}
////////////////////////constructCreateRoleParamForDDB////////////////////////
function constructCreateRoleParamForDDB(tableDetails, roleNameSuffix){
    let result = {
        RoleName: constructDDBRoleName(tableDetails, roleNameSuffix), 
        Description: constructDDBDescription(tableDetails),
        Path: constructDDBPath(tableDetails), 
        AssumeRolePolicyDocument: constructDDBAssumeRolePolicyDocument(tableDetails)
    }
    return result
}

function constructDDBRoleName(tableDetails, roleNameSuffix){
    let dataSource = {
        type: 'AMAZON_DYNAMODB', 
        name: tableDetails.TableDescription.TableName
    }
    let RoleName = generateAppsyncServiceRoleName(dataSource, roleNameSuffix)
    return RoleName
}

function constructDDBDescription(tableDetails){
    return 'Allows the AWS AppSync service to access your data source.'
}

function constructDDBPath(tableDetails){
    return "/"
}

function constructDDBAssumeRolePolicyDocument(tableDetails){
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
