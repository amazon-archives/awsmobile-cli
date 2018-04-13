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
jest.mock('../../../lib/project-info-manager.js')
jest.mock('../../../lib/aws-operations/aws-config-profile-reader.js')

const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')


const awsMobileRegions = require('../../../lib/aws-operations/aws-regions.js').regions
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const nameManager = require('../../../lib/utils/awsmobilejs-name-manager.js')

const projectInfoManager = require('../../../lib/project-info-manager.js')
const awsConfigProfileReader = require('../../../lib/aws-operations/aws-config-profile-reader.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const configInfoManager = require('../../../lib/aws-operations/aws-config-info-manager.js')


describe('aws-config-info-manager', () => {
   
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
    
    const mock_awsDetails_general = {
        info: mock_awsInfo_general, 
        config: mock_awsConfig_general
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
    })

    beforeEach(() => {
        projectInfoManager.getProjectInfo = jest.fn((silentFlag)=>{
            return mock_projectInfo
        })
        fs.writeFileSync.mockClear()
    })

    test('resolve project config', () => {
        let result = configInfoManager.resolve(true)
        console.log(result)
        expect(result).toBeDefined() 
    })

    test('resolve general config', () => {
        projectInfoManager.getProjectInfo = jest.fn((silentFlag)=>{
            return undefined
        })
        let result = configInfoManager.resolve(true)
        console.log(result)
        expect(result).toBeDefined() 
    })

    test('setProfile', () => {
        let result = configInfoManager.setProfile('profile1')
        expect(fs.writeFileSync).toBeCalled()
        expect(result).toBeTruthy() 
    })

    test('setNoProfileSync', () => {
        let mock_awsInfo_0 = {
            "IsUsingProfile": true,
            "ProfileName": "default",
            "AWSConfigFilePath": awsConfigFilePath_project,
            "AWSInfoFilePath": awsInfoFilePath_project,
            "LastProfileSyncTime": "2018-01-01-01-01-01"
        }
        let result = configInfoManager.setNoProfileSync(mock_awsInfo_0)
        expect(fs.writeFileSync).toBeCalled()
        expect(mock_awsInfo_0.IsUsingProfile).toBeFalsy() //awsInfo is changed by method
    })

    test('validateAWSConfig', () => {
        let result = configInfoManager.validateAWSConfig(mock_awsConfig_project)
        expect(result).toBeDefined()
        expect(result).toBeTruthy()
    })

    test('isNewUser', () => {
        let result = configInfoManager.isNewUser()
        expect(result).toBeDefined()
        expect(result).toBeTruthy() //because no system credentials or config file mocked
    })
})