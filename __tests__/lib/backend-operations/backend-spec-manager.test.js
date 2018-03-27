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
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const opsUserSignin = require('../../../lib/backend-operations/ops-user-signin.js')
const backendFeatures = require('../../../lib/aws-operations/mobile-features.js')
const awsMobileYamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const objOps = require('../../../lib/utils/object-ops.js')
const featureYmalNameMapping = require('../../../lib/utils/feature-yaml-name-mapping.js')

const backendSpecManager = require('../../../lib/backend-operations/backend-spec-manager.js')

describe('backend-spec-manager', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {
        ProjectPath: projectPath
    }
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

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = mock_valid_yaml_content


    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        mockirer(inquirer, {
            disableFeatures: true
        }) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('listEnabledFeatures', () => {
        backendSpecManager.listEnabledFeatures(mock_projectInfo)
    })

    test('listAllFeatures', () => {
        backendSpecManager.listAllFeatures(mock_projectInfo)
    })

    test('getEnableFeatures', () => {
        let enabledFeatures = backendSpecManager.getEnabledFeatures(mock_projectInfo)
        expect(enabledFeatures).toBeDefined()
    })

    test('updataFeatureList', () => {
        let oldFeatures = ['analytics', 'cloud-api', 'database', 'hosting', 'user-files']
        let newFeatures = ['cloud-api', 'database', 'hosting', 'user-files', 'user-signin']
        backendSpecManager.updataFeatureList(mock_projectInfo, oldFeatures, newFeatures)
    })
    
})
