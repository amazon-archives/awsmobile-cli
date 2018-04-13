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
jest.mock('opn')
jest.mock('../../../lib/feature-operations/scripts/appsync-ops.js')
jest.mock('../../../lib/aws-operations/aws-client.js')
jest.mock('../../../lib//project-info-manager.js')
jest.mock('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-create.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-retrieve.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-update.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-delete.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-dataSources.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')

const fs = require('fs-extra')
const opn = require('opn')
const path = require('path')
const featureOps = require('../../../lib/feature-operations/scripts/appsync-ops.js')
const awsClient = require('../../../lib/aws-operations/aws-client.js')

const projectInfoManager = require('../../../lib//project-info-manager.js')
const appsyncManager = require('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const appsyncCreate = require('../../../lib/backend-operations/appsync-operations/ops-appsync-create.js')
const appsyncRetrieve = require('../../../lib/backend-operations/appsync-operations/ops-appsync-retrieve.js')
const appsyncUpdate = require('../../../lib/backend-operations/appsync-operations/ops-appsync-update.js')
const appsyncDelete = require('../../../lib/backend-operations/appsync-operations/ops-appsync-delete.js')
const apiKeysHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys.js')
const dataSourceHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-dataSources.js')
const graphqlHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi.js')
const resolversHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

const opsAppSync = require('../../../lib/backend-operations/ops-appsync.js')

describe('ops appsync', () => {
    const mock_appsyncInfo = {
        "apiId": "rppp6qwzbnb7piwvkijjtbzql4",
        "region": "us-east-1",
        "name": "r2-2018-04-12-12-14-53",
        "graphqlEndpoint": "https://gboizqo7frh6vbfsf4rhvmchge.appsync-api.us-east-1.amazonaws.com/graphql",
        "authenticationType": "AMAZON_COGNITO_USER_POOLS",
        "creationTime": "2018-04-12-13-35-30",
        "lastUpdateTime": "2018-04-12-13-35-30",
        "lastSyncTime": "2018-04-12-13-58-50",
        "lastPushSuccessful": true,
        "AppSyncConsoleUrl": "https://console.aws.amazon.com/appsync/home?region=us-east-1#/rppp6qwzbnb7piwvkijjtbzql4/v1/home",
        "lastSyncToDevTime": "2018-04-12-13-58-54",
        "apiKey": "da2-d35lzhj6efbxbbllh6pmgujsfa"
    }
    const mock_apiKeys = [
        {
            "id": "mockid",
            "description": null,
            "expires": 1523959200
        }
    ]
    const mock_dataSources = {
        "dataSources": [
            {
                "name": "AppSyncCommentTable",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "{managed-by-awsmobile-cli}",
                "dynamodbConfig": {
                    "tableName": "AppSyncCommentTable-ga2zg5lf",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            }
        ], 
        "tables": [
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncEventTable-ga2zg5lf",
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                },
                "Region": "us-east-1"
            }
        ]
    }
    const mock_resolvers=[
        {
            "typeName": "Event",
            "fieldName": "comments",
            "dataSourceName": "AppSyncCommentTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.response"
        }
    ]
    const mock_graphApi = {
        "name": "r2-2018-04-12-12-14-53",
        "apiId": "hixrulevljdnncqr7ape4grn2a",
        "authenticationType": "AWS_IAM",
        "arn": "arn:aws:appsync:us-east-1:466632810889:apis/hixrulevljdnncqr7ape4grn2a",
        "uris": {
            "GRAPHQL": "https://ayz2axtgw5fe3gp7m2zfvdoeom.appsync-api.us-east-1.amazonaws.com/graphql"
        }
    }

    const mock_backendProjectSpec = {
        resources:[
        ]
    }

    let mock_appsyncClient = {
        getFunction: jest.fn((param, callback)=>{
            if(callback){
                callback()
            }
        })
    }

    const mock_awsDetails = {}

    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const mock_projectInfo = {ProjectName: projectName, ProjectPath: projectPath}
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const currentFeatureInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, opsAppSync.featureName)
    const backendFeatureDirPath = pathManager.getBackendFeatureDirPath(projectPath, opsAppSync.featureName)
    const mock_currentApiKeysFilePath = path.join(currentFeatureInfoDirPath, 'apiKeys.json')
    const mock_currentDataSourcesFilePath = path.join(currentFeatureInfoDirPath, 'dataSources.json')
    const mock_currentResolversFilePath = path.join(currentFeatureInfoDirPath, 'resolvers.json')
    const mock_currentApiFilePath = path.join(currentFeatureInfoDirPath, 'graphqlApi.json')
    const mock_currentSchemaFilePath = path.join(currentFeatureInfoDirPath, 'schema.graphql')
    const mock_currentResolversMappingDirPath = path.join(currentFeatureInfoDirPath, 'resolver-mappings')
    const mock_requestMappingFilePath = path.join(mock_currentResolversMappingDirPath, 'type.field.request')
    const mock_responseMappingFilePath = path.join(mock_currentResolversMappingDirPath, 'type.field.response')
    
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[mock_currentApiKeysFilePath] = JSON.stringify(mock_apiKeys, null, '\t')
    MOCK_FILE_INFO[mock_currentDataSourcesFilePath] = JSON.stringify(mock_dataSources, null, '\t')
    MOCK_FILE_INFO[mock_currentResolversFilePath] = JSON.stringify(mock_resolvers, null, '\t')
    MOCK_FILE_INFO[mock_currentApiFilePath] = JSON.stringify(mock_graphApi, null, '\t')
    MOCK_FILE_INFO[mock_currentSchemaFilePath] = 'mock_schema_contents'
    MOCK_FILE_INFO[mock_requestMappingFilePath] = 'mock_request_mapping_contents'
    MOCK_FILE_INFO[mock_responseMappingFilePath] = 'mock_response_mapping_contents'


    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
        appsyncManager.getAppSyncInfo = jest.fn((projectPath)=>{
            return mock_appsyncInfo
        })
        appsyncManager.setAppSyncInfo = jest.fn()
        appsyncManager.enable = jest.fn()
        appsyncManager.disable = jest.fn()
        appsyncRetrieve.run = jest.fn((projectInfo, awsDetails)=>{
            return new Promise((resolve, reject)=>{
                resolve()
            })
        })
        apiKeysHelper.dressForDevBackend = jest.fn()
        dataSourceHelper.dressForDevBackend = jest.fn()
        graphqlHelper.dressForDevBackend = jest.fn()
        resolversHelper.dressForDevBackend = jest.fn()
    })
   
    beforeEach(() => {
        featureOps.specify = undefined
        featureOps.onFeatureTurnOn = undefined
        featureOps.onFeatureTurnOff = undefined
        fs.ensureDirSync.mockClear()
    })

    test('property definitions', () => {
        expect(opsAppSync.featureName).toBeDefined()
        expect(opsAppSync.featureCommands).toBeDefined()
        expect(opsAppSync.specify).toBeDefined()
        expect(opsAppSync.runCommand).toBeDefined()
        expect(opsAppSync.onFeatureTurnOn).toBeDefined()
        expect(opsAppSync.onFeatureTurnOff).toBeDefined()
        expect(opsAppSync.build).toBeDefined()
        expect(opsAppSync.preBackendUpdate).toBeDefined()
        expect(opsAppSync.syncCurrentBackendInfo).toBeDefined()
        expect(opsAppSync.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsAppSync.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsAppSync.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsAppSync.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsAppSync.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsAppSync.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsAppSync.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsAppSync.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsAppSync.runCommand('console', mock_projectInfo, null)
        expect(appsyncManager.getAppSyncInfo).toBeCalled()
        expect(opn).toBeCalled()
    })

    test('build', () => {
        let callback = jest.fn()
        opsAppSync.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsAppSync.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsAppSync.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback).then(()=>{
            expect(appsyncRetrieve.run).toBeCalled()
            expect(callback).toBeCalled()
        })
    })

    test('syncToDevBackend', () => {
        opsAppSync.syncToDevBackend(mock_projectInfo, mock_backendProjectSpec, [], true)
        expect(fs.ensureDirSync).toBeCalled()
        expect(fs.existsSync).toBeCalled()
        expect(fs.copySync).toBeCalled()
        expect(apiKeysHelper.dressForDevBackend).toBeCalled()
        expect(dataSourceHelper.dressForDevBackend).toBeCalled()
        expect(graphqlHelper.dressForDevBackend).toBeCalled()
        expect(resolversHelper.dressForDevBackend).toBeCalled()
    })
})