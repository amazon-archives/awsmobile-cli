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
const pressKeyToContinue = require('../../../lib/utils/press-enter-to-continue.js')

describe('press-enter-to-continue', () => {
    test('run', () => {
        let mockData = 'mock-data'
        let handle = {message: 'mock-message'}
        pressKeyToContinue.run(handle).then((handle)=>{
            expect(handle.data).toBeDefined()
            expect(handle.data).toEqual(mockData)
        })
        process.stdin.emit('data', mockData)
    })
})
