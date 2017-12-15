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
const opn = require('opn')
const chalk = require('chalk')
const inquirer = require('inquirer')
const lineByLine = require('n-readlines')
const util = require('util')

const awsMobileRegions = require('./aws-regions.js').regions
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const dfops = require('../utils/directory-file-ops.js')

function initializeAWSForNewProject(projectInfo){
    let awsConfig = resolveAWSConfig()
    
    let projectAWSConfigFileName = nameManager.generateAWSConfigFileName(projectInfo)
    let projectAWSConfigFilePath = path.normalize(path.join(pathManager.getSysAWSMobileJSDirPath(), projectAWSConfigFileName))
    
    let awsInfo = JSON.parse(fs.readFileSync(pathManager.getAWSInfoFilePath_base() , 'utf8'))
    awsInfo.ConfigFileName = projectAWSConfigFileName

    const projectAWSInfoFilePath = pathManager.getAwsInfoFilePath(projectInfo.ProjectPath)

    const jsonString = JSON.stringify(awsInfo, null, '\t')
    fs.writeFileSync(projectAWSInfoFilePath, jsonString, 'utf8')
    
    return awsConfig
}

function checkAWSConfig(callback){
    let awsConfig = resolveAWSConfig()
    if(validateAWSConfig(awsConfig)){
        callback(awsConfig)
    }else{
        console.log(chalk.red('missing aws account credentials'))
        inquirer.prompt([
            {
                type: 'confirm',
                name: 'configureAWS',
                message: 'configure aws account settings',
                default: true
            }
        ]).then(function (answers) {
            if(answers.configureAWS){
                configureAWS(function(awsConfig){
                    if(validateAWSConfig(awsConfig)){
                        callback(awsConfig)
                    }else{
                        console.log(chalk.red('invalid aws account settings'))
                        opn(awsmobileJSConstant.AWSCreateIAMUsersUrl, {wait: false})
                    }
                })
            }
        })
    }
}

function configureAWS(profileName, callback){
    let awsConfig
    if(profileName){
        awsConfig = setToSystemAWSConfig(profileName)
        if(validateAWSConfig(awsConfig)){
            console.log()
            console.log(util.inspect(awsConfig, false, null))
            console.log()
        }else{
            awsConfig = configureAWS_manual(callback)
        }
    }else{
        awsConfig = configureAWS_manual(callback)
    }
    return awsConfig
}

function configureAWS_manual(callback)
{
    let awsConfig = resolveAWSConfig()

    let awsConfigFilePath = pathManager.getAWSConfigFilePath_base()

    let isNewUser = false
    if(!validateAWSConfig(awsConfig)){ //assume new user
        isNewUser = true
        console.log('visit the following address to setup your aws account/user credentials:')
        console.log(chalk.green(awsmobileJSConstant.AWSCreateIAMUsersUrl))
        opn(awsmobileJSConstant.AWSCreateIAMUsersUrl, {wait: false})
    }

    inquirer.prompt([
        {
            type: 'input',
            name: 'accessKeyId',
            message: "accessKeyId: ",
            default: awsConfig.accessKeyId
        },
        {
            type: 'input',
            name: 'secretAccessKey',
            message: "secretAccessKey: ",
            default: awsConfig.secretAccessKey
        },
        {
            type: 'list',
            name: 'region',
            message: "region: ",
            choices: awsMobileRegions,
            default: awsConfig.region
        }
    ]).then(function (answers) {
        if(answers.accessKeyId){
            awsConfig.accessKeyId = answers.accessKeyId.trim()
        }
        if(answers.secretAccessKey){
            awsConfig.secretAccessKey = answers.secretAccessKey.trim()
        }
        if(answers.region){
            awsConfig.region = answers.region.trim()
        }
        let jsonString = JSON.stringify(awsConfig)
        fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8')

        let awsInfoFilePath = pathManager.getAWSInfoFilePath_base() 
        let InfoJsonString = JSON.stringify({
            "ProfileName": '',
            "IsUsingProfile": false 
        })
        fs.writeFileSync(awsInfoFilePath, InfoJsonString, 'utf8')

        if(isNewUser){
            console.log()
            console.log('You must enable Mobile Hub service role before using the awsmobile cli')
            console.log('If you see Mobile Hub console, then it is already enabled')
            console.log(chalk.green(awsmobileJSConstant.AWSEnableMobileRoleUrl))
            opn(awsmobileJSConstant.AWSEnableMobileRoleUrl, {wait: false})
        }

        if(callback){
            callback(awsConfig)
        }
    })
}

function listAWSConfig(){
    console.log()
    console.log(util.inspect(resolveAWSConfig(), false, null))
    console.log()
}

function resolveAWSConfig(){
    let awsConfig
    try{
        const awsInfoFilePath = pathManager.getAWSInfoFilePath_base() 
        if(fs.existsSync(awsInfoFilePath)){
            const awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath, 'utf8'))
            if(awsInfo.IsUsingProfile){
                awsConfig = setToSystemAWSConfig(awsInfo.ProfileName)
            }else{
                let awsConfigFilePath = pathManager.getAWSConfigFilePath_base() 
                if(fs.existsSync(awsConfigFilePath)){
                    try{
                        awsConfig = JSON.parse(fs.readFileSync(awsConfigFilePath, 'utf8'))
                        if(!validateAWSConfig(awsConfig)){
                            awsConfig = setToSystemAWSConfig()
                        }
                    }catch(e){
                        awsConfig = setToSystemAWSConfig()
                    }
                }else{
                    awsConfig = setToSystemAWSConfig()
                }
            }
        }else{
            awsConfig = setToSystemAWSConfig()
        }
    }catch(e){
        let awsConfig = new Object()
        awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
        awsConfig.region = awsmobileJSConstant.DefaultAWSRegion
    }

    return awsConfig
}

function setToSystemAWSConfig(profileName){

    if(!profileName){
        profileName = 'default'
    }

    let awsConfig = getSystemAwsConfig(profileName)
    
    let sysAWSMobileJSDirPath = pathManager.getSysAWSMobileJSDirPath()
    fs.ensureDirSync(sysAWSMobileJSDirPath)

    let awsConfigFilePath = pathManager.getAWSConfigFilePath_base() 
    let configJsonString = JSON.stringify(awsConfig)
    fs.writeFileSync(awsConfigFilePath, configJsonString, 'utf8')

    let awsInfoFilePath = pathManager.getAWSInfoFilePath_base() 
    let InfoJsonString = JSON.stringify({
        "ProfileName": profileName,
        "IsUsingProfile": true 
    })
    fs.writeFileSync(awsInfoFilePath, InfoJsonString, 'utf8')

    return awsConfig
}

function validateAWSConfig(awsConfig){
    return validateAccessKeyID(awsConfig.accessKeyId) &&
    validateSecretAccessKey(awsConfig.secretAccessKey) &&
    validateAWSRegion(awsConfig.region)
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

function getSystemAwsConfig(profileName){
    awsConfig = new Object()

    if(!profileName){
        profileName = 'default'
    }

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

    let sysAwsConfigFilePath = pathManager.getSysAwsConfigFilePath()
    
    try{
        let liner = new lineByLine(sysAwsConfigFilePath)
        result = {}
        let line
        let isInProfileSection = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == '[profile '+profileName+']'){
                    isInProfileSection = true
                }else{
                    isInProfileSection = false
                }
            }else if (strPair.length == 2){
                if(isInProfileSection){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }

    if(!result){
        console.log(chalk.red('can not retrieve ' + profileName + ' from ' + sysAwsConfigFilePath))
    }

    return result
}

function readSystemAwsCredential(profileName)
{
    let result

    if(!profileName){
        profileName = 'default'
    } 

    let sysAwsCredentialsFilePath = pathManager.getSysAwsCredentialsFilePath()

    try{
        let liner = new lineByLine(sysAwsCredentialsFilePath)
        result = {}
        let line
        let isInProfileSection = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == '['+profileName+']'){
                    isInProfileSection = true
                }else{
                    isInProfileSection = false
                }
            }else if (strPair.length == 2){
                if(isInProfileSection){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }

    if(!result){

        console.log(chalk.red('can not retrieve ' + profileName + ' from ' + sysAwsCredentialsFilePath))
    }

    return result
}

module.exports = {
    initializeAWSForNewProject,
    checkAWSConfig,
    configureAWS,
    listAWSConfig
}
  