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
const moment = require('moment')

const awsmobileJSConstant = require('./awsmobilejs-constant.js')

function generateProjectName() 
{
    return 'awsmobilejs-' + makeid()
}

function generateAWSConfigFileName(projectInfo)
{
    return projectInfo.ProjectName + '-'  + makeid() + '.json'
}

function generateIAMUserName()
{
    return 'AWSMobileCLI-'  + makeid()
}

function generateBackendProjectName(projectInfo)
{
    return projectInfo.ProjectName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
}

function generateDeviceFarmTestRunName(projectInfo)
{
    return Date.now().toString()
}

function generateCloudFrontInvalidationReference(projectInfo)
{
    return Date.now().toString()
}

function generateTempName(seedName)
{
    return seedName + makeid()
}

function generateAppsyncDDBTableName(seedTableName)
{
    return seedTableName + '-' + makeid(8)
}

function generateAppsyncServiceRoleName(dataSource)
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
    let roleName = 'appsync-datasource' + dataSourceType + makeid(6) + dataSourceName
    return roleName
}

function makeid(n) {
    if(!n){
        n = 5
    }
    let text = ""
    let possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    for (let i = 0; i <n; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
}

module.exports = {
    generateProjectName,
    generateAWSConfigFileName,
    generateIAMUserName,
    generateBackendProjectName,
    generateDeviceFarmTestRunName,
    generateCloudFrontInvalidationReference,
    generateTempName,
    generateAppsyncDDBTableName,
    generateAppsyncServiceRoleName
}
  