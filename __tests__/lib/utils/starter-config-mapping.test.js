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
const starterConfigMapping = require('../../../lib/utils/starter-config-mapping.js')

describe('feature-yaml-template-mapping', () => {
    test('feature-yaml-template-mapping defined', () => {
        expect(starterConfigMapping['react']).toBeDefined()
        expect(starterConfigMapping['react-native']).toBeDefined()
        // expect(starterConfigMapping['angular']).toBeDefined()
        // expect(starterConfigMapping['ionic']).toBeDefined()
        // expect(starterConfigMapping['vue']).toBeDefined()
    })
})
