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
const frameworkConfigMappings = require('./framework-config-mapping.js')

const reactConfig = frameworkConfigMappings['react']
const angularConfig = frameworkConfigMappings['angular']

let reactNativeConfig = frameworkConfigMappings['react-native']
reactNativeConfig.SourceDir = 'src'

const ionicConfig = frameworkConfigMappings['ionic']

const vueConfig = frameworkConfigMappings['vue']

module.exports = {
    'react': reactConfig,
    'react-native': reactNativeConfig,
    // 'angular': angularConfig,
    // 'ionic': ionicConfig,
    // 'vue': vueConfig
}
