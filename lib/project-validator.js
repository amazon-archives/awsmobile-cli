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

const pathManager = require('./utils/awsmobilejs-path-manager.js')

function validate(projectPath) {
  let isGood = false

  if(fs.existsSync(projectPath)){
    const dotAWSMobileSubDirPath = pathManager.getDotAWSMobileDirPath(projectPath)
    const backendSubDirPath = pathManager.getBackendDirPath(projectPath)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
   
    isGood = fs.existsSync(dotAWSMobileSubDirPath) && 
              fs.existsSync(backendSubDirPath) && 
              fs.existsSync(projectInfoFilePath)
  }

  if(!isGood){
    isGood = validate_v_1_0_3(projectPath)
  }

  return isGood
}

function validate_v_1_0_3(projectPath) {
  let isGood = false

  if(fs.existsSync(projectPath)){
    const dotAWSMobileSubDirPath = pathManager.getDotAWSMobileDirPath(projectPath)
    const backendSubDirPath = pathManager.getBackendDirPath(projectPath)
    const projectInfoFilePath_v_1_0_3 = pathManager.getProjectInfoFilePath_v_1_0_3(projectPath)
   
    isGood = fs.existsSync(dotAWSMobileSubDirPath) && 
              fs.existsSync(backendSubDirPath) && 
              fs.existsSync(projectInfoFilePath_v_1_0_3)

    if(isGood){ //convert to latest version conformant project
      const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
      fs.copySync(projectInfoFilePath_v_1_0_3, projectInfoFilePath)
      const getInfoDirPath_v_1_0_3 = pathManager.getInfoDirPath_v_1_0_3(projectPath)
      fs.removeSync(getInfoDirPath_v_1_0_3)
    }
  }

  return isGood
}

module.exports = {
  validate
}
