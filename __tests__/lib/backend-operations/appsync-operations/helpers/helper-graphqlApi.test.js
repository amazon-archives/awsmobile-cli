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

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi')

describe('appsync create', () => {
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
    beforeAll(()=>{

    })
    beforeEach(()=>{

    })
    test('dressForDevBackend', ()=>{
        helper.dressForDevBackend(graphqlApi_current)
        expect(graphqlApi_current.apiId).not.toBeDefined()
    })
    test('diff', ()=>{
        let appsyncUpdateHandle = {
            currentAppSyncInfo: {
                graphqlApi: graphqlApi_current
            }, 
            devAppSyncInfo: {
                graphqlApi: graphqlApi
            }
        }
        let diffMarked = helper.diff(appsyncUpdateHandle)
        expect(diffMarked[DIFF]).toBeDefined()
    })
})
