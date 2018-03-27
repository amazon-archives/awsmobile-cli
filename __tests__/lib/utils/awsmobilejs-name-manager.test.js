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
const nameManager = require('../../../lib/utils/awsmobilejs-name-manager.js')

describe('awsmobilejs name manager', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    
    const projectInfo = {
        "ProjectName": "",
        "ProjectPath": projectPath,
        "SourceDir": "src",
        "DistributionDir": "dist"
    }

    beforeAll(() => {
    })

    test('name generation methods exist', () => {
        expect(nameManager.generateProjectName()).toBeDefined()
        expect(nameManager.generateAWSConfigFileName(projectInfo)).toBeDefined()
        expect(nameManager.generateIAMUserName()).toBeDefined()
        expect(nameManager.generateBackendProjectName(projectInfo)).toBeDefined()
        expect(nameManager.generateDeviceFarmTestRunName(projectInfo)).toBeDefined()
        expect(nameManager.generateCloudFrontInvalidationReference(projectInfo)).toBeDefined()
        expect(nameManager.generateTempName('seedName')).toBeDefined()
    })
})
