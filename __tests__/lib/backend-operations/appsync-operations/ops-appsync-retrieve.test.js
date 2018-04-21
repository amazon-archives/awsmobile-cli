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
jest.mock('../../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')

const fs = require('fs-extra')

const _featureName = 'appsync'

const appsyncManager = require('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const awsClient = require('../../../../lib/aws-operations/aws-client.js')
const resolversHelper = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')
const pathManager = require('../../../../lib/utils/awsmobilejs-path-manager.js')

const appsyncRetrieve = require('../../../../lib/backend-operations/appsync-operations/ops-appsync-retrieve.js')

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
    let appsyncInfo = {
        apiId: 'mock_apiId'
    }

    let mock_describeTableResponse = {
        Table: {
            TableArn: 'mock_tableArn',
            TableName: 'AppSyncEventTable-VHFuYLVO',
            TableId: 'mock_tableID'
        }
    }
    
    let mock_getGraphqlApiResponse = {
        graphqlApi:
        { name: 'mock_apiName',
          apiId: 'mock_apiID',
          authenticationType: 'AWS_IAM',
          arn: 'mock_arn',
          uris:
           { GRAPHQL: 'https://mock.appsync-api.us-east-1.amazonaws.com/graphql' } 
        } 
    }
    let mock_listDateSourcesResponse = { dataSources:
        [ { dataSourceArn: 'arn:aws:appsync:us-east-1:466632810889:apis/7zaoukpnnneyhpe66fwnptnghu/datasources/AppSyncCommentTable',
            name: 'AppSyncCommentTable',
            description: null,
            type: 'AMAZON_DYNAMODB',
            serviceRoleArn: 'arn:aws:iam::466632810889:role/appsync-datasource-ddb-OYZK5W-AppSyncCommentTable-',
            dynamodbConfig:
             { tableName: 'AppSyncCommentTable-VHFuYLVO',
               awsRegion: 'us-east-1',
               useCallerCredentials: false } },
          { dataSourceArn: 'arn:aws:appsync:us-east-1:466632810889:apis/7zaoukpnnneyhpe66fwnptnghu/datasources/AppSyncEventTable',
            name: 'AppSyncEventTable',
            description: null,
            type: 'AMAZON_DYNAMODB',
            serviceRoleArn: 'arn:aws:iam::466632810889:role/appsync-datasource-ddb-OYZK5W-AppSyncEventTable-VH',
            dynamodbConfig:
             { tableName: 'AppSyncEventTable-VHFuYLVO',
               awsRegion: 'us-east-1',
               useCallerCredentials: false } } ],
       nextToken: null }
    let mock_listTypesResponse = {
        types:
        [ { name: 'Comment',
            description: null,
            arn: 'arn:aws:appsync:us-east-1:466632810889:apis/7zaoukpnnneyhpe66fwnptnghu/types/Comment',
            definition: 'type Comment\n{\n#   The id of the comment\'s parent event.\neventId: ID!\n\n\n#   A unique identifier for the comment.\ncommentId: String!\n\n\n#   The comment\'s content.\ncontent: String!\n\n\n#   The comment timestamp. This field is indexed to enable sorted pagination.\ncreatedAt: String!\n\n}\n',
            format: 'SDL',
            listResolversResponse: { resolvers: [], nextToken: null } }
        ]}
    let mock_listResolverResponse = [ { 
        typeName: 'Event',
        fieldName: 'comments',
        dataSourceName: 'AppSyncCommentTable',
        resolverArn: 'arn:aws:appsync:us-east-1:466632810889:apis/7zaoukpnnneyhpe66fwnptnghu/types/Event/resolvers/comments',
        requestMappingTemplate: '{managed-by-awsmobile-cli}:Event.comments.request',
        responseMappingTemplate: '{managed-by-awsmobile-cli}:Event.comments.response' }]
        
    let mock_listApiKeyResponse = { apiKeys: [], nextToken: null }

    const mock_dynamoDBClient = {
        describeTable: jest.fn((param, callback)=>{
            callback(null, mock_describeTableResponse)
        })
    } 
    const mock_appsyncClient = {
        getGraphqlApi: jest.fn((param, callback)=>{
            callback(null, mock_getGraphqlApiResponse)
        }),
        listDataSources: jest.fn((param, callback)=>{
            callback(null, mock_listDateSourcesResponse)
        }),
        listTypes: jest.fn((param, callback)=>{
            callback(null, mock_listTypesResponse)
        }), 
        listResolvers: jest.fn((param, callback)=>{
            callback(null, mock_listResolverResponse)
        }), 
        listApiKeys:  jest.fn((param, callback)=>{
            callback(null, mock_listApiKeyResponse)
        }), 
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        appsyncManager.getAppSyncInfo = jest.fn((projectPath)=>{return appsyncInfo})
        appsyncManager.setAppSyncInfo = jest.fn()
        appsyncManager.setAppSyncJS = jest.fn() 
        awsClient.DynamoDB = jest.fn(()=>{
            return mock_dynamoDBClient
        })
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
    })

    beforeEach(() => {
    })

    test('run', () => {
        return appsyncRetrieve.run(projectInfo, awsDetails).then(() => {
            expect(mock_dynamoDBClient.describeTable).toBeCalled()
            expect(mock_appsyncClient.getGraphqlApi).toBeCalled()
            expect(mock_appsyncClient.listDataSources).toBeCalled()
            expect(mock_appsyncClient.listTypes).toBeCalled()
            expect(mock_appsyncClient.listResolvers).toBeCalled()
            expect(mock_appsyncClient.listApiKeys).toBeCalled()
        })
    })

})