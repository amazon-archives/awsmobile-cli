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
const awsmobilejsConstant = require('../../../../../lib/utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-dynamoDB')

describe('appsync create', () => {
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
            }
        ]
    }
    beforeAll(()=>{

    })
    beforeEach(()=>{

    })
    test('dressForDevBackend', ()=>{
        helper.dressForDevBackend(dataSources_current.tables[0])
        expect(dataSources_current.tables[0].TableArn).not.toBeDefined()
    })
    test('diff', ()=>{
        let appsyncUpdateHandle = {
            currentAppSyncInfo: {
                dataSources: dataSources_current
            }, 
            devAppSyncInfo: {
                dataSources: dataSources
            }
        }
        let diffMarked = helper.diff(appsyncUpdateHandle)
        expect(diffMarked).toBeDefined()
        expect(diffMarked.length).toBeGreaterThan(0)
    })
    test('constructCreateParam', ()=>{
        let param = helper.constructCreateParam(dataSources.tables[0])
        expect(param).toBeDefined()
    })
    test('constructUpdateParam', ()=>{
        let param = helper.constructUpdateParam(dataSources.tables[0])
        expect(param).toBeDefined()
    })
})
