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
jest.mock('fs-extra')
jest.mock('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../lib/utils/directory-file-ops.js')

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const mockirer = require('mockirer')
const awsMobileRegions = require('../../../lib/aws-operations/aws-regions.js').regions
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')

const appsyncManager = require('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

const appsyncOps = require('../../../lib/feature-operations/scripts/appsync-ops.js')


const _featureName = 'appsync'

const AUTH_TYPES = [ 
  "AWS_IAM", 
  "API_KEY", 
  "AMAZON_COGNITO_USER_POOLS"
]

const DEFAULT_ACTIONS = [
  "ALLOW",
  "DENY"
]

describe('backend delete', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    let mock_projectInfo = {
        ProjectName : projectName, 
        ProjectPath: projectPath,
    }

    let mock_cloudProjectSpec = {}
    let mock_graphApi = {
        "name": "mock_graphqlApi",
        "apiId": "mock_id",
        "authenticationType": "AWS_IAM",
        "arn": "arn:aws:appsync:us-east-1:account-number:apis/mock_id",
        "uris": {
            "GRAPHQL": "https://mock.appsync-api.us-east-1.amazonaws.com/graphql"
        }
    }
    let mock_graphApi_1 = {
        "name": "mock_graphqlApi",
        "apiId": "mock_id",
        "authenticationType": "AWS_IAM",
        "arn": "arn:aws:appsync:us-east-1:account-number:apis/mock_id",
        "uris": {
            "GRAPHQL": "https://mock.appsync-api.us-east-1.amazonaws.com/graphql"
        }
    }
    let mock_backend_details= {
        "name": "mock_project",
        "projectId": "mock-4ce9-4512-a00d-43ce01amock6",
        "region": "us-east-1",
        "state": "NORMAL",
        "createdDate": "2018-04-19T21:11:44.648Z",
        "lastUpdatedDate": "2018-04-20T00:46:01.742Z",
        "consoleUrl": "https://console.aws.amazon.com/mobilehub/home#/mock-4ce9-4512-a00d-43ce01amock6/build",
        "resources": [
            {
                "type": "AWS::Cognito::UserPool",
                "name": "mock_project_userpool_MOBILEHUB_123456789",
                "arn": "us-east-1_mockasd",
                "feature": "user-signin",
                "attributes": {
                    "alias-attributes": "[\"email\",\"phone_number\"]",
                    "lastUpdateRequestID": "mockads-4434-11e8-9404-f9768c326b90",
                    "mfa-configuration": "ON",
                    "password-policy": "{\"minimumLength\":8,\"requireUppercase\":true,\"requireLowercase\":true,\"requireNumbers\":true,\"requireSymbols\":true}",
                    "region": "us-east-1",
                    "user-pools-client-id": "mockjoce345bdg1p64ffsatm9",
                    "user-pools-client-secret": "mock1r2hku91t6k29eu5d51bet4b5r51b7ehdlebck40mpmock",
                    "user-pools-id": "us-east-1_2I3IAmock",
                    "user-pools-web-client-id": "mockonov9k1vj9bttdm2umock"
                }
            }
        ]
    }
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendDetailsFilePath = pathManager.getCurrentBackendDetailsFilePath(projectPath)
    
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendDetailsFilePath] = JSON.stringify(mock_backend_details, null, '\t')

    appsyncManager.getEnabledFeatures = jest.fn((projectPath)=>{ return [] })
    appsyncManager.enable = jest.fn()
    appsyncManager.getGraphqlApi = jest.fn((projectPath)=>{ return mock_graphApi })
   

    beforeAll(() => {
        global.console = {log: jest.fn()}
        dfOps.readJsonFile = jest.fn((filePath)=>{
            if(filePath == backendDetailsFilePath){
                return mock_backend_details
            }else{
                return mock_graphApi_1
            }
        })
        dfOps.writeJsonFile = jest.fn()
    })

    beforeEach(() => {
    })

    test('interface method defined', () => {
        expect(appsyncOps.specify).toBeDefined()
        expect(appsyncOps.onFeatureTurnOn).toBeDefined()
        expect(appsyncOps.onFeatureTurnOff).toBeDefined()
    })

    test('specify IAM', () => {
        mockirer(inquirer, {
            authType: 'AWS_IAM'
        })  
        mock_graphApi_1 = {
            "name": "mock_graphqlApi",
            "authenticationType": 'AWS_IAM'
        }

        appsyncOps.specify(mock_projectInfo)
        expect(dfOps.writeJsonFile).toBeDefined()
    })

    test('specify API_KEY', () => {
        mockirer(inquirer, {
            authType: 'API_KEY'
        })  
        mock_graphApi_1 = {
            "name": "mock_graphqlApi",
            "authenticationType": "API_KEY"
        }

        appsyncOps.specify(mock_projectInfo)
        expect(dfOps.writeJsonFile).toBeDefined()
    })

    test('specify AMAZON_COGNITO_USER_POOLS', () => {
        mockirer(inquirer, {
            authType: "AMAZON_COGNITO_USER_POOLS",
            userPoolId: 'mockuserpoolid',
            awsRegion: 'us-east-1',
            defaultAction: 'ALLOW'
        })  
        mock_graphApi_1 ={
            "name": "{managed-by-awsmobile-cli}",
            "authenticationType": "AMAZON_COGNITO_USER_POOLS",
            "userPoolConfig": {
                "userPoolId": "us-east-1_mock",
                "awsRegion": "us-east-1",
                "defaultAction": "ALLOW",
                "appIdClientRegex": null
            }
        }

        appsyncOps.specify(mock_projectInfo)
        expect(dfOps.writeJsonFile).toBeDefined()
    })

    test('onFeatureTurnOn', () => {
        appsyncOps.onFeatureTurnOn(mock_projectInfo, mock_cloudProjectSpec)
    })

    test('onFeatureTurnOff', () => {
        appsyncOps.onFeatureTurnOff(mock_projectInfo, mock_cloudProjectSpec)
    })
})
