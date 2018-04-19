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
const awsMobileRegions = require('../../../lib/aws-operations/aws-regions.js').regions
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')

const appsyncManager = require('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

const appsyncOps = require('../../../lib/feature-operations/scripts/appsync-ops.js')


const _featureName = 'appsync'

const AUTH_TYPES = [ 
  "AWS_IAM", 
  "API_KEY", 
  "AMAZON_COGNITO_USER_POOLS"
]

const DEFAULT_ACTIONS = [
  "ALLOW",
  "DENY"
]

describe('backend delete', () => {
    const mock_project_path = '../../../_mocks_/mock_project'; 
    let projectInfoFilePath = pathManager.getProjectInfoFilePath(mock_project_path)
    let mock_projectInfo = dfOps.readJsonFile(projectInfoFilePath)
    let mock_cloudProjectSpec = {}

    beforeAll(() => {
        // global.console = {log: jest.fn()}
    })

    beforeEach(() => {
    })

    test('interface method defined', () => {
        expect(appsyncOps.specify).toBeDefined()
        expect(appsyncOps.onFeatureTurnOn).toBeDefined()
        expect(appsyncOps.onFeatureTurnOff).toBeDefined()
    })

    test('specify', () => {
        console.log(projectInfoFilePath)
        console.log(mock_projectInfo)
    })

    test('onFeatureTurnOn', () => {
        appsyncOps.onFeatureTurnOn(mock_projectInfo, mock_cloudProjectSpec)
    })

    test('onFeatureTurnOff', () => {
        appsyncOps.onFeatureTurnOff(mock_projectInfo, mock_cloudProjectSpec)
    })
})
