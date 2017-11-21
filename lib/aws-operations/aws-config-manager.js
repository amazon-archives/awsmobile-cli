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
const opn = require('opn')
const chalk = require('chalk')
const inquirer = require('inquirer')
const lineByLine = require('n-readlines')
const util = require('util')

const awsMobileRegions = require('./aws-regions.js').regions
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const dfops = require('../utils/directory-file-ops.js')

exports.initialize = function(){ 
    return resolveAWSConfig()
}

exports.checkAWSConfig = function(callback){
    let awsConfig = exports.getAWSConfig()
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
                module.exports.configureAWS(function(awsConfig){
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

exports.configureAWS = function(callback)
{
    let awsConfigFilePath = pathManager.getAWSConfigFilePath()
    var awsConfig = module.exports.getAWSConfig()

    var isNewUser = false
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
        var jsonString = JSON.stringify(awsConfig)
        fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8')

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

exports.getAWSConfig = function()
{
    return resolveAWSConfig()
}

exports.getTemplateAWSConfig = function()
{
    var awsConfig = new Object()
    
    awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
    awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
    awsConfig.region = awsmobileJSConstant.DefaultAWSRegion

    return awsConfig 
}

exports.listAWSConfig = function(){
    console.log()
    console.log(util.inspect(module.exports.getAWSConfig(), false, null))
    console.log()
}

function resolveAWSConfig(){
    var awsConfig
        try{
            let awsConfigFilePath = pathManager.getAWSConfigFilePath() 
            if(fs.existsSync(awsConfigFilePath)){
                try{
                    awsConfig = JSON.parse(fs.readFileSync(awsConfigFilePath, 'utf8'))
                    if(!validateAWSConfig(awsConfig)){
                        awsConfig = resetToSystemAWSConfig()
                    }
                }catch(e){
                    awsConfig = resetToSystemAWSConfig()
                }
            }else{
                awsConfig = resetToSystemAWSConfig()
            }
        }catch(e){
            var awsConfig = new Object()
            awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
            awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
            awsConfig.region = awsmobileJSConstant.DefaultAWSRegion
        }
        return awsConfig
}

function resetToSystemAWSConfig(){
    var awsConfig = getSystemAwsConfig()
    
    let sysAWSMobileJSDirPath = pathManager.getSysAWSMobileJSDirPath()
    if(!fs.existsSync(sysAWSMobileJSDirPath)){
        fs.mkdirsSync(sysAWSMobileJSDirPath)
    }

    let awsConfigFilePath = pathManager.getAWSConfigFilePath() 
    var jsonString = JSON.stringify(awsConfig)
    fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8')

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

function getSystemAwsConfig(){
    awsConfig = new Object()
    let sysCredential = readSystemAwsCredential()
    if(sysCredential){
        awsConfig.accessKeyId = sysCredential.aws_access_key_id
        awsConfig.secretAccessKey = sysCredential.aws_secret_access_key
    }else{
        awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
    }

    let sysConfig = readSystemAwsConfig()

    if(sysConfig){
        awsConfig.region = sysConfig.region
    }else{
        awsConfig.region = awsmobileJSConstant.DefaultAWSRegion
    }
    return awsConfig
}

function readSystemAwsConfig()
{
    var result
    
    try{
        var liner = new lineByLine(pathManager.getSysAwsConfigFilePath())
        result = {}
        var line
        var isInDefault = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == '[default]'){
                    isInDefault = true
                }else{
                    isInDefault = false
                }
            }else if (strPair.length == 2){
                if(isInDefault){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }

    return result
}

function readSystemAwsCredential()
{
    var result
    try{
        var liner = new lineByLine(pathManager.getSysAwsCredentialsFilePath())
        result = {}
        var line
        var isInDefault = false
        while (line = liner.next()) {
            let strPair = line.toString().split("=")
            if(strPair.length == 1){
                if(line == '[default]'){
                    isInDefault = true
                }else{
                    isInDefault = false
                }
            }else if (strPair.length == 2){
                if(isInDefault){
                    result[strPair[0].trim()] = strPair[1].trim()
                }
            }
        }
    }catch(e){
        result = undefined
    }
    return result
}