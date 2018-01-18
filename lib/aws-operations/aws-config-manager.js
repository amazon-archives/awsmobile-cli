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
const awsConfigFileManager = require('./aws-config-file-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const dfops = require('../utils/directory-file-ops.js')

function checkAWSConfig(callback){
    let awsDetails = resolveAWSConfig()

    if(awsConfigFileManager.validateAWSConfig(awsDetails.config)){
        callback(awsDetails)
    }else{
        if(awsConfigFileManager.isNewUser(awsDetails)){
            newUserSetup()
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
                    configureAWS(null, function(awsDetails){
                        if(awsConfigFileManager.validateAWSConfig(awsDetails.config)){
                            callback(awsDetails)
                        }else{
                            console.log(chalk.red('invalid aws account settings'))
                            opn(awsmobileJSConstant.AWSCreateIAMUsersUrl, {wait: false})
                        }
                    })
                }
            })
        }
    }
}

function newUserSetup(){
    console.log('visit the following address to setup your aws account/user credentials:')
    console.log(chalk.green(awsmobileJSConstant.AWSCreateIAMUsersUrl))
    opn(awsmobileJSConstant.AWSCreateIAMUsersUrl, {wait: false})
    configureAWS(null, function(awsDetails){
        console.log()
        console.log('You must enable Mobile Hub service role before using the awsmobile cli')
        console.log('If you see Mobile Hub console, then it is already enabled')
        console.log(chalk.green(awsmobileJSConstant.AWSEnableMobileRoleUrl))
        opn(awsmobileJSConstant.AWSEnableMobileRoleUrl, {wait: false})
    })
}

function configureAWS(profileName, callback){
    if(profileName){
        console.log('setting awsmobile-cli to use named profile: ' + chalk.blue(profileName))
        let awsInfo = awsConfigFileManager.setProfile(profileName) 
        let awsConfig = JSON.parse(fs.readFileSync(awsInfo.AWSConfigFilePath, 'utf8'))
        if(callback){
            callback(constructAwsDetails(awsInfo, awsConfig))
        }
    }else{
        let awsDetails = resolveAWSConfig()
        let awsInfo = awsDetails.info
        let awsConfig = awsDetails.config

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
            let awsConfigChanged = false
            if(answers.accessKeyId){
                let newKeyId = answers.accessKeyId.trim()
                if(awsConfig.accessKeyId != newKeyId){
                    awsConfig.accessKeyId = newKeyId
                    awsConfigChanged = true
                }
            }
            if(answers.secretAccessKey){
                let newKey = answers.secretAccessKey.trim()
                if( awsConfig.secretAccessKey != newKey){
                    awsConfig.secretAccessKey = newKey
                    awsConfigChanged = true
                }  
            }
            if(answers.region){
                let newRegion = answers.region.trim()
                if( awsConfig.region != newRegion){
                    awsConfig.region = newRegion
                    awsConfigChanged = true
                }  
            }
            if(awsConfigChanged){
                let jsonString = JSON.stringify(awsConfig)
                fs.writeFileSync(awsInfo.AWSConfigFilePath, jsonString, 'utf8')
                awsConfigFileManager.setNoProfileSync(awsInfo)
            }

            if(callback){
                callback(awsDetails)
            }
        })
    }
}

function listAWSConfig(){
    let awsDetails = resolveAWSConfig()
    console.log()
    console.log('IsUsingProfile: ' + awsDetails.info.IsUsingProfile)
    if(awsDetails.info.IsUsingProfile){
        console.log('ProfiletName: ' + awsDetails.info.ProfiletName)
    }
    console.log()
    console.log(util.inspect(awsDetails.config, false, null))
    console.log()
}

function resolveAWSConfig(){
    let awsConfig = {}
    let awsInfo = awsConfigFileManager.resolve()
    try{
        awsConfig = JSON.parse(fs.readFileSync(awsInfo.AWSConfigFilePath, 'utf8'))
    }catch(e){
        awsConfig.accessKeyId = awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = awsmobileJSConstant.DefaultAWSSecretAccessKey
        awsConfig.region = awsmobileJSConstant.DefaultAWSRegion
    }
    
    return constructAwsDetails(awsInfo, awsConfig)
}

function constructAwsDetails(awsInfo, awsConfig){
    let result = {
        info: awsInfo,
        config: awsConfig
    }
    return result
}

module.exports = {
    checkAWSConfig,
    configureAWS,
    newUserSetup,
    listAWSConfig
}
  