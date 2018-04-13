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
const featureOpsMapping = require('../../../lib/utils/feature-ops-mapping.js')

describe('feature-ops-mapping', () => {
    test('feature-ops-mapping defined', () => {
        expect(featureOpsMapping['user-signin']).toBeDefined()
        expect(featureOpsMapping['user-files']).toBeDefined()
        expect(featureOpsMapping['cloud-api']).toBeDefined()
        expect(featureOpsMapping['database']).toBeDefined()
        expect(featureOpsMapping['analytics']).toBeDefined()
        expect(featureOpsMapping['hosting']).toBeDefined()
    })
})
