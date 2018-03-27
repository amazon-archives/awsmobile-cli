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
const _featureName = 'mock-feature-command'
const _featureCommands ={
    'featureSpecificCommand': 'featureSpecificCommand description'
}

function hasCommand(command){
    return _featureCommands.hasOwnProperty(command)
}

module.exports = {
    featureName: _featureName,
    featureCommands: _featureCommands,
    specify: jest.fn(),
    hasCommand: hasCommand,
    runCommand: jest.fn(),
    onFeatureTurnOn: jest.fn(),
    onFeatureTurnOff: jest.fn(),
    build: jest.fn(),
    preBackendUpdate: jest.fn((projectInfo, awsConfig, backendProjectDetails, callback) => {
        if(callback){
            callback()
        }
    }),
    syncCurrentBackendInfo: jest.fn(),
    syncToDevBackend: jest.fn(),
    getStateGroup: jest.fn(),
    getFormationStateSummary: jest.fn()
}
  