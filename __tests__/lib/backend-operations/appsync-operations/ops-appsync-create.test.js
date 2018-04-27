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
jest.mock('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../../lib/aws-operations/aws-client.js')
jest.mock('../../../../lib/backend-operations/appsync-operations/helpers/appsync-wait-logic.js')

const fs = require('fs-extra')

const _featureName = 'appsync'

const appsyncManager = require('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const appsyncWaitLogic = require('../../../../lib/backend-operations/appsync-operations/helpers/appsync-wait-logic.js')
const awsClient = require('../../../../lib/aws-operations/aws-client.js')

const appsyncCreate = require('../../../../lib/backend-operations/appsync-operations/ops-appsync-create.js')

describe('appsync create', () => {
    let projectInfo = {
        ProjectName: 'mock_project',
        ProjectPath: '/mock_project',
    }
    let awsDetails ={
        info:
        { IsUsingProfile: true,
          ProfileName: 'default',
          AWSConfigFilePath: '/Users/userName/.awsmobilejs/project-aws-config/r-ReHfi.json',
          AWSInfoFilePath: '/Users/userName/workspace/r/awsmobilejs/.awsmobile/info/aws-info.json',
          LastProfileSyncTime: '2018-04-19-14-11-51' },
       config:
        { accessKeyId: 'mock_keyId',
          secretAccessKey: 'mockKey',
          region: 'us-east-1' 
        } 
    }
    let apiKeys = [{}]
    let dataSources = {
        dataSources: [{
            "name": "AppSyncEventTable",
            "description": null,
            "type": "AMAZON_DYNAMODB",
            "serviceRoleArn": "{managed-by-awsmobile-cli}",
            "dynamodbConfig": {
                "tableName": "AppSyncEventTable-QJyRmH2n",
                "awsRegion": "us-east-1",
                "useCallerCredentials": false
            }
        }],
        tables: [ {
            "AttributeDefinitions": [
                {
                    "AttributeName": "id",
                    "AttributeType": "S"
                }
            ],
            "TableName": "AppSyncEventTable-QJyRmH2n",
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
        }]
    }
    let graphalApi = { name: 'mock_api_name', authenticationType: 'AWS_IAM' }
    let resolvers = [
        {
            "typeName": "Event",
            "fieldName": "comments",
            "dataSourceName": "AppSyncCommentTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.response"
        }
    ]
    let schema = {
        definition: 'mock schema definition'
    }
    let mock_createTableResponse = {
        TableDescription: {
            TableArn: 'mock_tableArn',
            TableName: 'AppSyncEventTable-VHFuYLVO',
            TableId: 'mock_tableID'
        }
    }
    let mock_createRoleResponse = {
        Role: {
            RoleName: 'mock_roleName'
        }
    }
    let mock_createGraphqlApiResponse = {
        graphqlApi:
        { name: 'mock_apiName',
          apiId: 'mock_apiID',
          authenticationType: 'AWS_IAM',
          arn: 'mock_arn',
          uris:
           { GRAPHQL: 'https://mock.appsync-api.us-east-1.amazonaws.com/graphql' } 
        } 
    }
    let mock_startSchemaCreationResponse = {}
    let mock_createDataSourceResponse = {}
    let mock_createResolverResponse = {}
    let mock_createApiKeyResponse = {}

    const mock_dynamoDBClient = {
        createTable: jest.fn((param, callback)=>{
            callback(null, mock_createTableResponse)
        })
    } 
    const mock_iamClient = {
        createRole: jest.fn((param, callback)=>{
            callback(null, mock_createRoleResponse)
        }),
        putRolePolicy: jest.fn((param, callback)=>{
            callback(null, mock_createRoleResponse)
        })
    }
    const mock_appsyncClient = {
        createGraphqlApi: jest.fn((param, callback)=>{
            callback(null, mock_createGraphqlApiResponse)
        }),
        startSchemaCreation: jest.fn((param, callback)=>{
            callback(null, mock_startSchemaCreationResponse)
        }),
        createDataSource: jest.fn((param, callback)=>{
            callback(null, mock_createDataSourceResponse)
        }), 
        createResolver: jest.fn((param, callback)=>{
            callback(null, mock_createResolverResponse)
        }), 
        createApiKey:  jest.fn((param, callback)=>{
            callback(null, mock_createApiKeyResponse)
        }), 
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        appsyncManager.getApiKeys = jest.fn((projectPath)=>{ return apiKeys})
        appsyncManager.getDataSources = jest.fn((projectPath)=>{ return dataSources})
        appsyncManager.getGraphqlApi = jest.fn((projectPath)=>{ return graphalApi})
        appsyncManager.getResolvers = jest.fn((projectPath)=>{ return resolvers})
        appsyncManager.getSchema = jest.fn((projectPath)=>{ return schema})
        awsClient.DynamoDB = jest.fn(()=>{
            return mock_dynamoDBClient
        })
        awsClient.IAM = jest.fn(()=>{
            return mock_iamClient
        })
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
        appsyncWaitLogic.waitForDDBTables = jest.fn(appsyncCreationHandle =>{
            return appsyncCreationHandle
        })
        appsyncWaitLogic.waitForSchemaCreation = jest.fn((appsyncCreationHandle, apiId, callback)=>{
            if(callback){
                callback(null, appsyncCreationHandle)
            }
        })
    })

    beforeEach(() => {
    })

    test('run', () => {
        return appsyncCreate.run(projectInfo, awsDetails).then(() => {
            expect(mock_dynamoDBClient.createTable).toBeCalled()
            expect(mock_iamClient.createRole).toBeCalled()
            expect(mock_iamClient.putRolePolicy).toBeCalled()
            expect(mock_appsyncClient.createGraphqlApi).toBeCalled()
            expect(mock_appsyncClient.startSchemaCreation).toBeCalled()
            expect(mock_appsyncClient.createResolver).toBeCalled()
            expect(mock_appsyncClient.createApiKey).toBeCalled()
            expect(appsyncWaitLogic.waitForSchemaCreation).toBeCalled()
        })
    })

})