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
jest.mock('../../../lib/feature-operations/scripts/appsync-ops.js')
jest.mock('../../../lib/aws-operations/aws-client.js')
jest.mock('../../../lib//project-info-manager.js')
jest.mock('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-create.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-retrieve.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-update.js')
jest.mock('../../../lib/backend-operations/appsync-operations/ops-appsync-delete.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-dataSources.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi.js')
jest.mock('../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')

// jest.mock('../../../lib/utils/awsmobilejs-constant.js')
// jest.mock('../../../lib/utils/directory-file-ops.js')

const fs = require('fs-extra')
const opn = require('opn')
const featureOps = require('../../../lib/feature-operations/scripts/appsync-ops.js')
const awsClient = require('../../../lib/aws-operations/aws-client.js')

const projectInfoManager = require('../../../lib//project-info-manager.js')
const appsyncManager = require('../../../lib/backend-operations/appsync-operations/appsync-manager.js')
const appsyncCreate = require('../../../lib/backend-operations/appsync-operations/ops-appsync-create.js')
const appsyncRetrieve = require('../../../lib/backend-operations/appsync-operations/ops-appsync-retrieve.js')
const appsyncUpdate = require('../../../lib/backend-operations/appsync-operations/ops-appsync-update.js')
const appsyncDelete = require('../../../lib/backend-operations/appsync-operations/ops-appsync-delete.js')
const apiKeysHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-apiKeys.js')
const dataSourceHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-dataSources.js')
const graphqlHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-graphqlApi.js')
const resolversHelper = require('../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

const opsAppSync = require('../../../lib/backend-operations/ops-appsync.js')

describe('ops appsync', () => {
    const mock_projectInfo = {ProjectPath: '/mockProjectPath'}
    const mock_appsyncInfo = {
        "apiId": "rppp6qwzbnb7piwvkijjtbzql4",
        "region": "us-east-1",
        "name": "r2-2018-04-12-12-14-53",
        "graphqlEndpoint": "https://gboizqo7frh6vbfsf4rhvmchge.appsync-api.us-east-1.amazonaws.com/graphql",
        "authenticationType": "AMAZON_COGNITO_USER_POOLS",
        "creationTime": "2018-04-12-13-35-30",
        "lastUpdateTime": "2018-04-12-13-35-30",
        "lastSyncTime": "2018-04-12-13-58-50",
        "lastPushSuccessful": true,
        "AppSyncConsoleUrl": "https://console.aws.amazon.com/appsync/home?region=us-east-1#/rppp6qwzbnb7piwvkijjtbzql4/v1/home",
        "lastSyncToDevTime": "2018-04-12-13-58-54",
        "apiKey": "da2-d35lzhj6efbxbbllh6pmgujsfa"
    }

    const mock_backendProjectSpec = {
        resources:[
        ]
    }

    let mock_appsyncClient = {
        getFunction: jest.fn((param, callback)=>{
            if(callback){
                callback()
            }
        })
    }

    const mock_awsDetails = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}
        awsClient.AppSync = jest.fn(()=>{
            return mock_appsyncClient
        })
        appsyncManager.getAppSyncInfo = jest.fn((projectPath)=>{
            return mock_appsyncInfo
        })
        appsyncManager.enable = jest.fn()
        appsyncManager.disable = jest.fn()
        appsyncRetrieve.run = jest.fn((projectInfo, awsDetails)=>{
            return new Promise((resolve, reject)=>{
                resolve()
            })
        })
    })
   
    beforeEach(() => {
        featureOps.specify = undefined
        featureOps.onFeatureTurnOn = undefined
        featureOps.onFeatureTurnOff = undefined
        fs.ensureDirSync.mockClear()
    })

    test('property definitions', () => {
        expect(opsAppSync.featureName).toBeDefined()
        expect(opsAppSync.featureCommands).toBeDefined()
        expect(opsAppSync.specify).toBeDefined()
        expect(opsAppSync.runCommand).toBeDefined()
        expect(opsAppSync.onFeatureTurnOn).toBeDefined()
        expect(opsAppSync.onFeatureTurnOff).toBeDefined()
        expect(opsAppSync.build).toBeDefined()
        expect(opsAppSync.preBackendUpdate).toBeDefined()
        expect(opsAppSync.syncCurrentBackendInfo).toBeDefined()
        expect(opsAppSync.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsAppSync.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsAppSync.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsAppSync.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsAppSync.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsAppSync.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsAppSync.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsAppSync.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsAppSync.runCommand('console', mock_projectInfo, null)
        expect(appsyncManager.getAppSyncInfo).toBeCalled()
        expect(opn).toBeCalled()
    })

    test('build', () => {
        let callback = jest.fn()
        opsAppSync.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsAppSync.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsAppSync.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback).then(()=>{
            expect(appsyncRetrieve.run).toBeCalled()
            expect(callback).toBeCalled()
        })
    })
})