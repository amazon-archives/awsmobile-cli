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

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys')

describe('appsync create', () => {
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
    beforeAll(()=>{

    })
    beforeEach(()=>{

    })
    test('dressForDevBackend', ()=>{
        helper.dressForDevBackend(apiKeys_current)
        expect(apiKeys_current.id).not.toEqual(mock_apiKeyId)
    })
    test('diff', ()=>{
        let appsyncUpdateHandle = {
            currentAppSyncInfo: {
                apiKeys: apiKeys_current
            }, 
            devAppSyncInfo: {
                apiKeys: apiKeys
            }
        }
        let diffMarkedApiKeys = helper.diff(appsyncUpdateHandle)
        expect(diffMarkedApiKeys).toBeDefined()
        expect(diffMarkedApiKeys.length).toBeGreaterThan(0)
    })
})
