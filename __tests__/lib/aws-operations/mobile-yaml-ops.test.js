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

const yamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')

describe('project info manager functions', () => {
    const mock_valid_yaml_content = "--- !com.amazonaws.mobilehub.v0.Project\n\
features:\n\
  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic \n\
    components:\n\
      sampleCloudApi: !com.amazonaws.mobilehub.v0.API \n\
        attributes:\n\
          name: sampleCloudApi\n\
          requires-signin: false\n\
        paths:\n\
          /items: !com.amazonaws.mobilehub.v0.Function \n\
            name: sampleLambda\n\
            codeFilename: uploads/sampleLambda.zip\n\
            handler: lambda.handler\n\
            enableCORS: true\n\
            runtime: nodejs6.10\n\
            environment: {}\n\
          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function \n\
            name: sampleLambda\n\
            codeFilename: uploads/sampleLambda.zip\n\
            handler: lambda.handler\n\
            enableCORS: true\n\
            runtime: nodejs6.10\n\
            environment: {}\n\
  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery \n\
    attributes:\n\
      enabled: true\n\
      visibility: public-global\n\
    components:\n\
      release: !com.amazonaws.mobilehub.v0.Bucket {}\n\
  database: !com.amazonaws.mobilehub.v0.Database \n\
    components:\n\
      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase \n\
        tables:\n\
          - !com.amazonaws.mobilehub.v0.NoSQLTable \n\
            attributes:\n\
              email: S\n\
              personName: S\n\
              phone: S\n\
            hashKeyName: teamId\n\
            hashKeyType: S\n\
            rangeKeyName: personId\n\
            rangeKeyType: S\n\
            indexes:\n\
              - !com.amazonaws.mobilehub.v0.NoSQLIndex \n\
                hashKeyName: teamId\n\
                hashKeyType: S\n\
                indexName: personName-index\n\
                rangeKeyName: personName\n\
                rangeKeyType: S\n\
            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable\n\
            tablePrivacy: public\n\
  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint \n\
    components:\n\
      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}\n\
  sign-in: !com.amazonaws.mobilehub.v0.SignIn \n\
    attributes:\n\
      enabled: true\n\
      optional-sign-in: true\n\
    components:\n\
      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider \n\
        attributes:\n\
          alias-attributes:\n\
            - email\n\
            - phone_number\n\
          mfa-configuration: ON\n\
          name: userpool\n\
          password-policy: !com.amazonaws.mobilehub.ConvertibleMap \n\
            min-length: '8'\n\
            require-lower-case: true\n\
            require-numbers: true\n\
            require-symbols: true\n\
            require-upper-case: true\n\
  user-files: !com.amazonaws.mobilehub.v0.UserFiles \n\
    attributes:\n\
      enabled: true\n\
      wildcard-cors-policy: true\n\
name: reactapp-2018-03-23-16-40-04\n\
region: us-east-1"

    const mock_invalid_yaml_content =  "--- !com.amazonaws.mobilehub.v0.Project\n\
    features:\n\
      cloudlogic: !com.amazonaws.mobilehub.v0.UknownClass \n\
      "
    
    const validYamlFilePath = '/validYamlFile.yaml'
    const invalidYamlFilePath = '/invalidYamlFile.yaml'
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[validYamlFilePath] = mock_valid_yaml_content
    MOCK_FILE_INFO[invalidYamlFilePath] = mock_invalid_yaml_content

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('ops on valid yaml', () => {
        let obj = yamlOps.readYamlFileSync(validYamlFilePath)
        yamlOps.writeYamlFileSync(obj, '/filePath')

        expect(obj).toBeDefined()
        expect(fs.writeFileSync).toBeCalled()
    })

    test('ops on valid yaml', () => {
        let obj = yamlOps.readYamlFileSync(invalidYamlFilePath)

        expect(obj).not.toBeDefined()
    })
})