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
const os = require('os')
const awsmobilejsConstant = require('../../../../../lib/utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

const helper = require('../../../../../lib/backend-operations/appsync-operations/helpers/helper-schema')

describe('appsync create', () => {
    const schema_current = "schema" + os.EOL +
    "{" + os.EOL +
        "query: Query"  + os.EOL +
        "mutation: Mutation"  + os.EOL +
        "subscription: Subscription"  + os.EOL +
    "}"
    
    const schema = "schema" + os.EOL +
    "{" + os.EOL +
        "query: Query2"  + os.EOL +
        "mutation: Mutation2"  + os.EOL +
        "subscription: Subscription2"  + os.EOL +
    "}"

    beforeAll(()=>{

    })
    beforeEach(()=>{

    })
    test('diff', ()=>{
        let appsyncUpdateHandle = {
            currentAppSyncInfo: {
                schema: {
                    definition: schema_current
                }
            }, 
            devAppSyncInfo: {
                schema: {
                    definition: schema
                }
            }
        }
        let diffMarked = helper.diff(appsyncUpdateHandle)
        expect(diffMarked[DIFF]).toBeDefined()
    })
})
