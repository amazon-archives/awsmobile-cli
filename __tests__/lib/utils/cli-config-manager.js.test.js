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
jest.mock('../../../lib/utils/awsmobilejs-path-manager.js')

const fs = require('fs-extra')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const cliConfigManager = require('../../../lib/utils/cli-config-manager.js')

describe('project info manager functions', () => {
    const mockCliConfigFilePath = '/cli-config-file.json'
    const mockCliConfig =
    {
        "isInDevMode": true,
        "awsmobileAPIEndpoint": "mock_awsmobileAPIEndpoint",
        "deviceFarmTestUrl": "mock_deviceFarmTestUrl"
    }

    test('good config', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = JSON.stringify(mockCliConfig, null, '\t')
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return mockCliConfigFilePath
        })

        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).toBeDefined()
    })

    test('config file mis-format', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = 'miss-formatted json file'
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return mockCliConfigFilePath
        })
        
        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).not.toBeDefined()
    })

    test('config file missing', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = JSON.stringify(mockCliConfig, null, '\t')
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return '/none-existing.json'
        })
        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).not.toBeDefined()
    })
})