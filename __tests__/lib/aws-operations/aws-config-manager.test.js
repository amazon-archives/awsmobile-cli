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
jest.mock('../../../lib/aws-operations/aws-config-info-manager.js')
jest.mock('../../../lib/aws-operations/aws-config-new-user.js')

const fs = require('fs-extra')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const path = require('path')
const projectInfoManager = require('../../../lib/project-info-manager.js')
const awsConfigProfileReader = require('../../../lib/aws-operations/aws-config-profile-reader.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')

const awsConfigInfoManager = require('../../../lib/aws-operations/aws-config-info-manager.js')
const newUserHelper = require('../../../lib/aws-operations/aws-config-new-user.js')

const configManager = require('../../../lib/aws-operations/aws-config-manager.js')

describe('aws-config-manager', () => {
   
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)

    let awsInfoFilePath_project = pathManager.getAWSInfoFilePath(projectPath)
    let awsConfigFilePath_project = '~/.awsmobilejs/project-aws-config/projectName-randomString'
    let awsInfoFilePath_general = '~/.awsmobilejs/aws-info.json'
    let awsConfigFilePath_general = '~/.awsmobilejs/aws-config.json'
    
    const mock_projectInfo = {
        ProjectName: projectName,
        ProjectPath: projectPath
    }

    const mock_awsConfig_default = {
        "accessKeyId":"mockAccessKeyID1-default",
        "secretAccessKey":"mockSecretAccessKey1-default",
        "region": 'us-east-1'
    }

    const mock_awsConfig_profile1 = {
        "accessKeyId":"mockAccessKeyID1-profile1",
        "secretAccessKey":"mockSecretAccessKey1-profile1",
        "region": 'us-west-1'
    }

    const mock_awsConfig_project = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": 'us-east-1'
    }

    const mock_awsInfo_project = {
        "IsUsingProfile": false,
        "ProfileName": 'default',
        "AWSConfigFilePath": awsConfigFilePath_project,
        "AWSInfoFilePath": awsInfoFilePath_project,
        "LastProfileSyncTime": "2018-01-01-01-01-01"
    }

    const mock_awsDetails_project = {
        info: mock_awsInfo_project, 
        config: mock_awsConfig_project
    }

    const mock_awsConfig_general = {
        "accessKeyId":"mockAccessKeyID-general",
        "secretAccessKey":"mockSecretAccessKey-general",
        "region": 'us-east-1'
    }

    const mock_awsInfo_general = {
        "IsUsingProfile": false,
        "ProfileName": 'default',
        "AWSConfigFilePath": awsConfigFilePath_general,
        "AWSInfoFilePath": awsInfoFilePath_general,
        "LastProfileSyncTime": "2018-01-01-01-01-01"
    }

    const mock_awsConfig_invalid = {
        "accessKeyId": awsmobilejsConstant.DefaultAWSAccessKeyId,
        "secretAccessKey": awsmobilejsConstant.DefaultAWSSecretAccessKey,
        "region": 'non-existing-region'
    }

    const mock_awsInfo_invalid = {
        "IsUsingProfile": false,
        "ProfileName": "",
        "AWSConfigFilePath": "",
        "AWSInfoFilePath": "",
        "LastProfileSyncTime": "2018-01-01-01-01-01"
    }
    
    const mock_awsDetails_general = {
        info: mock_awsInfo_general, 
        config: mock_awsConfig_general
    }

    const mock_awsDetails_invalid = {
        info: mock_awsInfo_invalid, 
        config: mock_awsConfig_invalid
    }

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[awsInfoFilePath_project] = JSON.stringify(mock_awsInfo_project, null, '\t')
    MOCK_FILE_INFO[awsConfigFilePath_project] = JSON.stringify(mock_awsConfig_project, null, '\t')
    MOCK_FILE_INFO[awsInfoFilePath_general] = JSON.stringify(mock_awsInfo_general, null, '\t')
    MOCK_FILE_INFO[awsConfigFilePath_general] = JSON.stringify(mock_awsConfig_general, null, '\t')
    
    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        awsConfigProfileReader.getSystemConfig = jest.fn((profileName)=>{
            let result = mock_awsConfig_default
            if(profileName !='default'){
                result = mock_awsConfig_profile1
            }
            return result
        })
        awsConfigInfoManager.validateAWSConfig = jest.fn((awsConfig)=>{
            return true
        })
        awsConfigInfoManager.setNoProfileSync = jest.fn()
        awsConfigInfoManager.setProfile = jest.fn()
        mockirer(inquirer, {
            configureAWS: true, 
            accessKeyId: mock_awsConfig_general.accessKeyId,
            secretAccessKey: mock_awsConfig_general.secretAccessKey,
            region: mock_awsConfig_general.region
        }) 
    })

    beforeEach(() => {
        projectInfoManager.getProjectInfo = jest.fn((silentFlag)=>{
            return mock_projectInfo
        })
        awsConfigInfoManager.resolve = jest.fn(()=>{
            return mock_awsInfo_project
        })
        fs.writeFileSync.mockClear()
        awsConfigInfoManager.setProfile.mockClear()
        awsConfigInfoManager.setNoProfileSync.mockClear()
    })

    test('checkAWSConfig valid config exists', () => {
        let callback = jest.fn()
        configManager.checkAWSConfig(callback)

        expect(awsConfigInfoManager.resolve).toBeCalled() 
        expect(callback).toBeCalled()  
    })

    test('checkAWSConfig no valid config exists, not new user', () => {

        awsConfigInfoManager.resolve = jest.fn(()=>{
            return mock_awsInfo_invalid
        })
        awsConfigInfoManager.validateAWSConfig = jest.fn((awsConfig)=>{
            return false
        })
        awsConfigInfoManager.isNewUser = jest.fn((awsDetails)=>{
            return false
        })

        let callback = jest.fn()
        configManager.checkAWSConfig(callback)

        expect(awsConfigInfoManager.resolve).toBeCalled() 
        expect(callback).not.toBeCalled()  
    })

    test('checkAWSConfig no valid config exists, new user', () => {
        
        awsConfigInfoManager.resolve = jest.fn(()=>{
            return mock_awsInfo_invalid
        })
        awsConfigInfoManager.validateAWSConfig = jest.fn((awsConfig)=>{
            return false
        })
        awsConfigInfoManager.isNewUser = jest.fn((awsDetails)=>{
            return true
        })
        let callback = jest.fn()
        configManager.checkAWSConfig(callback)

        expect(awsConfigInfoManager.resolve).toBeCalled() 
        expect(callback).not.toBeCalled()  
    })

    test('configureAWS', () => {
        configManager.configureAWS()
        expect(awsConfigInfoManager.setProfile).not.toBeCalled() 
        expect(awsConfigInfoManager.setNoProfileSync).toBeCalled() 
    })

    test('configureAWS with profile', () => {
        configManager.configureAWS('profile1')
        expect(awsConfigInfoManager.setProfile).toBeCalled() 
        expect(awsConfigInfoManager.setNoProfileSync).not.toBeCalled() 
    })

    test('configureWithKeyAndRegion', () => {
        configManager.configureWithKeyAndRegion(mock_awsConfig_default.accessKeyId, mock_awsConfig_default.secretAccessKey, mock_awsConfig_default.region)
        
        expect(awsConfigInfoManager.resolve).toBeCalled() 
        expect(awsConfigInfoManager.setNoProfileSync).toBeCalled() 
    })

    test('newUserSetup, setup needed', () => {
        configManager.newUserSetup()
        expect(awsConfigInfoManager.resolve).toBeCalled() 
    })

    test('newUserSetup, no setup needed', () => {
        awsConfigInfoManager.resolve = jest.fn(()=>{
            return mock_awsInfo_invalid
        })
        configManager.newUserSetup()
        expect(awsConfigInfoManager.resolve).toBeCalled() 
    })

    test('listAWSConfig', () => {
        configManager.listAWSConfig()
        expect(awsConfigInfoManager.resolve).toBeCalled() 
    })
})