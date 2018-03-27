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
jest.mock('archiver')
jest.mock('../../../lib/backend-operations/backend-spec-manager.js')

const fs = require('fs-extra')
const path = require('path')
const archiver = require('archiver')
const moment = require('moment')
const { Writable } = require('stream')

const backendSpecManager = require('../../../lib/backend-operations/backend-spec-manager.js')
const dfops = require('../../../lib/utils/directory-file-ops.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const opsCloudApi = require('../../../lib/backend-operations/ops-cloud-api.js')

const lambdaBuilder = require('../../../lib/backend-operations/cloud-api-lambda-builder.js')

describe('cloud-api-lambda-builder', () => {
   
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    
    const mock_projectInfo = {
        ProjectName: projectName,
        ProjectPath: projectPath
    }

    const backendCloudApiDirPath = pathManager.getBackendFeatureDirPath(mock_projectInfo.ProjectPath, opsCloudApi.featureName)
    const lambdaCodeDirPath1 = path.join(backendCloudApiDirPath, 'lambda1')
    const lambdaCodeDirPath2 = path.join(backendCloudApiDirPath, 'lambda2')
    const lambdaHandlerFilePath1 = path.join(lambdaCodeDirPath1, 'lambda.js')
    const lambdaHandlerFilePath2 = path.join(lambdaCodeDirPath2, 'lambda.js')

    const cloudApiBuildDirPath = pathManager.getBackendBuildFeatureDirPath(mock_projectInfo.ProjectPath, opsCloudApi.featureName)
    const lambdaZipFilePath1 = path.join(cloudApiBuildDirPath, 'lambda1.zip')
    const lambdaZipFilePath2 = path.join(cloudApiBuildDirPath, 'lambda2.zip')

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[lambdaHandlerFilePath1] = 'exports.handler = (event, context) => {console.log("handler")}'
    MOCK_FILE_INFO[lambdaHandlerFilePath2] = 'exports.handler = (event, context) => {console.log("handler")}'
    MOCK_FILE_INFO[lambdaZipFilePath1] = 'mock-zip-contents-1'
    MOCK_FILE_INFO[lambdaZipFilePath2] = 'mock-zip-contents-2'

    const mock_backendProject = {
        features: {
            cloudlogic: {
                components: {
                    api1: {
                        attributes: {
                            name: 'api1', 
                            'requires-signin': false, 
                        },
                        paths: {
                            '/items:': {
                                name: 'lambda1',
                                codeFilename: 'uploads/lambda1.zip',
                                handler: 'lambda.handler',
                                enableCORS: true,
                                runtime: 'nodejs6.10',
                                environment: {},
                            },
                            '/items/{proxy+}': {
                                name: 'lambda1',
                                codeFilename: 'uploads/lambda1.zip',
                                handler: 'lambda.handler',
                                enableCORS: true,
                                runtime: 'nodejs6.10',
                                environment: {},
                            }
                        }
                    }, 
                    api2: {
                        attributes: {
                            name: 'api2', 
                            'requires-signin': false, 
                        },
                        paths: {
                            '/items:': {
                                name: 'lambda2',
                                codeFilename: 'uploads/lambda2.zip',
                                handler: 'lambda.handler',
                                enableCORS: true,
                                runtime: 'nodejs6.10',
                                environment: {},
                            },
                            '/items/{proxy+}': {
                                name: 'lambda2',
                                codeFilename: 'uploads/lambda2.zip',
                                handler: 'lambda.handler',
                                enableCORS: true,
                                runtime: 'nodejs6.10',
                                environment: {},
                            }
                        }
                    }
                }
            }
        }
    }
    
    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        fs.createWriteStream = jest.fn((filePath)=>{
            return new Writable()
        })
        archiver.create = jest.fn((format, options)=>{
            return {
                pipe: (writable)=>{this.outStream = writable},
                directory: jest.fn(),
                finalize: ()=>{this.outStream.emit('close')}
            }
        })
    })

    test('build', () => {
        let callback = jest.fn()
        lambdaBuilder.build(mock_projectInfo, mock_backendProject, opsCloudApi.featureName, callback)
        expect(callback).toBeCalled()  
    })
})