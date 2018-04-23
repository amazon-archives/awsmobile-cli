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
jest.mock('../../../../lib/aws-operations/aws-client.js')
jest.mock('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../../lib/backend-operations/appsync-operations/helpers/appsync-wait-logic.js')

const os = require('os')
const fs = require('fs-extra')
const path = require('path')

const _featureName = 'appsync'

const appsyncManager = require('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const serviceRoleHelper = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-serviceRoles.js')
const appsyncWaitLogic = require('../../../../lib/backend-operations/appsync-operations/helpers/appsync-wait-logic.js')
const helperApiKeys = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys.js')
const helperDataSources = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-dataSources.js')
const helperDynamoDB = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-dynamoDB.js')
const helperGraphqlApi = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi.js')
const helperResolvers = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')
const helperSchema = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-schema.js')
const awsClient = require('../../../../lib/aws-operations/aws-client.js')
const pathManager = require('../../../../lib/utils/awsmobilejs-path-manager.js')
const nameManager = require('../../../../lib/utils/awsmobilejs-name-manager.js')
const awsmobilejsConstant = require('../../../../lib/utils/awsmobilejs-constant.js')

const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete


const appsyncUpdate = require('../../../../lib/backend-operations/appsync-operations/ops-appsync-update.js')

describe('appsync update', () => {
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
    let appsyncInfo = {
        apiId: 'mock_apiId'
    }
    //////////////////////////////apiKeys
    const mock_apiKeyId = "mock_apiKeyId"
    const apiKeys_current = [
        {
            "id": mock_apiKeyId,
            "description": null,
            "expires": 1525064400
        },
        {
            "id": 'mock_apiKeyId_1',
            "description": null,
            "expires": 1525064400
        }
    ]
    const apiKeys = [
        {
            "id": "{managed-by-awsmobile-cli}:0",
            "description": 'updated description',
            "expires": 1525064400
        },
        {
            "description": null,
            "expires": 1525064400
        }
    ]

    ///////////////dataSources

    const mock_dataSourceArn = "mock_dataSourceArn"
    const dataSources_current = {
        "dataSources": [
            {
                "dataSourceArn": mock_dataSourceArn,
                "name": "AppSyncCommentTable",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "mock_serviceRoleArn",
                "dynamodbConfig": {
                    "tableName": "AppSyncCommentTable-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            },
            {
                "dataSourceArn": "mock_dataSourceArn_2",
                "name": "AppSyncEventTable",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "mock_serviceRoleArn_2",
                "dynamodbConfig": {
                    "tableName": "AppSyncEventTable-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            }
        ],
        "tables": [
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "commentId",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "createdAt",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "eventId",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncCommentTable-VHFuYLVO",
                "KeySchema": [
                    {
                        "AttributeName": "eventId",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "commentId",
                        "KeyType": "RANGE"
                    }
                ],
                "TableStatus": "ACTIVE",
                "CreationDateTime": "2018-04-20T23:16:59.155Z",
                "ProvisionedThroughput": {
                    "NumberOfDecreasesToday": 0,
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                },
                "TableSizeBytes": 0,
                "ItemCount": 0,
                "TableArn": "mock_TableArn",
                "TableId": "mock_TableId",
                "LocalSecondaryIndexes": [
                    {
                        "IndexName": "LSI-AppSyncCommentTable-by-eventId-createdAt",
                        "KeySchema": [
                            {
                                "AttributeName": "eventId",
                                "KeyType": "HASH"
                            },
                            {
                                "AttributeName": "createdAt",
                                "KeyType": "RANGE"
                            }
                        ],
                        "Projection": {
                            "ProjectionType": "ALL"
                        },
                        "IndexSizeBytes": 0,
                        "ItemCount": 0,
                        "IndexArn": "mock_IndexArn"
                    }
                ],
                "Region": "us-east-1"
            },
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncEventTable-VHFuYLVO",
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "TableStatus": "ACTIVE",
                "CreationDateTime": "2018-04-20T23:16:58.916Z",
                "ProvisionedThroughput": {
                    "NumberOfDecreasesToday": 0,
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                },
                "TableSizeBytes": 0,
                "ItemCount": 0,
                "TableArn": "mock_TableArn_2",
                "TableId": "mock_TableId_2",
                "Region": "us-east-1"
            }
        ]
    }
    const dataSources = {
        "dataSources": [
            {
                "name": "AppSyncCommentTable",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "{managed-by-awsmobile-cli}",
                "dynamodbConfig": {
                    "tableName": "AppSyncCommentTable-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            },
            {
                "name": "AppSyncCommentTable_2",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "{managed-by-awsmobile-cli}",
                "dynamodbConfig": {
                    "tableName": "AppSyncCommentTable-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            },
            {
                "name": "AppSyncEventTable",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "{managed-by-awsmobile-cli}",
                "dynamodbConfig": {
                    "tableName": "AppSyncEventTable2-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            },
            {
                "name": "AppSyncEventTable2",
                "description": null,
                "type": "AMAZON_DYNAMODB",
                "serviceRoleArn": "{managed-by-awsmobile-cli}",
                "dynamodbConfig": {
                    "tableName": "AppSyncEventTable2-VHFuYLVO",
                    "awsRegion": "us-east-1",
                    "useCallerCredentials": false
                }
            }
        ],
        "tables": [
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "commentId",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "createdAt",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "eventId",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncCommentTable-VHFuYLVO",
                "KeySchema": [
                    {
                        "AttributeName": "eventId",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "commentId",
                        "KeyType": "RANGE"
                    }
                ],
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 10,
                    "WriteCapacityUnits": 10
                },
                "LocalSecondaryIndexes": [
                    {
                        "IndexName": "LSI-AppSyncCommentTable-by-eventId-createdAt",
                        "KeySchema": [
                            {
                                "AttributeName": "eventId",
                                "KeyType": "HASH"
                            },
                            {
                                "AttributeName": "createdAt",
                                "KeyType": "RANGE"
                            }
                        ],
                        "Projection": {
                            "ProjectionType": "ALL"
                        }
                    }
                ],
                "Region": "us-east-1"
            },
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncEventTable-VHFuYLVO",
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 10,
                    "WriteCapacityUnits": 10
                },
                "Region": "us-east-1"
            },
            {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "AppSyncEventTable2-VHFuYLVO",
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 10,
                    "WriteCapacityUnits": 10
                },
                "Region": "us-east-1"
            }
        ]
    }
    ////////////////////graphqlApi
    const graphqlApi_current = {
        "name": "r-2018-04-19-14-11-44",
        "apiId": "mock_apiId",
        "authenticationType": "API_KEY",
        "arn": "mock_arn",
        "uris": {
            "GRAPHQL": "https://mock.appsync-api.us-east-1.amazonaws.com/graphql"
        }
    }
    const graphqlApi = {
        "name": "r-2018-04-19-14-11-44",
        "authenticationType": "IAM"
    }
    ///////////////////resolvers

    const featureDirPath = '/projectName/awsmobilejs/backend/appsync'
    const resolverMappingsDirPath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    let requestMappingFileName = 'Event.comments.request'
    let responseMappingFileName = 'Event.comments.response'
    let requestMappingFilePath = path.join(resolverMappingsDirPath, requestMappingFileName)
    let responseMappingFilePath = path.join(resolverMappingsDirPath, responseMappingFileName)

    const resolvers_current =[
        {
            "typeName": "Event",
            "fieldName": "comments",
            "dataSourceName": "AppSyncCommentTable",
            "resolverArn": "mock_resolverArn", 
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.response"
        },
        {
            "typeName": "Mutation",
            "fieldName": "commentOnEvent",
            "dataSourceName": "AppSyncCommentTable",
            "resolverArn": "mock_resolverArn1",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.commentOnEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.commentOnEvent.response"
        },
        {
            "typeName": "Mutation",
            "fieldName": "createEvent",
            "dataSourceName": "AppSyncEventTable",
            "resolverArn": "mock_resolverArn2",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.createEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.createEvent.response"
        },
        {
            "typeName": "Mutation",
            "fieldName": "deleteEvent",
            "dataSourceName": "AppSyncEventTable",
            "resolverArn": "mock_resolverArn3",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.deleteEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.deleteEvent.response"
        },
        {
            "typeName": "Query",
            "fieldName": "getEvent",
            "dataSourceName": "AppSyncEventTable",
            "resolverArn": "mock_resolverArn4",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Query.getEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Query.getEvent.response"
        },
        {
            "typeName": "Query",
            "fieldName": "listEvents",
            "dataSourceName": "AppSyncEventTable",
            "resolverArn": "mock_resolverArn5",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Query.listEvents.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Query.listEvents.response"
        }
    ]
    const resolvers = [
        {
            "typeName": "Event",
            "fieldName": "comments",
            "dataSourceName": "AppSyncCommentTable",
            "requestMappingTemplate": "mock_updated_requestMappingTemplate",
            "responseMappingTemplate":  "mock_updated_responseMappingTemplate"
        },
        {
            "typeName": "Mutation",
            "fieldName": "commentOnEvent",
            "dataSourceName": "AppSyncCommentTable",
            "requestMappingTemplate": "mock_updated_requestMappingTemplate2",
            "responseMappingTemplate":  "mock_updated_responseMappingTemplate2"
        },
        {
            "typeName": "Mutation",
            "fieldName": "createEvent",
            "dataSourceName": "AppSyncEventTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.createEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.createEvent.response"
        },
        {
            "typeName": "Mutation",
            "fieldName": "deleteEvent",
            "dataSourceName": "AppSyncEventTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.deleteEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Mutation.deleteEvent.response"
        },
        {
            "typeName": "Query",
            "fieldName": "getEvent",
            "dataSourceName": "AppSyncEventTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Query.getEvent.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Query.getEvent.response"
        },
        {
            "typeName": "Query",
            "fieldName": "listEvents",
            "dataSourceName": "AppSyncEventTable",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Query.listEvents.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Query.listEvents.response"
        }
    ]
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[requestMappingFilePath] = "mock_requestMappingTemplate"
    MOCK_FILE_INFO[responseMappingFilePath] = "mock_responseMappingTemplate"

    //////////////////schema
    const schema_current_def = "schema" + os.EOL +
    "{" + os.EOL +
        "query: Query"  + os.EOL +
        "mutation: Mutation"  + os.EOL +
        "subscription: Subscription"  + os.EOL +
    "}"
    
    const schema_def = "schema" + os.EOL +
    "{" + os.EOL +
        "query: Query2"  + os.EOL +
        "mutation: Mutation2"  + os.EOL +
        "subscription: Subscription2"  + os.EOL +
    "}"
    const schema_current = {
        definition: schema_current_def
    }
    const schema = {
        definition: schema_def
    }

    ////////////////////////////mock responses

    let mock_createTableResponse = {
        TableDescription: {
            TableArn: 'mock_tableArn',
            TableName: 'AppSyncEventTable-VHFuYLVO',
            TableId: 'mock_tableID'
        }
    }
    let mock_updateTableResponse = {
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
    let mock_updateGraphqlApiResponse = {
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
    let mock_deleteDataSourceResponse = {}
    let mock_updateDataSourceResponse = {}
    let mock_createResolverResponse = {}
    let mock_deleteResolverResponse = {}
    let mock_updateResolverResponse = {}
    let mock_createApiKeyResponse = {}
    let mock_deleteApiKeyResponse = {}
    let mock_updateApiKeyResponse = {}

    const mock_dynamoDBClient = {
        createTable: jest.fn((param, callback)=>{
            callback(null, mock_createTableResponse)
        }),
        updateTable: jest.fn((param, callback)=>{
            callback(null, mock_updateTableResponse)
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
        updateGraphqlApi: jest.fn((param, callback)=>{
            callback(null, mock_updateGraphqlApiResponse)
        }),
        startSchemaCreation: jest.fn((param, callback)=>{
            callback(null, mock_startSchemaCreationResponse)
        }),
        createDataSource: jest.fn((param, callback)=>{
            callback(null, mock_createDataSourceResponse)
        }),
        deleteDataSource: jest.fn((param, callback)=>{
            callback(null, mock_deleteDataSourceResponse)
        }),
        updateDataSource: jest.fn((param, callback)=>{
            callback(null, mock_updateDataSourceResponse)
        }),
        createResolver: jest.fn((param, callback)=>{
            callback(null, mock_createResolverResponse)
        }),
        deleteResolver: jest.fn((param, callback)=>{
            callback(null, mock_deleteResolverResponse)
        }),
        updateResolver: jest.fn((param, callback)=>{
            callback(null, mock_updateResolverResponse)
        }), 
        createApiKey:  jest.fn((param, callback)=>{
            callback(null, mock_createApiKeyResponse)
        }), 
        deleteApiKey:  jest.fn((param, callback)=>{
            callback(null, mock_deleteApiKeyResponse)
        }), 
        updateApiKey:  jest.fn((param, callback)=>{
            callback(null, mock_updateApiKeyResponse)
        }), 
    }

    beforeAll(() => {
        // global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 

        appsyncManager.getAppSyncInfo = jest.fn((projectPath)=>{return appsyncInfo})
        appsyncManager.getCurrentApiKeys = jest.fn((projectPath)=>{return apiKeys_current})
        appsyncManager.getCurrentDataSources = jest.fn((projectPath)=>{return dataSources_current})
        appsyncManager.getCurrentGraphqlApi = jest.fn((projectPath)=>{return graphqlApi_current})
        appsyncManager.getCurrentResolvers = jest.fn((projectPath)=>{return resolvers_current})
        appsyncManager.getCurrentSchema = jest.fn((projectPath)=>{return schema_current})
        
        appsyncManager.getApiKeys = jest.fn((projectPath)=>{return apiKeys})
        appsyncManager.getDataSources = jest.fn((projectPath)=>{return dataSources})
        appsyncManager.getGraphqlApi = jest.fn((projectPath)=>{return graphqlApi})
        appsyncManager.getResolvers = jest.fn((projectPath)=>{return resolvers})
        appsyncManager.getSchema = jest.fn((projectPath)=>{return schema})

        awsClient.DynamoDB = jest.fn(()=>{
            return mock_dynamoDBClient
        })
        awsClient.IAM = jest.fn(()=>{
            return mock_iamClient
        })
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
        appsyncWaitLogic.waitForDDBTables = jest.fn(handle =>{
            return handle
        })
        appsyncWaitLogic.waitForSchemaCreation = jest.fn((handle, apiId, callback)=>{
            if(callback){
                callback(null, handle)
            }
        })
    })

    beforeEach(() => {
    })

    test('run', () => {
        return appsyncUpdate.run(projectInfo, awsDetails).then(() => {
            expect(mock_dynamoDBClient.createTable).toBeCalled()
            expect(mock_dynamoDBClient.updateTable).toBeCalled()
            expect(mock_iamClient.createRole).toBeCalled()
            expect(mock_iamClient.putRolePolicy).toBeCalled()
            expect(mock_appsyncClient.updateGraphqlApi).toBeCalled()
            expect(mock_appsyncClient.startSchemaCreation).toBeCalled()
            expect(mock_appsyncClient.updateResolver).toBeCalled()
            expect(mock_appsyncClient.createApiKey).toBeCalled()
            expect(mock_appsyncClient.deleteApiKey).toBeCalled()
            expect(mock_appsyncClient.updateApiKey).toBeCalled()
            expect(appsyncWaitLogic.waitForDDBTables).toBeCalled()
            expect(appsyncWaitLogic.waitForSchemaCreation).toBeCalled()
        })
    })

})