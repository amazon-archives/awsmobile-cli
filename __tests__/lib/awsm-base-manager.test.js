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

const baseManager = require('../../lib/awsm-base-manager.js')

const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')

describe('awsmobile base manager functions', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {
        "ProjectName": "",
        "ProjectPath": "",
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
    }
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })

    beforeEach(() => {
        fs.existsSync.mockClear()
        fs.renameSync.mockClear()
        fs.emptyDirSync.mockClear()
        fs.copySync.mockClear()
    })

    test('placeAwsmobileBase', () => {

        baseManager.placeAwsmobileBase(projectPath)

        expect(fs.existsSync).toBeCalled()
        expect(fs.existsSync.mock.calls[0][0]).toBe(awsmobilejsDirPath)
    })

    test('backupAwsmobileBase', () => {
        baseManager.backupAwsmobileBase(projectPath)
        expect(fs.renameSync).toBeCalled()
    })
})
