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
const path = require('path')
const mockirer = require('mockirer')
const inquirer = require('inquirer')

const projectInfoManager = require('../../lib/project-info-manager.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')

describe('project info manager functions', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {}
    const mock_projectConfig = {}
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    const mock_srcDir = '/src'
    const mock_distDir = '/dist'
    const mock_buildCommand = 'npm run build'
    const mock_startCommand = 'npm run start'

    const mock_backendProjectDetails = {
            "name": "mockappname",
            "projectId": "mock_project_id",
            "region": "us-east-1",
            "state": "NORMAL",
            "createdDate": "2018-03-23T23:40:04.502Z",
            "lastUpdatedDate": "2018-03-23T23:56:32.789Z",
            "consoleUrl": "https://console.aws.amazon.com/mobilehub/home#/mock_project_id/build",
            "resources": [
                {
                    "type": "AWS::S3::Bucket",
                    "name": "mockappname-userfiles-mobilehub-mock_id",
                    "arn": null,
                    "feature": "user-data",
                    "attributes": {
                        "lastUpdateRequestID": "mock_request_id",
                        "region": "us-east-1",
                        "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-userfiles-mobilehub-mock_id"
                    }
                },
                {
                    "type": "AWS::IAM::Policy",
                    "name": "mockappname_userfiles_MOBILEHUB_mock_id",
                    "arn": null,
                    "feature": "user-data",
                    "attributes": {
                        "authType": "unauthenticated",
                        "lastUpdateRequestID": "mock_request_id",
                        "role": "mockappname_unauth_MOBILEHUB_mock_id"
                    }
                },
                {
                    "type": "AWS::Cognito::IdentityPool",
                    "name": "mockappname_MOBILEHUB_mock_id",
                    "arn": "us-east-1:mock_arn_id",
                    "feature": "user-signin",
                    "attributes": {
                        "lastUpdateRequestID": "mock_request_id",
                        "poolid": "us-east-1:mock_arn_id",
                        "roleARNs": "arn:aws:iam::mockaccountnumber:role/mockappname_unauth_MOBILEHUB_mock_id"
                    }
                },
                {
                    "type": "AWS::IAM::Role",
                    "name": "mockappname_unauth_MOBILEHUB_mock_id",
                    "arn": "arn:aws:iam::mockaccountnumber:role/mockappname_unauth_MOBILEHUB_mock_id",
                    "feature": "user-signin",
                    "attributes": {
                        "authType": "unauthenticated",
                        "lastUpdateRequestID": "mock_request_id"
                    }
                },
                {
                    "type": "AWS::Pinpoint::AnalyticsApplication",
                    "name": "mockappname20180323164004_MobileHub",
                    "arn": "mock_arn",
                    "feature": "analytics",
                    "attributes": {
                        "lastUpdateRequestID": "mock_request_id"
                    }
                },
                {
                    "type": "AWS::IAM::Policy",
                    "name": "mockappname_mobileanalytics_MOBILEHUB_mock_id",
                    "arn": null,
                    "feature": "analytics",
                    "attributes": {
                        "authType": "unauthenticated",
                        "lastUpdateRequestID": "mock_request_id",
                        "role": "mockappname_unauth_MOBILEHUB_mock_id"
                    }
                },
                {
                    "type": "AWS::IAM::Policy",
                    "name": "mockappname_userprofiles_MOBILEHUB_mock_id",
                    "arn": null,
                    "feature": "user-data",
                    "attributes": {
                        "authType": "unauthenticated",
                        "lastUpdateRequestID": "mock_request_id",
                        "role": "mockappname_unauth_MOBILEHUB_mock_id"
                    }
                },
                {
                    "type": "AWS::S3::Bucket",
                    "name": "mockappname-hosting-mobilehub-mock_id",
                    "arn": null,
                    "feature": "hosting",
                    "attributes": {
                        "lastUpdateRequestID": "mock_request_id",
                        "region": "us-east-1",
                        "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-hosting-mobilehub-mock_id",
                        "s3-bucket-website-url": "https://s3.amazonaws.com/mockappname-hosting-mobilehub-mock_id"
                    }
                },
                {
                    "type": "AWS::CloudFront::Distribution",
                    "name": "d1pwacowmw2me2.cloudfront.net",
                    "arn": null,
                    "feature": "hosting",
                    "attributes": {
                        "id": "E79VBAWVFP7BV",
                        "lastUpdateRequestID": "mock_request_id"
                    }
                },
                {
                    "type": "AWS::IAM::Policy",
                    "name": "mockappname_hosting_MOBILEHUB_mock_id",
                    "arn": null,
                    "feature": "hosting",
                    "attributes": {
                        "authType": "unauthenticated",
                        "lastUpdateRequestID": "mock_request_id",
                        "role": "mockappname_unauth_MOBILEHUB_mock_id"
                    }
                },
                {
                    "type": "AWS::S3::Bucket",
                    "name": "mockappname-deployments-mobilehub-mock_id",
                    "arn": null,
                    "feature": "common",
                    "attributes": {
                        "region": "us-east-1",
                        "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-deployments-mobilehub-mock_id"
                    }
                },
                {
                    "type": "AWS::CloudFormation::Stack",
                    "name": "Development",
                    "arn": null,
                    "feature": "cloud-api",
                    "attributes": {
                        "primary": "true",
                        "region": "us-east-1",
                        "stateSummary": "NOT_YET_DEPLOYED"
                    }
                }
            ]
        }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        fs.__setMockFiles(MOCK_FILE_INFO) 
        mockirer(inquirer, {
            srcDir: mock_srcDir, 
            distDir: mock_distDir,
            buildCommand: mock_buildCommand,
            startCommand: mock_startCommand
        }) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('initialize', () => {
        projectInfoManager.initialize(projectPath)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })

    test('configureProject', () => {
       // process.cwd = jest.fn(()=>{ return projectPath })
        const callback = jest.fn()
        projectInfoManager.configureProject(callback)

        expect(callback).toBeCalled()
        expect(callback.mock.calls[0][1].SourceDir).toBe(mock_srcDir)
        expect(callback.mock.calls[0][1].DistributionDir).toBe(mock_distDir)
        expect(callback.mock.calls[0][1].BuildCommand).toBe(mock_buildCommand)
        expect(callback.mock.calls[0][1].StartCommand).toBe(mock_startCommand)
    })

    test('getProjectInfo', () => {
        //process.cwd = jest.fn(()=>{ return projectPath })
      
        const projectInfo = projectInfoManager.getProjectInfo()

        expect(projectInfo.ProjectPath).toBe(projectPath)
     })


    test('setProjectInfo', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })
        
        const projectInfo = projectInfoManager.setProjectInfo(mock_projectInfo)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })

    test('updateBackendProjectDetails', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })
        
        let projectInfo = projectInfoManager.updateBackendProjectDetails(mock_projectInfo, mock_backendProjectDetails)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
        expect(projectInfo.BackendProjectID).toEqual(mock_backendProjectDetails.projectId)
    })
    
    test('onClearBackend', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })

        projectInfoManager.onClearBackend(mock_projectInfo)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })
})