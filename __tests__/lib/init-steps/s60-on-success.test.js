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

jest.mock('../../../lib/utils/dependency-manager.js')
jest.mock('../../../lib/utils/git-manager.js')

const dependencyManager = require('../../../lib/utils/dependency-manager.js')
const gitManager = require('../../../lib/utils/git-manager.js')

const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const onSuccess = require('../../../lib/init-steps/s60-on-success.js')

describe('s60 on success', () => {
  
    const projectName = 'projectName'
    const projectPath = '/' + projectName
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_projectInfo = {}
    const mock_projectConfig = {}
    const mock_backendProject = {}
    const mock_packageJson = {}
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    let mock_initInfo = {
        projectPath: projectPath,
        mobileProjectID: mock_mobileProjectID,
        backupAWSMobileJSDirPath: undefined,
        projectInfo: mock_projectInfo,
        projectConfig: mock_projectConfig,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
		initialStage: 'clean-slate',
		strategy: 'create'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        fs.__setMockFiles(MOCK_FILE_INFO) 

        dependencyManager.setupAmplifyDependency = jest.fn((initInfo)=>{
            return new Promise((resolve, reject)=>{
                resolve(initInfo)
            })
        })
        gitManager.insertAwsmobilejs = jest.fn()
    })

    test('run', () => {
		return onSuccess.run(mock_initInfo).then((initInfo)=>{
            expect(dependencyManager.setupAmplifyDependency).toBeCalled()
            expect(gitManager.insertAwsmobilejs).toBeCalled()
            expect(fs.writeFileSync).toBeCalled()
        })
    })

    test('run with skipInstallingDependencies set', () => {
        dependencyManager.setupAmplifyDependency.mockReset()
        const custom_initInfo = Object.assign({}, mock_initInfo, { skipInstallingDependencies: true })
		return onSuccess.run(custom_initInfo).then((initInfo)=>{
            expect(dependencyManager.setupAmplifyDependency).not.toBeCalled()
            expect(gitManager.insertAwsmobilejs).toBeCalled()
            expect(fs.writeFileSync).toBeCalled()
        })
    })
})