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
jest.mock('ora')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')

const backendRetrieve = require('../../lib/backend-retrieve.js')

const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')

describe('backend retrieve', () => {
    
    const mock_projectInfo = {
        "ProjectName": 'projectName',
        "ProjectPath": '/projectName',
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
        'BackendProjectName': 'BackendProjectName', 
        'BackendProjectID': 'BackendProjectID', 
    }

    const mock_mobileProjectID = 'mock_backend_projectID'

    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }

    const mock_awsDetails = {
        info: null, 
        config: mock_awsConfig
    }

    const mock_describeError = {
        code: 'mockCode'
    }

    const mock_describeResponse = {
        details: {
            name: 'mock_mobileProjectName'
        }
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}

        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsDetails)
        })
        awsExceptionHandler.handleMobileException = jest.fn()
       
        backendInfoManager.syncCurrentBackendInfo = 
        jest.fn((projectInfo, backendDetails, awsConfig, syncToDevFlag, callback) => {
            if(callback){
                callback()
            }
        })
    })

    beforeEach(() => {
        backendInfoManager.syncCurrentBackendInfo.mockClear()
        awsExceptionHandler.handleMobileException.mockClear()
    })

    test('link when api call successful', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(null, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.linkToBackend(mock_projectInfo, mock_mobileProjectID, 1, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(backendInfoManager.syncCurrentBackendInfo).toBeCalled()
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][0]).toBe(mock_projectInfo)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][1]).toBe(mock_describeResponse.details)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][2]).toBe(mock_awsDetails)
        expect(callback).toBeCalled()
    })

    test('link when api call rutnrs error', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(mock_describeError, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.linkToBackend(mock_projectInfo, mock_mobileProjectID, 1, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(awsExceptionHandler.handleMobileException.mock.calls[0][0]).toBe(mock_describeError)
        expect(callback).not.toBeCalled()
    })

    test('pull when api call successful', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(null, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.pullBackend(mock_projectInfo, mock_mobileProjectID, 1, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(backendInfoManager.syncCurrentBackendInfo).toBeCalled()
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][0]).toBe(mock_projectInfo)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][1]).toBe(mock_describeResponse.details)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][2]).toBe(mock_awsDetails)
        expect(callback).toBeCalled()
    })

    test('pull when api call rutnrs error', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(mock_describeError, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.pullBackend(mock_projectInfo, mock_mobileProjectID, 1, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(awsExceptionHandler.handleMobileException.mock.calls[0][0]).toBe(mock_describeError)
        expect(callback).not.toBeCalled()
    })

    test('get when api call successful', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(null, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.getLatestBackendDetails(mock_mobileProjectID, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(callback).toBeCalled()
        expect(callback.mock.calls[0][0]).toBe(mock_describeResponse.details)
    })

    test('get when api call rutnrs error', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            describeProject: jest.fn((param, callback)=>{
                callback(mock_describeError, mock_describeResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendRetrieve.getLatestBackendDetails(mock_mobileProjectID, callback)

        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(awsExceptionHandler.handleMobileException.mock.calls[0][0]).toBe(mock_describeError)
        expect(callback).not.toBeCalled()
    })

    
})
