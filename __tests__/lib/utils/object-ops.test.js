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
const objectOps = require('../../../lib/utils/object-ops.js')

describe('object ops', () => {
    test('sortByPropertyKey', () => {
        const testObject = {
            'key4': 'value4',
            'key6': 'value6',
            'key9': 'value9',
            'key1': 'value1',
            'key2': 'value2',
            'key3': 'value3',
            'key7': 'value7',
            'key5': 'value5',
            'key8': 'value8'
        }
        let sortedObj = objectOps.sortByPropertyKey(testObject)

        let sortedKeys = Object.keys(testObject).sort()

        expect(sortedObj).toBeDefined()
        for(let i = 0; i<sortedKeys.length; i++){
            let keyInSortedObj = 
            expect(Object.keys(sortedObj)[i]).toEqual(sortedKeys[i])
            sortedObj[keyInSortedObj] = testObject[keyInSortedObj]
        }
    })
})
