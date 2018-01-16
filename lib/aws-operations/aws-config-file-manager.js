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
const path = require('path')
const moment = require('moment')

const awsMobileRegions = require('./aws-regions.js').regions
const projectInfoManager = require('../project-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')


function resolve(){
    let awsConfigFilePath = pathManager.getGeneralAWSConfigFilePath()
    let projectInfo = projectInfoManager.getProjectInfo(true)

    if(projectInfo){
        awsConfigFilePath = resolve_project_awsConfig(projectInfo)
    }else{
        awsConfigFilePath = resolve_general_awsConfig()
    }

    return awsConfigFilePath
}

function resolve_general_awsConfig(){
    let awsInfoFilePath = pathManager.getGeneralAWSInfoFilePath()
    if(!fs.existsSync(awsInfoFilePath)){
        let awsInfo = awsInfoTemplate
        awsInfo.AWSConfigFilePath = pathManager.getGeneralAWSConfigFilePath()
        let jsonString = JSON.stringify(awsInfo)
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
    }

    let awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath, 'utf8'))

}

function resolve_project_awsConfig(projectInfo){

}

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
    return pathManager.getGeneralAWSConfigFilePath()
}

function getProjectAWSConfigFilePath(projectInfo){
    awsInfo = JSON.parse(fs.readFileSync(pathManager.getAWSInfoFilePath(projectInfo.ProjectPath), 'utf8'))

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

const awsInfoTemplate = {
    "IsUsingProfile": true,
	"ProfiletName": "default",
	"AWSConfigFilePath": "~/.awsmobilejs/aws-config.json",
	"LastProfileSyncTime": "2018-01-01-01-01-01"
}

const awsConfigTemplate = {
    "accessKeyId": awsmobileJSConstant.DefaultAWSAccessKeyId,
    "secretAccessKey": awsmobileJSConstant.DefaultAWSSecretAccessKey,
    "region": "us-west-1"
}

function getSystemAwsConfig(profileName){
    awsConfig = new Object()
    let sysCredential = readSystemAwsCredential(profileName)
    if(sysCredential){
        awsConfig.accessKeyId = sysCredential.aws_access_key_id
        awsConfig.secretAccessKey = sysCredential.aws_secret_access_key
    }else{
        awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
    }

    let sysConfig = readSystemAwsConfig(profileName)

    if(sysConfig){
        awsConfig.region = sysConfig.region
    }else{
        awsConfig.region = awsmobileJSConstant.DefaultAWSRegion
    }
    return awsConfig
}

function readSystemAwsConfig(profileName)
{
    let result
    
    if(!profileName){
        profileName = 'default'
    }
    let profileMark = '[' + profileName + ']'

    try{
        let liner = new lineByLine(pathManager.getSysAwsConfigFilePath())
        result = {}
        let line
        let isInProfile = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == profileMark){
                    isInProfile = true
                }else{
                    isInProfile = false
                }
            }else if (strPair.length == 2){
                if(isInProfile){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }

    return result
}

function readSystemAwsCredential(profileName)
{
    let result
    
    if(!profileName){
        profileName = 'default'
    }
    let profileMark = '[' + profileName + ']'

    try{
        let liner = new lineByLine(pathManager.getSysAwsCredentialsFilePath())
        result = {}
        let line
        let isInProfile = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == profileMark){
                    isInProfile = true
                }else{
                    isInProfile = false
                }
            }else if (strPair.length == 2){
                if(isInProfile){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }
    return result
}


module.exports = {
    getAWSConfigFilePath, 
    setProfile
}
  