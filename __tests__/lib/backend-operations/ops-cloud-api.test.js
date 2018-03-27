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
jest.mock('https')
jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')
jest.mock('../../../lib/backend-operations/cloud-api-lambda-builder.js')
jest.mock('../../../lib/aws-operations/aws-client.js')

const fs = require('fs-extra')
const https = require('https')
const featureOps = require('../../../lib/feature-operations/scripts/cloud-api-ops.js')
const lambdaBuilder = require('../../../lib/backend-operations/cloud-api-lambda-builder.js')
const awsClient = require('../../../lib/aws-operations/aws-client.js')

const opsCloudApi = require('../../../lib/backend-operations/ops-cloud-api.js')

describe('ops analytics', () => {
    const mock_projectInfo = {ProjectPath: '/mockProjectPath'}
    const mock_backendProjectSpec = {
        resources:[
            {
                name: 'mockLambdaName',
                type: "AWS::Lambda::Function", 
                feature:  'cloud-api',
                attributes: {
                    region: 'us-east-1',
                    status: 'COMPLETE',
                    configHandlerName: 'handlerName'
                }
            }
        ]
    }
    const mock_lambdaGetFunctionResponse = {
        Code: {
            Location: 'mockcodelocation'
        }
    }


    let mock_lambdaClient = {
        getFunction: jest.fn((param, callback)=>{
            callback(null, mock_lambdaGetFunctionResponse)
        })
    }

    const mock_awsDetails = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}
        lambdaBuilder.build = jest.fn((projectInfo, backendProject, featureName, callback)=>{
            if(callback){
                callback(true)
            }
        })

        awsClient.Lambda = jest.fn(()=>{
            return mock_lambdaClient
        })

        https.get = jest.fn((url, callback)=>{
            
        })
    })

    beforeEach(() => {
        featureOps.specify = undefined
        featureOps.onFeatureTurnOn = undefined
        featureOps.onFeatureTurnOff = undefined
        featureOps.invoke = undefined
        fs.ensureDirSync.mockClear()
    })

    test('property definitions', () => {
        expect(opsCloudApi.featureName).toBeDefined()
        expect(opsCloudApi.featureCommands).toBeDefined()
        expect(opsCloudApi.specify).toBeDefined()
        expect(opsCloudApi.runCommand).toBeDefined()
        expect(opsCloudApi.onFeatureTurnOn).toBeDefined()
        expect(opsCloudApi.onFeatureTurnOff).toBeDefined()
        expect(opsCloudApi.build).toBeDefined()
        expect(opsCloudApi.preBackendUpdate).toBeDefined()
        expect(opsCloudApi.syncCurrentBackendInfo).toBeDefined()
        expect(opsCloudApi.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsCloudApi.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsCloudApi.specify(mock_projectInfo)
        expect(fs.ensureDirSync).toBeCalled()
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsCloudApi.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsCloudApi.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(fs.ensureDirSync).toBeCalled()
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsCloudApi.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsCloudApi.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsCloudApi.hasCommand('commandName')
    })

    test('runCommand', () => {
        featureOps.invoke = jest.fn()
        opsCloudApi.runCommand('non-existing-command')
        opsCloudApi.runCommand('invoke')
        expect(featureOps.invoke).toBeCalled()
    })

    test('build', () => {
        let callback = jest.fn()
        opsCloudApi.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(lambdaBuilder.build).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsCloudApi.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        opsCloudApi.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, null)
        expect(mock_lambdaClient.getFunction).toBeCalled()
        expect(https.get).toBeCalled()
    })
})