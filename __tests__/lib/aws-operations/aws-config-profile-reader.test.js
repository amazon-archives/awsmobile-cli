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
jest.mock('n-readlines')
jest.mock('../../../lib/utils/awsmobilejs-path-manager.js')
const fs = require('fs-extra')
const lineByLine = require('n-readlines')
const os = require('os')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const configProfileReader = require('../../../lib/aws-operations/aws-config-profile-reader.js')


describe('aws-config-profile-reader', () => {
    const mock_config_content_lines = [
        '[default]',
        'region = us-east-1',
        ' ',
        '[profile profile1]',
        'region = us-east-2',
        ' ',
        '[profile profile2]',
        'region = us-west-2',
    ]

    const mock_credentials_content_lines = [
        '[default]',
        'aws_access_key_id = accesskeyid',
        'aws_secret_access_key = accesskey',
        ' ',
        '[profile1]',
        'aws_access_key_id = profile1accesskeyid',
        'aws_secret_access_key = profile1accesskey',
        ' ',
        '[profile3]',
        'aws_access_key_id = profile3accesskeyid',
        'aws_secret_access_key = profile1accesskey',
    ]
    
    const awsConfigFilePath = '~/.aws/config'
    const awsCredentialsFilePath = '~/.aws/credentials'
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[awsConfigFilePath] = mock_config_content_lines.join(os.EOL)
    MOCK_FILE_INFO[awsCredentialsFilePath] = mock_credentials_content_lines.join(os.EOL)

    let configLineIndex = 0
    let credentialsLineIndex = 0

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getSysAwsConfigFilePath = jest.fn(()=>{
            return awsConfigFilePath
        })
        pathManager.getSysAwsCredentialsFilePath = jest.fn(()=>{
            return awsCredentialsFilePath
        })
        lineByLine.mockImplementation((filePath) => {
            let result = {}
            if(filePath == awsConfigFilePath){
                result.next = jest.fn(()=>{
                    if(configLineIndex < mock_config_content_lines.length){
                        return mock_config_content_lines[configLineIndex++]
                    }else{
                        return undefined
                    }
                })
            }else if(filePath == awsCredentialsFilePath){
                result.next = jest.fn(()=>{
                    if(credentialsLineIndex < mock_credentials_content_lines.length){
                        return mock_credentials_content_lines[credentialsLineIndex++]
                    }else{
                        return undefined
                    }
                })
            }
            return result
        })
    })

    beforeEach(() => {
        configLineIndex = 0
        credentialsLineIndex = 0
        fs.writeFileSync.mockClear()
    })

    test('getSystemConfig profile exists', () => {
        let sysConfig = configProfileReader.getSystemConfig('profile1')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).toBeDefined()
    })

    test('getSystemConfig profile not exists', () => {
        let sysConfig = configProfileReader.getSystemConfig('non-existing-profile')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig profile not exists in config', () => {
        let sysConfig = configProfileReader.getSystemConfig('profile2')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig profile not exists in credentials', () => {
        let sysConfig = configProfileReader.getSystemConfig('profile3')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig aws config file not exist', () => {
        fs.__setMockFiles({
            awsCredentialsFilePath: mock_credentials_content_lines.join(os.EOL)
        }) 
        let sysConfig = configProfileReader.getSystemConfig('profile1')
        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig aws credentials file not exist', () => {
        fs.__setMockFiles({
            awsConfigFilePath: mock_config_content_lines.join(os.EOL)
        }) 
        let sysConfig = configProfileReader.getSystemConfig('profile1')
        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })
})