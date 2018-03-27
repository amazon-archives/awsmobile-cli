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
jest.mock('aws-sdk')
jest.mock('../../../lib/utils/cli-config-manager.js')

const AWS = require('aws-sdk')
const cliConfigManager = require('../../../lib/utils/cli-config-manager.js')

const awsClient = require('../../../lib/aws-operations/aws-client.js')

describe('aws-clients', () => {
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

    AWS.config.loadFromPath = jest.fn()
    AWS.config.update = jest.fn()
    AWS.config.update = jest.fn()
    AWS.S3 = jest.fn(()=>{ return {}})
    AWS.Mobile = jest.fn(()=>{ return {}})
    AWS.Lambda = jest.fn(()=>{ return {}})
    AWS.CloudFront = jest.fn(()=>{ return {}})
    
    test('clients defined', () => {
        let cloudFrontClient = awsClient.CloudFront(mock_awsDetails)
        let lambdaClient = awsClient.Lambda(mock_awsDetails, mock_region)
        let mobileClient = awsClient.Mobile(mock_awsDetails)
        let s3Client = awsClient.S3(mock_awsDetails, mock_region)

        expect(cloudFrontClient).toBeDefined()
        expect(lambdaClient).toBeDefined()
        expect(mobileClient).toBeDefined()
        expect(s3Client).toBeDefined()
    })
})
