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

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-serviceRoles')

describe('appsync create', () => {
    const dataSource ={
        "name": "AppSyncCommentTable",
        "description": null,
        "type": "AMAZON_DYNAMODB",
        "dynamodbConfig": {
            "tableName": "AppSyncCommentTable-VHFuYLVO",
            "awsRegion": "us-east-1",
            "useCallerCredentials": false
        }, 
        "serviceRoleDetails": {
            Role: {
                RoleName: "mock_roleName"
            }
        },
        "table": {
            details: {
                TableArn: "mock_tableArn"
            }
        }
    }

    beforeAll(()=>{

    })
    beforeEach(()=>{

    })
    test('constructPutRolePolicyParamForDDB', ()=>{
        let param = helper.constructPutRolePolicyParamForDDB(dataSource)
        expect(param.RoleName).toBeDefined()
        expect(param.PolicyName).toBeDefined()
        expect(param.PolicyDocument).toBeDefined()
    })
    test('constructCreateRoleParamForDDB', ()=>{
        let param = helper.constructCreateRoleParamForDDB(dataSource.dynamodbConfig.tableName, 'mock_roleNameSuffix')
        expect(param.RoleName).toBeDefined()
        expect(param.Description).toBeDefined()
        expect(param.Path).toBeDefined()
        expect(param.AssumeRolePolicyDocument).toBeDefined()
    })
})
