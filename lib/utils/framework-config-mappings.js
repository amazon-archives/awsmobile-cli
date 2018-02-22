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

const npm = /^win/.test(process.platform) ? "npm.cmd" : "npm" 
const yarn = /^win/.test(process.platform) ? "yarn.cmd" : "npm" 

const reactConfig = {
	"SourceDir": "src",
	"DistributionDir": "build",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

const reactNativeConfig = {
	"SourceDir": "/",
	"DistributionDir": "/",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

const angularConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": "ng serve",
}

const ionicConfig = {
	"SourceDir": "src",
	"DistributionDir": "www",
	"BuildCommand": npm + " run-script build",
	"StartCommand": "ionic serve",
}

const vueConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script serve",
}

const defaultConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

module.exports = {
    'react': reactConfig,
	'react-native': reactNativeConfig,
	'angular': angularConfig,
    'ionic': ionicConfig,
	'vue': vueConfig, 
	'default': defaultConfig
}
