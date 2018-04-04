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
const fs = require('fs-extra')
const path = require('path')
const moment = require('moment')

const awsmobileBaseManager = require('../awsm-base-manager.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')

function run(initInfo){
	if(initInfo.strategy){

		if(initInfo.strategy == 'import' || initInfo.strategy == 'conform'){
			//cloneAWSMobileJSDir will leave the original awsmobilejs folder intact
			initInfo.backupAWSMobileJSDirPath = awsmobileBaseManager.cloneAWSMobileBase(initInfo.projectPath)
		}else{
            initInfo.backupAWSMobileJSDirPath = awsmobileBaseManager.backupAwsmobileBase(initInfo.projectPath)
		}

		awsmobileBaseManager.ensureFolderStructure(initInfo.projectPath)

		let projectInfo = projectInfoTemplate
		if(initInfo.projectInfo){
			Object.assign(projectInfo, initInfo.projectInfo)
		}
	
		projectInfo.ProjectName = path.basename(initInfo.projectPath)
		projectInfo.ProjectPath = initInfo.projectPath
		projectInfo.Framework = initInfo.framework
	
		let jsonString = JSON.stringify(projectInfo, null, '\t')
		const projectInfoFilePath = pathManager.getProjectInfoFilePath(initInfo.projectPath)
		fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
	
		initInfo.projectInfo = projectInfo
		jsonString = JSON.stringify(initInfo, null, '\t')
		const initInfoFilePath = pathManager.getInitInfoFilePath(initInfo.projectPath)
		fs.writeFileSync(initInfoFilePath, jsonString, 'utf8')
	}
	return initInfo
}

const projectInfoTemplate = {
	"ProjectName": "",
	"ProjectPath": "",
	"InitializationTime": "",
	"LastConfigurationTime": "",
	"LastNPMInstallTime": "",
	"FrontendLastBuildTime": "",
	"LastPublishTime": "",
	"BackendLastSyncTime": "",
	"BackendLastBuildTime": "",
	"BackendLastPushTime": "",
	"BackendProjectID": "",
	"BackendProjectName":  "",
    "BackendProjectConsoleUrl": "",
	"BackendProjectCreationTime": "",
	"BackendProjectLastUpdatedTime": ""
}

module.exports = {
    run
}
