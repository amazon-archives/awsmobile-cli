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
const chalk = require('chalk')
const moment = require('moment')

const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const dependencyManager = require('../utils/dependency-manager.js')
const gitManager = require('../utils/git-manager.js')

function run(initInfo){
    if(initInfo.strategy){
        dependencyManager.setupAmplifyDependency(initInfo)
        .then((initInfo)=>{
            gitManager.insertAwsmobilejs(initInfo.projectPath)
            
            delete initInfo.projectInfo.SourceDir
            delete initInfo.projectInfo.DistributionDir
            delete initInfo.projectInfo.BuildCommand
            delete initInfo.projectInfo.StartCommand
            initInfo.projectInfo.Framework = initInfo.framework
            initInfo.projectInfo.InitializationTime = moment().format(awsmobileJSConstant.DateTimeFormatString)  
            const jsonString = JSON.stringify(initInfo.projectInfo, null, '\t')
            const projectInfoFilePath = pathManager.getProjectInfoFilePath(initInfo.projectPath)
            fs.writeFileSync(projectInfoFilePath, jsonString, 'utf8')
            
            if(initInfo.strategy == 'import'){ //backend is already successfully setup, the backup is no longer needed
                fs.removeSync(initInfo.backupAWSMobileJSDirPath)
            }
            fs.removeSync(pathManager.getInitInfoFilePath(initInfo.projectPath))
            
            printWelcomeMessage(initInfo.projectPath)
        })
    }
}

function printWelcomeMessage(projectPath){
    console.log()
    console.log('Success! your project is now initialized with awsmobilejs')
    console.log()
    console.log('   ' + chalk.blue(pathManager.getDotAWSMobileDirPath_relative(projectPath)))
    console.log('     is the workspace of awsmobile-cli, please do not modify its contents')
    console.log()
    console.log('   ' + chalk.blue(pathManager.getCurrentBackendInfoDirPath_relative(projectPath)))
    console.log('     contains information of the backend awsmobile project from the last')
    console.log('     synchronization with the cloud')
    console.log()
    console.log('   ' + chalk.blue(pathManager.getBackendDirPath_relative(projectPath)))
    console.log('     is where you develop the codebase of the backend awsmobile project')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile console'))
    console.log('     opens the web console of the backend awsmobile project')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile run'))
    console.log('     pushes the latest development of the backend awsmobile project to the cloud,')
    console.log('     and runs the frontend application locally')
    console.log()
    console.log('   ' + chalk.cyan('awsmobile publish'))
    console.log('     pushes the latest development of the backend awsmobile project to the cloud,') 
    console.log('     and publishes the frontend application to aws S3 for hosting')
    console.log()
    console.log('Happy coding with awsmobile!')
}


module.exports = {
    run
}
