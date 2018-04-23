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

const fs = require('fs-extra')
const path = require('path')
const awsmobilejsConstant = require('../../../../../lib/utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers')

describe('appsync create', () => {
    const featureDirPath = '/projectName/awsmobilejs/backend/appsync'
    const resolverMappingsDirPath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    let requestMappingFileName = 'Event.comments.request'
    let responseMappingFileName = 'Event.comments.response'
    let requestMappingFilePath = path.join(resolverMappingsDirPath, requestMappingFileName)
    let responseMappingFilePath = path.join(resolverMappingsDirPath, responseMappingFileName)

    const resolver_naked = {
        "typeName": "Event",
        "fieldName": "comments",
        "dataSourceName": "AppSyncCommentTable",
        "resolverArn": "mock_resolverArn", 
        "requestMappingTemplate": "mock_requestMappingTemplate",
        "responseMappingTemplate": "mock_responseMappingTemplate"
    }
    const resolver_dressed = {
        "typeName": "Event",
        "fieldName": "comments",
        "dataSourceName": "AppSyncCommentTable",
        "resolverArn": "mock_resolverArn", 
        "requestMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.request",
        "responseMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.response"
    }
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[requestMappingFilePath] = "mock_requestMappingTemplate"
    MOCK_FILE_INFO[responseMappingFilePath] = "mock_responseMappingTemplate"

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

    beforeAll(()=>{
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })
    beforeEach(()=>{
        fs.ensureDirSync.mockClear()
        fs.writeFileSync.mockClear()
        fs.existsSync.mockClear()
        fs.readFileSync.mockClear()
    })
    test('writeResolverMappings', ()=>{
        helper.writeResolverMappings(featureDirPath, resolver_naked)
        expect(fs.ensureDirSync).toBeCalled()
        expect(fs.writeFileSync).toBeCalled()
    })
    test('readResolverMappings', ()=>{
        helper.readResolverMappings(featureDirPath, resolver_dressed)
        expect(fs.existsSync).toBeCalled()
        expect(fs.readFileSync).toBeCalled()
    })
    test('dressForDevBackend', ()=>{
        helper.dressForDevBackend(resolvers_current)
        expect(resolvers_current[0].resolverArn).not.toBeDefined()
    })
    test('diff', ()=>{
        let appsyncUpdateHandle = {
            currentAppSyncInfo: {
                resolvers: resolvers_current
            }, 
            devAppSyncInfo: {
                resolvers: resolvers
            }
        }
        let diffMarked = helper.diff(appsyncUpdateHandle)
        expect(diffMarked).toBeDefined()
        expect(diffMarked.length).toBeGreaterThan(0)
    })
})
