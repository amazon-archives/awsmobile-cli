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
jest.dontMock('fs-extra')
jest.mock('../../lib/project-info-manager.js')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/backend-operations/backend-spec-manager.js')

const path = require('path')

const featureCommand = require('../../bin/feature-command.js')

const projectInfoManager = require('../../lib/project-info-manager.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const backendSpecManager = require('../../lib/backend-operations/backend-spec-manager.js')

describe('run feature commands', () => {
    const mockProjectInfo = {}
    const mockOpsFeatureFilePath = path.normalize(path.join(__dirname, '../../__mocks__/mock-ops-feature.js'))
    const mockOpsFeature = require(mockOpsFeatureFilePath)

    beforeAll(() => {
        global.console = {log: jest.fn()}
        
        projectInfoManager.getProjectInfo = jest.fn(()=>{
            return mockProjectInfo
        })

        pathManager.getOpsFeatureFilePath = jest.fn(()=>{
            return mockOpsFeatureFilePath
        })

        backendSpecManager.enableFeature = jest.fn()
        backendSpecManager.disableFeature = jest.fn()
        backendSpecManager.configureFeature = jest.fn()
    })

    beforeEach(() => {
        backendSpecManager.enableFeature.mockClear()
        backendSpecManager.disableFeature.mockClear()
        backendSpecManager.configureFeature.mockClear()
        mockOpsFeature.runCommand.mockClear()
    })

    test('enable', () => {
       const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'enable']
       featureCommand.run(mockOpsFeature.featureName, args)

        expect(backendSpecManager.enableFeature).toBeCalled()
        expect(backendSpecManager.enableFeature.mock.calls[0][0]).toBe(mockProjectInfo)
        expect(backendSpecManager.enableFeature.mock.calls[0][1]).toBe(mockOpsFeature.featureName)
        expect(backendSpecManager.enableFeature.mock.calls[0][2]).toBe(false)
    })
    
    test('enable with prompt', () => {
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'enable', '--prompt']
        featureCommand.run(mockOpsFeature.featureName, args)
 
         expect(backendSpecManager.enableFeature).toBeCalled()
         expect(backendSpecManager.enableFeature.mock.calls[0][0]).toBe(mockProjectInfo)
         expect(backendSpecManager.enableFeature.mock.calls[0][1]).toBe(mockOpsFeature.featureName)
         expect(backendSpecManager.enableFeature.mock.calls[0][2]).toBe(true)
     })
     
     test('enable with none existing option', () => {
         const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'enable', '--nonExistingOption']
         featureCommand.run(mockOpsFeature.featureName, args)
  
          expect(backendSpecManager.enableFeature).not.toBeCalled()
    })

    test('disable', () => {
       const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'disable']
       featureCommand.run(mockOpsFeature.featureName, args)

        expect(backendSpecManager.disableFeature).toBeCalled()
        expect(backendSpecManager.disableFeature.mock.calls[0][0]).toBe(mockProjectInfo)
        expect(backendSpecManager.disableFeature.mock.calls[0][1]).toBe(mockOpsFeature.featureName)
    })
    
    test('disable with none existing option', () => {
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'disable', '--nonExistingOption']
        featureCommand.run(mockOpsFeature.featureName, args)

        expect(backendSpecManager.disableFeature).not.toBeCalled()
    })
    
    test('configure', () => {
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'configure']
        featureCommand.run(mockOpsFeature.featureName, args)

        expect(backendSpecManager.configureFeature).toBeCalled()
        expect(backendSpecManager.configureFeature.mock.calls[0][0]).toBe(mockProjectInfo)
        expect(backendSpecManager.configureFeature.mock.calls[0][1]).toBe(mockOpsFeature.featureName)
    })
    
    test('configure with none existing option', () => {
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'configure', '--nonExistingOption']
        featureCommand.run(mockOpsFeature.featureName, args)

        expect(backendSpecManager.configureFeature).not.toBeCalled()
    })
    
    test('feature specific command', () => {
        const featureSpecificCommand = Object.keys(mockOpsFeature.featureCommands)[0]
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, featureSpecificCommand]
        featureCommand.run(mockOpsFeature.featureName, args)

        expect(mockOpsFeature.runCommand).toBeCalled()
        expect(mockOpsFeature.runCommand.mock.calls[0][0]).toBe(featureSpecificCommand)
        expect(mockOpsFeature.runCommand.mock.calls[0][1]).toBe(mockProjectInfo)
        expect(mockOpsFeature.runCommand.mock.calls[0][2]).toBe(args)
    })
    
    test('none existing command', () => {
        const args = ['node', 'awsmobile', mockOpsFeature.featureName, 'nonExistingCommand']
        featureCommand.run(mockOpsFeature.featureName, args)

        expect(mockOpsFeature.runCommand).not.toBeCalled()
    })
})