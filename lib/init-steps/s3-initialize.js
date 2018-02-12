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

const awsmobileBaseManager = require('../base-manager.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

function run(initInfo){
	if(initInfo.strategy){
		if(initInfo.strategy == 'clone'){
			//cloneAWSMobileJSDir will leave the original awsmobilejs folder intact, because it's needed for backend clone
			initInfo.backupAWSMobileJSDirPath = cloneAWSMobileJSDir(initInfo.projectPath)
		}else{
            initInfo.backupAWSMobileJSDirPath = awsmobileBaseManager.backupAWSMobileJSDir(initInfo.projectPath)
		}

		awsmobileBaseManager.ensureFolderStructure(initInfo.projectPath)

		projectInfo = projectInfoTemplate
		if(initInfo.projectInfo){
			Object.assign(projectInfo, initInfo.projectInfo)
		}
	
		projectInfo.ProjectName = path.basename(initInfo.projectPath)
		projectInfo.ProjectPath = initInfo.projectPath
	
		const jsonString = JSON.stringify(projectInfo, null, '\t')
		const projectInfoFilePath = pathManager.getProjectInfoFilePath(initInfo.projectPath)
		fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
	
		initInfo.projectInfo = projectInfo
	}
    return initInfo
}

function cloneAWSMobileJSDir(projectPath){
	let backupAWSMobileJSDirPath
  
	const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
	if(fs.existsSync(awsmobilejsDirPath)){
	  const backupAWSMobileJSDirName =  awsmobileJSConstant.AWSMobileJSBackUpDirName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
	  backupAWSMobileJSDirPath = path.normalize(path.join(projectPath, backupAWSMobileJSDirName))
	  fs.copySync(awsmobilejsDirPath, backupAWSMobileJSDirPath)
	}
  
	return backupAWSMobileJSDirPath
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
	"BackendLastPushSuccessful": false,
	"BackendProjectID": "",
	"BackendProjectName":  "",
    "BackendProjectConsoleUrl": "",
	"BackendProjectCreationTime": "",
	"BackendProjectLastUpdatedTime": ""
}

module.exports = {
    run
}
