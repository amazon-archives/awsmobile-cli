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
const fs = require('fs-extra')
const moment = require('moment')

const awsMobileRegions = require('./aws-regions.js').regions
const projectInfoManager = require('../project-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

/////////////////////////////////
function getAWSConfigFilePath(){
    let projectInfo = projectInfoManager.getProjectInfo()
    if(projectInfo){
        getProjectAWSConfigFilePath(projectInfo)
    }else{
        getGeneralAWSConfigFilePath()
    }
}

function getGeneralAWSConfigFilePath(){
    return pathManager.getAWSConfigFilePath()
}

function getProjectAWSConfigFilePath(projectInfo){
}

/////////////////////////////////
function setProfile(profileName){
    let projectInfo = projectInfoManager.getProjectInfo()
    if(projectInfo){
        setProjectProfile(profileName, projectInfo)
    }else{
        setGeneralProfile(profileName)
    }
}

function setGeneralProfile(profileName, projectInfo){

}

function setProjectProfile(profileName){

}

/////////////////////////////////
function syncProfileSettings(awsInfo){
    if(awsInfo.IsUsingProfile){
        let awsConfigFilePath = awsInfo.AWSConfigFilePath

    }
}

module.exports = {
    getAWSConfigFilePath, 
    setProfile
}
  