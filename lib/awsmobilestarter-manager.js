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
const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = require('download-git-repo')

const 

const packageObj = {
    "name": "testnpm",
    "version": "1.0.0",
    "dependencies": {
      "aws-amplify": "^0.1.x"
    },
    "scripts": {
      "start": "echo \"Error: no start specified\" && exit 1",
      "build": "echo \"Error: no build specified\" && exit 1",
    },
    "author": "",
    "license": "ISC"
}

const projectConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": "npm run-script build",
	"StartCommand": "npm run-script start",
}

function placeBlankProject(projectPath, callback){
  let srcDirPath = path.join(projectPath, projectConfig.SourceDir)
  let distDirPath = path.join(projectPath, projectConfig.DistributionDir)
  let packageJsonFilePath = path.join(projectPath, 'package.json')

  fs.ensureDirSync(projectPath)
  fs.ensureDirSync(srcDirPath)
  fs.ensureDirSync(distDirPath)

  let jsonString = JSON.stringify(packageObj, null, 2)
  fs.writeFileSync(packageJsonFilePath, jsonString, 'utf8')

  if(callback){
    callback()
  }
}

function placeStarter(projectPath, repo, callback){
  var spinner = ora('downloading starter ' + repo + ' ...')

  console.log(projectPath)
  console.log(repo)

  spinner.start()
  downloadGitRepo(repo, projectPath, { clone: true }, function (err) {
      spinner.stop()
      if (err) {
          console.log(chalk.red('Failed to download starter ' + repo))
          console.log('error: ' + err.message.trim())
      }else{
          console.log('starter \'' + repo + '\' is downloaded successfully.')
          if(callback){
              callback()
          }
      }
  })

  // process.chdir(projectPath)
}


module.exports = {
  placeBlankProject, 
  placeStarter,
}
