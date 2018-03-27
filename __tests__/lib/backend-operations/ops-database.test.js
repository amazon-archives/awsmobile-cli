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
jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/database-ops.js')

const opsDatabase = require('../../../lib/backend-operations/ops-database.js')

describe('ops analytics', () => {
    const mock_projectInfo = {}
    const mock_backendProjectSpec = {}
    const mock_awsDetails = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}
    })

    beforeEach(() => {
        featureOps.specify = undefined
        featureOps.onFeatureTurnOn = undefined
        featureOps.onFeatureTurnOff = undefined
    })

    test('property definitions', () => {
        expect(opsDatabase.featureName).toBeDefined()
        expect(opsDatabase.featureCommands).toBeDefined()
        expect(opsDatabase.specify).toBeDefined()
        expect(opsDatabase.runCommand).toBeDefined()
        expect(opsDatabase.onFeatureTurnOn).toBeDefined()
        expect(opsDatabase.onFeatureTurnOff).toBeDefined()
        expect(opsDatabase.build).toBeDefined()
        expect(opsDatabase.preBackendUpdate).toBeDefined()
        expect(opsDatabase.syncCurrentBackendInfo).toBeDefined()
        expect(opsDatabase.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsDatabase.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsDatabase.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsDatabase.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsDatabase.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsDatabase.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsDatabase.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsDatabase.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsDatabase.runCommand('commandName')
    })

    test('build', () => {
        let callback = jest.fn()
        opsDatabase.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsDatabase.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsDatabase.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })
})