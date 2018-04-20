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
jest.mock('../../../../lib/utils/directory-file-ops.js')

const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const moment = require('moment')
const lineByLine = require('n-readlines')

const resolversHelper = require('../../../../lib/backend-operations/appsync-operations/helpers/helper-resolvers.js')
const pathManager = require('../../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../../../../lib/utils/awsmobilejs-constant.js')
const dfOps = require('../../../../lib/utils/directory-file-ops.js')

const _featureName = 'appsync'
const appsyncManager = require('../../../../lib/backend-operations/appsync-operations/appsync-manager.js')


describe('appsync-manager', () => {
    const projectName = 'mock_project'
    const projectPath = '/'+projectName
    const currentBackendFeatureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
    const featureDirPath = pathManager.getBackendFeatureDirPath(projectPath, _featureName)
    const appsyncInfo = {
        "apiId": "mockffub5bhirm6mwap5llmock",
        "region": "us-east-1",
        "name": "mock_project-2018-04-19-14-11-44",
        "graphqlEndpoint": "https://mockxvmfnrgkrf3mnsb2efmock.appsync-api.us-east-1.amazonaws.com/graphql",
        "authenticationType": "AWS_IAM",
        "creationTime": "2018-04-19-14-13-25",
        "lastUpdateTime": "2018-04-19-14-13-25",
        "lastSyncTime": "2018-04-19-14-13-57",
        "lastPushSuccessful": true,
        "AppSyncConsoleUrl": "https://console.aws.amazon.com/appsync/home?region=us-east-1#/mockffub5bhirm6mwap5llmock/v1/home",
        "lastSyncToDevTime": "2018-04-19-14-14-00"
    }
    const appsyncJSContents = 'export default {' + os.EOL +
        '"graphqlEndpoint": "https://mockxvmfnrgkrf3mnsb2efmock.appsync-api.us-east-1.amazonaws.com/graphql",' + os.EOL +
        '"region": "us-east-1",' + os.EOL +
        '"authenticationType": "AWS_IAM",' + os.EOL +
    '}'
    const resolvers = [{
            "typeName": "Event",
            "fieldName": "comments",
            "dataSourceName": "AppSyncCommentTable",
            "resolverArn": "arn:aws:appsync:us-east-1:mock32810889:apis/mockffub5bhirm6mwap5llmock/types/Event/resolvers/comments",
            "requestMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.request",
            "responseMappingTemplate": "{managed-by-awsmobile-cli}:Event.comments.response"
        }]
    const appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)

    const resolversFilePath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolversFileName)
    const currentResolversFilePath = path.join(currentBackendFeatureDirPath, awsmobilejsConstant.AppSyncResolversFileName)

    const mockMappingName = 'dataSource.field.requestorresponse'
    let resolverMappingsDirPath = path.join(featureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    let mappingFilePath = path.join(resolverMappingsDirPath, mockMappingName)
    let currentResolverMappingsDirPath = path.join(currentBackendFeatureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    let currentMappingFilePath = path.join(currentResolverMappingsDirPath, mockMappingName)
    
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[appsyncJSFilePath] = appsyncJSContents
    MOCK_FILE_INFO[mappingFilePath] = 'mock mapping contents'
    MOCK_FILE_INFO[currentMappingFilePath] = 'mock current mapping contents'
    MOCK_FILE_INFO[resolversFilePath] = JSON.stringify(resolvers)
    MOCK_FILE_INFO[currentResolversFilePath] = JSON.stringify(resolvers)


    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        dfOps.readJsonFile = jest.fn()
        dfOps.writeJsonFile = jest.fn()

    })

    beforeEach(() => {
        fs.copySync.mockClear()
        fs.removeSync.mockClear()
        fs.existsSync.mockClear()
        fs.readFileSync.mockClear()
        dfOps.readJsonFile.mockClear()
        dfOps.writeJsonFile.mockClear()
    })

    test('definitions', () => {
        expect(appsyncManager.enable).toBeDefined()
        expect(appsyncManager.disable).toBeDefined()
        expect(appsyncManager.getAppSyncInfo).toBeDefined()
        expect(appsyncManager.setAppSyncInfo).toBeDefined()
        expect(appsyncManager.clearAppSyncInfo).toBeDefined()
        expect(appsyncManager.getEnabledFeatures).toBeDefined()
        expect(appsyncManager.getMapping).toBeDefined()
        expect(appsyncManager.getApiKeys).toBeDefined()
        expect(appsyncManager.setApiKeys).toBeDefined()
        expect(appsyncManager.getDataSources).toBeDefined()
        expect(appsyncManager.getGraphqlApi).toBeDefined()
        expect(appsyncManager.getResolvers).toBeDefined()
        expect(appsyncManager.getSchema).toBeDefined()
        expect(appsyncManager.getCurrentMapping).toBeDefined()
        expect(appsyncManager.getCurrentApiKeys).toBeDefined()
        expect(appsyncManager.getCurrentDataSources).toBeDefined()
        expect(appsyncManager.getCurrentGraphqlApi).toBeDefined()
        expect(appsyncManager.getCurrentResolvers).toBeDefined()
        expect(appsyncManager.getCurrentSchema).toBeDefined()
        expect(appsyncManager.getAppSyncJS).toBeDefined()
        expect(appsyncManager.setAppSyncJS).toBeDefined()
    })

    test('enable', ()=>{
        appsyncManager.enable(projectPath)
        expect(fs.copySync).toBeCalled()
    })

    test('disable', ()=>{
        appsyncManager.disable(projectPath)
        expect(fs.removeSync).toBeCalledWith(featureDirPath)
    })

    test('getAppSyncInfo', ()=>{
        appsyncManager.getAppSyncInfo(projectPath)
        const appsyncInfoFilePath = pathManager.getAppSyncInfoFilePath(projectPath)
        expect(dfOps.readJsonFile).toBeCalledWith(appsyncInfoFilePath)
    })

    test('setAppSyncInfo', ()=>{
        appsyncManager.setAppSyncInfo(projectPath, appsyncInfo)
        let appsyncInfoFilePath = pathManager.getAppSyncInfoFilePath(projectPath)
        expect(dfOps.writeJsonFile).toBeCalledWith(appsyncInfoFilePath, appsyncInfo)
    })

    test('clearAppSyncInfo', ()=>{
        appsyncManager.clearAppSyncInfo(projectPath)
        let currentFeatureDirPath = pathManager.getCurrentBackendFeatureDirPath(projectPath, _featureName)
        let appsyncJSFilePath = pathManager.getAppSyncJSFilePath(projectPath)
        expect(fs.removeSync).toBeCalledWith(currentFeatureDirPath)
        expect(fs.removeSync).toBeCalledWith(appsyncJSFilePath)
    })

    test('getEnabledFeatures', ()=>{
        appsyncManager.getEnabledFeatures(projectPath)
        expect(fs.existsSync).toBeCalledWith(featureDirPath)
    })

    test('getMapping', ()=>{
        appsyncManager.getMapping(projectPath, mockMappingName)
        expect(fs.readFileSync).toBeCalled()
    })

    test('getCurrentMapping', ()=>{
        appsyncManager.getCurrentMapping(projectPath, mockMappingName)
        expect(fs.readFileSync).toBeCalled()
    })

    test('getApiKeys', ()=>{
        appsyncManager.getApiKeys(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('setApiKeys', ()=>{
        appsyncManager.setApiKeys(projectPath, [])
        expect(dfOps.writeJsonFile).toBeCalled()
    })

    test('getCurrentApiKeys', ()=>{
        appsyncManager.getCurrentApiKeys(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getDataSources', ()=>{
        appsyncManager.getDataSources(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getCurrentDataSources', ()=>{
        appsyncManager.getCurrentDataSources(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getGraphqlApi', ()=>{
        appsyncManager.getGraphqlApi(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getCurrentGraphqlApi', ()=>{
        appsyncManager.getCurrentGraphqlApi(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getResolvers', ()=>{
        appsyncManager.getResolvers(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getCurrentResolvers', ()=>{
        appsyncManager.getCurrentResolvers(projectPath)
        expect(dfOps.readJsonFile).toBeCalled()
    })

    test('getSchema', ()=>{
        appsyncManager.getSchema(projectPath)
        expect(fs.existsSync).toBeCalled()
    })

    test('getCurrentSchema', ()=>{
        appsyncManager.getCurrentSchema(projectPath)
        expect(fs.existsSync).toBeCalled()
    })

    test('getAppSyncJS', ()=>{
        appsyncManager.getAppSyncJS(projectPath)
        expect(fs.existsSync).toBeCalled()
        expect(fs.readFileSync).toBeCalled()
    })

    test('setAppSyncJS', ()=>{
        let mock_appSyncJS = appsyncManager.getAppSyncJS(projectPath)
        console.log(mock_appSyncJS)
        appsyncManager.setAppSyncJS(projectPath, mock_appSyncJS)
        expect(fs.writeFileSync).toBeCalled()
    })
})