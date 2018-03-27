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
jest.mock('opn')
jest.mock('../../../lib/aws-operations/aws-config-info-manager.js')
jest.mock('../../../lib/utils/press-enter-to-continue.js')

const fs = require('fs-extra')
const opn = require('opn')

const inquirer = require('inquirer')
const mockirer = require('mockirer')

const awsConfigFileManager = require('../../../lib/aws-operations/aws-config-info-manager.js')
let pressEnterKeyToContinue = require('../../../lib/utils/press-enter-to-continue.js')

const configNewUser = require('../../../lib/aws-operations/aws-config-new-user.js')

describe('project info manager functions', () => {
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }
    const mock_awsInfo = {
        "AWSConfigFilePath":"mockConfigFilePath"
    }
    const mock_awsDetails = {
        info: mock_awsInfo, 
        config: mock_awsConfig
    }
    const mock_region = 'us-east-1'

    beforeAll(() => {
        global.console = {log: jest.fn()}
        pressEnterKeyToContinue.run = jest.fn((handle)=>{
            return new Promise((resolve, reject)=>{
                resolve(handle)
            })
        })
        mockirer(inquirer, {
            userName: 'mock_userName', 
            region: 'us-east-1',
            accessKeyId: 'newKeyID',
            secretAccessKey: "newKey",
        }) 
        awsConfigFileManager.setNoProfileSync = jest.fn()
        awsConfigFileManager.validateAWSConfig = jest.fn(()=>{return true})
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('setupNewUser', () => {
        let callback = jest.fn()
        return configNewUser.setupNewUser(mock_awsDetails, callback).then(() => {
            expect(callback).toBeCalled()
        })
    })
})