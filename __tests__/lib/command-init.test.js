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
jest.mock('../../lib/init-steps/s1-analyze-project.js')
jest.mock('../../lib/init-steps/s2-choose-strategy.js')
jest.mock('../../lib/init-steps/s3-initialize.js')
jest.mock('../../lib/init-steps/s4-configure.js')
jest.mock('../../lib/init-steps/s5-setup-backend.js')
jest.mock('../../lib/init-steps/s60-on-success.js')
jest.mock('../../lib/init-steps/s61-on-failure.js')

const analyzeProject = require('../../lib/init-steps/s1-analyze-project.js')
const chooseStrategy = require('../../lib/init-steps/s2-choose-strategy.js')
const initialize = require('../../lib/init-steps/s3-initialize.js')
const configure = require('../../lib/init-steps/s4-configure.js')
const setupBackend = require('../../lib/init-steps/s5-setup-backend.js')
const onSuccess = require('../../lib/init-steps/s60-on-success.js')
const onFailure = require('../../lib/init-steps/s61-on-failure.js')

const commandInit = require('../../lib/command-init.js')

describe('command init', () => {

    const mockInitInfo = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}

        analyzeProject.run = jest.fn((projectPath, mobileProjectID)=>{
            console.log(projectPath)
            console.log(mobileProjectID)
            return new Promise((resolve, reject)=>{
                console.log('call resolve')
                resolve(mockInitInfo)
            }) 
        })
        chooseStrategy.run = jest.fn((initInfo)=>{
            return initInfo
        })
        initialize.run = jest.fn((initInfo)=>{
            return initInfo
        })
        configure.run = jest.fn((initInfo)=>{
            return initInfo
        })
        setupBackend.run = jest.fn((initInfo)=>{
            return initInfo
        })
        onSuccess.run = jest.fn((initInfo)=>{
            console.log('success')
        })
        onFailure.run = jest.fn((e)=>{
            console.log('exception')
        })
    })

    beforeEach(() => {
        analyzeProject.run.mockClear()
        chooseStrategy.run.mockClear()
        initialize.run.mockClear()
        configure.run.mockClear()
        setupBackend.run.mockClear()
        onSuccess.run.mockClear()
        onFailure.run.mockClear()
    })

    test('init succeeds', () => {
        return commandInit.init('mobileProjectID', true).then(() => {
            expect(analyzeProject.run).toBeCalled()
            expect(chooseStrategy.run).toBeCalled()
            expect(initialize.run).toBeCalled()
            expect(configure.run).toBeCalled()
            expect(setupBackend.run).toBeCalled()
            expect(onSuccess.run).toBeCalled()
            expect(onFailure.run).not.toBeCalled()
        })
    })

    test('init fails', () => {

        setupBackend.run = jest.fn((initInfo)=>{
            throw new Error()
        })

        return commandInit.init('mobileProjectID', true).then(() => {
            expect(analyzeProject.run).toBeCalled()
            expect(chooseStrategy.run).toBeCalled()
            expect(initialize.run).toBeCalled()
            expect(configure.run).toBeCalled()
            expect(setupBackend.run).toBeCalled()
            expect(onSuccess.run).not.toBeCalled()
            expect(onFailure.run).toBeCalled()
        })
    })

})