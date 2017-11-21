/* 
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const chalk = require('chalk')
const inquirer = require('inquirer')

const projectInfoManager = require('./project-info-manager.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const gitManager = require('./utils/git-manager.js')
const mobileExportJSFileManager = require('./aws-operations/mobile-exportjs-file-manager.js')

function removeAWSMobileJS() {
    let projectInfo = projectInfoManager.getProjectInfo()
    if(projectInfo){
        console.log(chalk.bgYellow.bold('Warning:') + ' This will remove the awsmobilejs folder and all the backup folders created by awsmobile-cli')
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'ok',
                message: 'Remove awsmobilejs features from the current project?',
                default: false
            }
        ]).then(function (answers) {
            if(answers.ok){
                mobileExportJSFileManager.onClearBackend(projectInfo)
                gitManager.onAWSMobileJSRemove(projectInfo.ProjectPath)
                removeBackupAWSMobileJSDirs(projectInfo.ProjectPath)
                removeAWSMobileJSDir(projectInfo.ProjectPath)
                console.log('awsmobilejs is removed from the current project')
            }
        })
    }
}

function removeBackupAWSMobileJSDirs(projectPath){
    let dirs = fs.readdirSync(projectPath)
    let reg = new RegExp('^' + awsmobileJSConstant.AWSMobileJSBackUpDirName)
	for(let i = 0; i < dirs.length; i++) {
		let stat = fs.lstatSync(path.join(projectPath, dirs[i]))
		if(stat.isDirectory() && reg.test(dirs[i])) {
            fs.removeSync(dirs[i])
        }
    }
}

function removeAWSMobileJSDir(projectPath){
    let awsmobilejsPath = pathManager.getAWSMobileJSDirPath(projectPath)
    fs.removeSync(awsmobilejsPath)
}

module.exports = {
    removeAWSMobileJS
}