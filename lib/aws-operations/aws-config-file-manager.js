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
const chalk = require('chalk')
const path = require('path')
const moment = require('moment')
const lineByLine = require('n-readlines')

const awsMobileRegions = require('./aws-regions.js').regions
const projectInfoManager = require('../project-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

function resolve(){
    ensureFolderStructure()
    let projectInfo = projectInfoManager.getProjectInfo(true)

    if(projectInfo){
        awsInfo = resolve_project_awsConfig(projectInfo)
    }else{
        awsInfo = resolve_general_awsConfig()
    }

    return awsInfo
}

function setProfile(profileName){
    ensureFolderStructure()
    let awsInfoFilePath = pathManager.getGeneralAWSInfoFilePath()

    let projectInfo = projectInfoManager.getProjectInfo(true)
    if(projectInfo){
        awsInfoFilePath = pathManager.getAWSInfoFilePath(projectInfo.ProjectPath)
    }

    let awsInfo = awsInfoTemplate
    let executeSet = true

    if(fs.existsSync(awsInfoFilePath)){
        awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath, 'utf8'))
        if(awsInfo.IsUsingProfile && awsInfo.ProfiletName == profileName){
            executeSet = false
        }
    }

    if(executeSet){
        awsInfo.IsUsingProfile = true
        awsInfo.ProfiletName = profileName
        awsInfo.AWSInfoFilePath = awsInfoFilePath
        if(!awsInfo.AWSConfigFilePath){
            awsInfo.AWSConfigFilePath = path.normalize(path.join(pathManager.getSysProjectAWSConfigDirPath(), nameManager.generateAWSConfigFileName(projectInfo)))
        }
        awsInfo.LastProfileSyncTime = ""
        let jsonString = JSON.stringify(awsInfo, null, '\t')
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
       
        if(projectInfo){
            awsInfo = resolve_project_awsConfig(projectInfo)
        }else{
            awsInfo = resolve_general_awsConfig()
        }
    }
    
    return awsInfo
}

function setNoProfileSync(awsInfo){ 
    awsInfo.IsUsingProfile = false
    awsInfo.ProfiletName = ""
    awsInfo.LastProfileSyncTime = ""
    let jsonString = JSON.stringify(awsInfo, null, '\t')
    fs.writeFileSync(awsInfo.AWSInfoFilePath, jsonString, 'utf8')
    return awsInfo
}

//////////////////////////////////////
function resolve_general_awsConfig(){
    let awsInfoFilePath = pathManager.getGeneralAWSInfoFilePath()
    let awsConfigFilePath = pathManager.getGeneralAWSConfigFilePath()
    if(!fs.existsSync(awsInfoFilePath)){
        let awsInfo = awsInfoTemplate
        if(fs.existsSync(awsConfigFilePath)){
            awsInfo.IsUsingProfile = false
            awsInfo.ProfiletName = ""
        }else{ //for backward compatibility
            awsInfo.IsUsingProfile = true
            awsInfo.ProfiletName = "default"
        }
        awsInfo.AWSInfoFilePath = awsInfoFilePath
        awsInfo.AWSConfigFilePath = awsConfigFilePath
        awsInfo.LastProfileSyncTime = ""
        let jsonString = JSON.stringify(awsInfo, null, '\t')
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
    }

    let awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath, 'utf8'))

    let executeSyncProfile = false
    if(fs.existsSync(awsConfigFilePath)){
        executeSyncProfile = isSyncProfileNeeded(awsInfo)
    }else{
        if(awsInfo.IsUsingProfile){
            executeSyncProfile = true
        }else{
            let awsConfig = awsConfigTemplate
            let jsonString = JSON.stringify(awsConfig)
            fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8')
        }
    }

    if(executeSyncProfile){
        syncProfile(awsInfo)
        awsInfo.LastProfileSyncTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
        let jsonString = JSON.stringify(awsInfo, null, '\t')
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
    }

    return awsInfo
}

function resolve_project_awsConfig(projectInfo){
    let awsInfo 
    let awsInfoFilePath = pathManager.getAWSInfoFilePath(projectInfo.ProjectPath)
    if(!fs.existsSync(awsInfoFilePath)){
        awsInfo = resolve_general_awsConfig()
        let generateAWSConfigFilePath = awsInfo.AWSConfigFilePath
        awsInfo.AWSInfoFilePath = awsInfoFilePath
        awsInfo.AWSConfigFilePath = path.normalize(path.join(pathManager.getSysProjectAWSConfigDirPath(), nameManager.generateAWSConfigFileName(projectInfo)))
        fs.copySync(generateAWSConfigFilePath, awsInfo.AWSConfigFilePath)
        let jsonString = JSON.stringify(awsInfo, null, '\t')
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
    }else{
        awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath, 'utf8'))
        let awsConfigFilePath = awsInfo.AWSConfigFilePath
    
        let executeSyncProfile = false
        if(fs.existsSync(awsConfigFilePath)){
            executeSyncProfile = isSyncProfileNeeded(awsInfo)
        }else{
            if(awsInfo.IsUsingProfile){
                executeSyncProfile = true
            }else{
                let awsConfig = awsConfigTemplate
                let jsonString = JSON.stringify(awsConfig)
                fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8')
            }
        }
    
        if(executeSyncProfile){
            syncProfile(awsInfo)
            awsInfo.LastProfileSyncTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
            let jsonString = JSON.stringify(awsInfo, null, '\t')
            fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8')
        }
    }

    return awsInfo
}

function syncProfile(awsInfo){
    awsConfig = getSystemAwsConfig(awsInfo.ProfiletName)
    let jsonString = JSON.stringify(awsConfig)
    fs.writeFileSync(awsInfo.AWSConfigFilePath, jsonString, 'utf8')
}

function isSyncProfileNeeded(awsInfo){
    let result = false

    if(awsInfo.IsUsingProfile){
        let sysAwsConfigFilePath = pathManager.getSysAwsConfigFilePath()
        let sysAwsCredentailsFilePath = pathManager.getSysAwsCredentialsFilePath()
        if(fs.existsSync(sysAwsConfigFilePath) && fs.existsSync(sysAwsCredentailsFilePath)){
            let awsConfigFilePath = awsInfo.AWSConfigFilePath
            if(awsConfigFilePath && fs.existsSync(awsConfigFilePath)){ 
                let lastProfileSyncTime = moment(awsInfo.LastProfileSyncTime, awsmobileJSConstant.DateTimeFormatString)
                let lastSysConfigFileModificationTime = moment(fs.lstatSync(sysAwsConfigFilePath).mtime)
                let lastSysCredentialsFileModificationTime = moment(fs.lstatSync(sysAwsCredentailsFilePath).mtime)
                let lastConfigFileModificationTime = moment(fs.lstatSync(awsConfigFilePath).mtime)

        
                result =!lastProfileSyncTime.isValid() ||
                        !lastSysConfigFileModificationTime.isValid() ||
                        !lastSysCredentialsFileModificationTime.isValid() ||
                        !lastConfigFileModificationTime.isValid() ||
                        lastProfileSyncTime.isBefore(lastSysConfigFileModificationTime) ||
                        lastProfileSyncTime.isBefore(lastSysCredentialsFileModificationTime) ||
                        lastProfileSyncTime.isBefore(lastConfigFileModificationTime) 
            }else{
                result = true
            }
        }
    }

    return result
}

/////////////////////////////////

const awsInfoTemplate = {
    "IsUsingProfile": true,
    "ProfiletName": "default",
    "AWSConfigFilePath": "",
	"AWSInfoFilePath": "",
	"LastProfileSyncTime": "2018-01-01-01-01-01"
}

const awsConfigTemplate = {
    "accessKeyId": awsmobileJSConstant.DefaultAWSAccessKeyId,
    "secretAccessKey": awsmobileJSConstant.DefaultAWSSecretAccessKey,
    "region": "us-west-1"
}

function ensureFolderStructure(){
    let sysAWSMobileJSDirPath = pathManager.getSysAWSMobileJSDirPath()
    let sysProjectAWSConfigDirPath = pathManager.getSysProjectAWSConfigDirPath()
    fs.ensureDirSync(sysAWSMobileJSDirPath)
    fs.ensureDirSync(sysProjectAWSConfigDirPath)
}

function getSystemAwsConfig(profileName){
    awsConfig = new Object()
    let sysCredential = readSystemAwsCredential(profileName)
    if(sysCredential){
        awsConfig.accessKeyId = sysCredential.aws_access_key_id ? sysCredential.aws_access_key_id : awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = sysCredential.aws_secret_access_key ? sysCredential.aws_secret_access_key : awsmobileJSConstant.DefaultAWSSecretAccessKey
    }else{
        awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
    }

    let sysConfig = readSystemAwsConfig(profileName)

    if(sysConfig){
        awsConfig.region = sysConfig.region ? sysConfig.region : awsmobileJSConstant.DefaultAWSRegion
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

    if(profileName != 'default'){
        profileMark = '[profile ' + profileName + ']'
    }

    let sysConfigFilePath = pathManager.getSysAwsConfigFilePath()

    if(fs.existsSync(sysConfigFilePath)){
        try{
            let liner = new lineByLine(sysConfigFilePath)
            let line
            let isInProfile = false
            while (line = liner.next()) {
                let strPair = line.toString().split("=")
                if(strPair.length == 1){
                    if(line == profileMark){
                        if(!result){
                            result = {}
                        }
                        isInProfile = true
                    }else{
                        if(result){
                            break
                        }
                        isInProfile = false
                    }
                }else if (strPair.length == 2){
                    if(isInProfile){
                        result[strPair[0].trim()] = strPair[1].trim()
                    }
                }
            }
            if(!result){
                console.log()
                console.log(chalk.red('no config found for profile ' + profileName))
                console.log('aws-cli config file queried:')
                console.log(sysConfigFilePath)
            }
        }catch(e){
            console.log()
            console.log(chalk.red('error on reading config for profile ' + profileName))
            console.log('aws-cli config file queried:')
            console.log(sysConfigFilePath)
            result = undefined
        }
    }else{
        console.log()
        console.log(chalk.red('no aws-cli config file is found'))
        console.log('aws-cli config file queried:')
        console.log(sysConfigFilePath)
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

    let sysCredentialsFilePath = pathManager.getSysAwsCredentialsFilePath()

    if(fs.existsSync(sysCredentialsFilePath)){
        try{
            let liner = new lineByLine(sysCredentialsFilePath)
            let line
            let isInProfile = false
            while (line = liner.next()) {
                let strPair = line.toString().split("=")
                if(strPair.length == 1){
                    if(line == profileMark){
                        if(!result){
                            result = {}
                        }
                        isInProfile = true
                    }else{
                        if(result){
                            break
                        }
                        isInProfile = false
                    }
                }else if (strPair.length == 2){
                    if(isInProfile){
                        result[strPair[0].trim()] = strPair[1].trim()
                    }
                }
            }
            if(!result){
                console.log()
                console.log(chalk.red('no credentials found for profile ' + profileName))
                console.log('aws-cli credentials file querried:')
                console.log(sysCredentialsFilePath)
            }
        }catch(e){
            console.log()
            console.log(chalk.red('error on reading credentials for profile ' + profileName))
            console.log('aws-cli credentials file querried:')
            console.log(sysCredentialsFilePath)
            console.log(e)
            result = undefined
        }
    }else{
        console.log()
        console.log(chalk.red('no aws-cli credentials file is found'))
        console.log('aws-cli credentials file querried:')
        console.log(sysCredentialsFilePath)
    }
    return result
}

/////////////////////////////////////////////
function validateAWSConfig(awsConfig){
    return validateAccessKeyID(awsConfig.accessKeyId) &&
    validateSecretAccessKey(awsConfig.secretAccessKey) &&
    validateAWSRegion(awsConfig.region)
}

function isNewUser(awsDetails){//only called when resolved awsconfig is invalid
    let result = true

    let awsInfo = awsDetails.info
    let awsConfig = awsDetails.config

    let sysAwsConfigFilePath = pathManager.getSysAwsConfigFilePath()
    let sysAwsCredentailsFilePath = pathManager.getSysAwsCredentialsFilePath()

    if(fs.existsSync(sysAwsConfigFilePath) && fs.existsSync(sysAwsCredentailsFilePath)){
        result = false
    }

    return result
}

function validateAccessKeyID(accessKeyId){
    return (accessKeyId && accessKeyId != awsmobileJSConstant.DefaultAWSAccessKeyId)
}

function validateSecretAccessKey(secretAccessKey){
    return (secretAccessKey && secretAccessKey != awsmobileJSConstant.DefaultAWSSecretAccessKey)
}

function validateAWSRegion(region){
    return awsMobileRegions.includes(region)
}

module.exports = {
    resolve, 
    setProfile, 
    setNoProfileSync, 
    validateAWSConfig, 
    isNewUser
}
  