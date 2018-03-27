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
const featureProjectOpsMapping = require('../../../lib/utils/feature-project-ops-mapping.js')

describe('feature-project-ops-mapping', () => {
    test('feature-project-ops-mapping defined', () => {
        expect(featureProjectOpsMapping['user-signin']).toBeDefined()
        expect(featureProjectOpsMapping['user-files']).toBeDefined()
        expect(featureProjectOpsMapping['cloud-api']).toBeDefined()
        expect(featureProjectOpsMapping['database']).toBeDefined()
        expect(featureProjectOpsMapping['analytics']).toBeDefined()
        expect(featureProjectOpsMapping['hosting']).toBeDefined()
    })
})
