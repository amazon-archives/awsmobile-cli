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
const fs = require('fs-extra')
const opn = require('opn')
const chalk = require('chalk')
const inquirer = require('inquirer')
const lineByLine = require('n-readlines')
const util = require('util')

const awsMobileRegions = require('./aws-regions.js').regions
const awsConfigInfoManager = require('./aws-config-info-manager.js')
const newUserHelper = require('./aws-config-new-user.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const dfops = require('../utils/directory-file-ops.js')


function checkAWSConfig(callback){
    let awsDetails = resolveAWSConfig(true)

    if(awsConfigInfoManager.validateAWSConfig(awsDetails.config)){
        callback(awsDetails)
    }else{
        if(awsConfigInfoManager.isNewUser(awsDetails)){
            console.log()
            console.log('awsmobile-cli could not resolve aws account settings')
            newUserHelper.setupNewUser(awsDetails, callback)
        }else{
            console.log(chalk.red('missing aws account settings'))
            inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'configureAWS',
                    message: 'configure aws account settings',
                    default: true
                }
            ]).then(function (answers) {
                if(answers.configureAWS){
                    setConfig(awsDetails, function(awsDetails){
                        if(awsConfigInfoManager.validateAWSConfig(awsDetails.config)){
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
    let awsDetails = resolveAWSConfig(true)
    if(awsConfigInfoManager.validateAWSConfig(awsDetails.config)){
        console.log('awsmobile-cli already has aws access credentials')
        listAWSConfig(awsDetails)
        enableMobileHubServiceRole()
        promptConfigInstruction()
    }else{
        newUserHelper.setupNewUser(awsDetails)
    }
}

function promptConfigInstruction(){
    console.log()
    console.log(chalk.gray('# to change the credentials for the awsmobile-cli'))
    console.log('    $ awsmobile configure aws')
    console.log()
    console.log(chalk.gray('# to set the awsmobile-cli to use a named profile for aws access'))
    console.log('    $ awsmobile configure aws --profile <name>')
}

function enableMobileHubServiceRole(){
    console.log()
    console.log('You must enable Mobile Hub service role before using the awsmobile cli')
    console.log('If you see Mobile Hub console, then it is already enabled')
    console.log(chalk.green(awsmobileJSConstant.AWSEnableMobileRoleUrl))
    opn(awsmobileJSConstant.AWSEnableMobileRoleUrl, {wait: false})
}

function setConfig(awsDetails, callback){
    if(!awsDetails){
        awsDetails = resolveAWSConfig(true)
    }
    
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
            awsConfigInfoManager.setNoProfileSync(awsInfo)
        }

        if(callback){
            callback(awsDetails)
        }
    })
}

function setProfile(profileName){
    console.log('Setting awsmobile-cli to use named profile: ' + chalk.blue(profileName))
    let isSuccessful = awsConfigInfoManager.setProfile(profileName) 
    console.log()
    if(isSuccessful){
        console.log('Done')
    }else{
        console.log('Failed to set profile ' + chalk.blue(profileName))
    }
}

function configureAWS(profileName){
    if(profileName){
        setProfile(profileName)
    }else{
        setConfig()
    }
}

function configureWithKeyAndRegion(keyID, key, region){
    awsDetails = resolveAWSConfig(true)
    let awsInfo = awsDetails.info
    let awsConfig = awsDetails.config
    let awsConfigChanged = false

    let newKeyID = keyID.trim()
    if(awsConfig.accessKeyId != newKeyID){
        awsConfig.accessKeyId = newKeyID
        awsConfigChanged = true
    }

    let newKey = key.trim()
    if( awsConfig.secretAccessKey != newKey){
        awsConfig.secretAccessKey = newKey
        awsConfigChanged = true
    }  
    
    let newRegion = region.trim()
    if( awsConfig.region != newRegion){
        awsConfig.region = newRegion
        awsConfigChanged = true
    }  

    if(awsConfigChanged){
        let jsonString = JSON.stringify(awsConfig)
        fs.writeFileSync(awsInfo.AWSConfigFilePath, jsonString, 'utf8')
        awsConfigInfoManager.setNoProfileSync(awsInfo)
    }
}

function listAWSConfig(){
    let awsDetails = resolveAWSConfig(true)
    console.log()
    console.log('IsUsingProfile: ' + awsDetails.info.IsUsingProfile)
    if(awsDetails.info.IsUsingProfile){
        console.log('ProfileName: ' + awsDetails.info.ProfileName)
    }
    console.log()
    console.log(util.inspect(awsDetails.config, false, null))
    console.log()
}

function resolveAWSConfig(silentFlag){
    let awsConfig = {}
    let awsInfo = awsConfigInfoManager.resolve(silentFlag)
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
    configureWithKeyAndRegion,
    newUserSetup,
    listAWSConfig
}
  