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
jest.mock('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../../lib/aws-operations/aws-client.js')


const _featureName = 'appsync'

const appsyncManager = require('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const awsClient = require('../../../../lib/aws-operations/aws-client.js')

const appsyncDelete = require('../../../../lib/backend-operations/appsync-operations/ops-appsync-delete.js')

describe('appsync delete', ()=>{
    const projectInfo = {
        ProjectName: 'mock_projectName',
        ProjectPath: '/mock_projectName'
    }
    const appsyncInfo = {
        "apiId": "mockffub5bhirm6mwap5llmock",
        "region": "us-east-1",
        "name": "mock_project-2018-04-19-14-11-44",
        "graphqlEndpoint": "https://mockxvmfnrgkrf3mnsb2efmock.appsync-api.us-east-1.amazonaws.com/graphql",
        "authenticationType": "AWS_IAM",
        "creationTime": "2018-04-19-14-13-25",
        "lastUpdateTime": "2018-04-19-14-13-25",
        "lastSyncTime": "2018-04-19-14-13-57",
        "lastPushSuccessful": true,
        "AppSyncConsoleUrl": "https://console.aws.amazon.com/appsync/home?region=us-east-1#/mockffub5bhirm6mwap5llmock/v1/home",
        "lastSyncToDevTime": "2018-04-19-14-14-00"
    }
    const awsDetails = {}

    const mock_deleteGraphqlApiResponse = {}
    const mock_appsyncClient = {
        deleteGraphqlApi: jest.fn((param, callback)=>{
            callback(null, mock_deleteGraphqlApiResponse)
        })
    }

    appsyncManager.clearAppSyncInfo = jest.fn()

    beforeAll(() => {
        global.console = {log: jest.fn()}
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
    })
    test('run', ()=>{
        appsyncDelete.run(projectInfo, appsyncInfo, awsDetails).then((data)=>{
            expect(mock_appsyncClient.deleteGraphqlApi).toBeCalled()
            expect(appsyncManager.clearAppSyncInfo).toBeCalled()
        })

    })
})