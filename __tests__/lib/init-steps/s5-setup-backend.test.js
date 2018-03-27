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
jest.mock('../../../lib/backend-create.js')
jest.mock('../../../lib/backend-import.js')
jest.mock('../../../lib/backend-retrieve.js')

const backendCreate = require('../../../lib/backend-create.js')
const backendImport = require('../../../lib/backend-import.js')
const backendRetrieve = require('../../../lib/backend-retrieve.js')

const setupBackend = require('../../../lib/init-steps/s5-setup-backend.js')

describe('s5 setup backend', () => {
    const projectName = 'projectName'
    const projectPath = '/' + projectName
   
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_projectInfo = {"ProjectPath": projectPath}
    const mock_projectConfig = {}
    const mock_backendProject = {}
    const mock_packageJson = {}

    let mock_initInfo = {
        projectPath: '/projectName',
        mobileProjectID: mock_mobileProjectID + '-diff',
        backupAWSMobileJSDirPath: undefined,
        projectInfo: mock_projectInfo,
        projectConfig: undefined,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
        initialStage: 'clean-slate',
		strategy: 'create'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        backendCreate.createBackendProject = jest.fn((projectInfo, options, callback)=>{
            callback()
        })
        backendImport.run = jest.fn((projectInfo, callback)=>{
            callback()
        })
        backendRetrieve.linkToBackend = jest.fn((projectInfo, mobileProjectID, syncToDevFlag, callback)=>{
            callback()
        })
    })

    test('create strategy', () => {
        mock_initInfo.strategy = 'create'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendCreate.createBackendProject).toBeCalled()
        })
    })

    test('import strategy', () => {
        mock_initInfo.strategy = 'import'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendImport.run).toBeCalled()
        })
    })

    test('link strategy', () => {
        mock_initInfo.strategy = 'link'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendRetrieve.linkToBackend).toBeCalled()
        })
    })
})