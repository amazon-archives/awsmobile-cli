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
jest.mock('../../lib/backend-update.js')
jest.mock('../../lib/project-info-manager.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')

const inquirer = require('inquirer')
const mockirer = require('mockirer')

const backendImport = require('../../lib/backend-import.js')

const backendUpdate = require('../../lib/backend-update.js')
const projectInfoManager = require('../../lib/project-info-manager.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')

describe('backend import', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {
        "ProjectName": "",
        "ProjectPath": projectPath,
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
        'BackendProjectName': 'BackendProjectName', 
        'BackendProjectID': 'BackendProjectID', 
    }
    
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }

    const mock_awsDetails = {
        info: null, 
        config: mock_awsConfig
    }

    const mock_mobileProjectName = 'mock_mobileProjectName'

    const mock_createError = {
        code: 'mockCode'
    }

    const mock_createResponse = {
        details: {
            name: mock_mobileProjectName
        }
    }

    const mock_callback = jest.fn()

    beforeAll(() => {
        global.console = {log: jest.fn()}

        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsDetails)
        })

        projectInfoManager.updateBackendProjectDetails = jest.fn((projectInfo, backendDetails)=>{
            return projectInfo
        })
        
        backendUpdate.updateBackend = jest.fn((projectInfo, backendDetails, awsDetails, syncToDevFlag, callback)=>{
            if(callback){
                callback()
            }
        })

        awsExceptionHandler.handleMobileException = jest.fn()

        mockirer(inquirer, {
            mobileProjectName: mock_mobileProjectName
        }) 
    })

    beforeEach(() => {
        backendUpdate.updateBackend.mockClear()
        projectInfoManager.updateBackendProjectDetails.mockClear()
        awsExceptionHandler.handleMobileException.mockClear()
        mock_callback.mockClear()
    })

    test('when createProject api call successful', () => {
        const mock_mobileClient = {
            createProject: jest.fn((param, callback)=>{
                callback(null, mock_createResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })


        backendImport.run(mock_projectInfo, {yesFlag: false}, mock_callback)

        expect(mock_mobileClient.createProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).not.toBeCalled()
        expect(projectInfoManager.updateBackendProjectDetails).toBeCalled()
        expect(backendUpdate.updateBackend).toBeCalled()
    })

    test('when createProject api call rutnrs error', () => {
        const mock_mobileClient = {
            createProject: jest.fn((param, callback)=>{
                callback(mock_createError, mock_createResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })


        backendImport.run(mock_projectInfo, {yesFlag: false}, mock_callback)

        expect(mock_mobileClient.createProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(projectInfoManager.updateBackendProjectDetails).not.toBeCalled()
        expect(backendUpdate.updateBackend).not.toBeCalled()
    })
})
