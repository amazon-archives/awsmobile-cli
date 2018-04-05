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

const awsMobileRegions = require('./aws-regions.js').regions
const awsConfigFileManager = require('./aws-config-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')
const pressEnterKeyToContinue = require('../utils/press-enter-to-continue.js')

function setupNewUser(awsDetails, callback){
    let awsInfo = awsDetails.info
    let awsConfig = awsDetails.config
    let userSelectedRegion = 'us-east-1'
    
    console.log('Please follow these steps to setup your awsmobile access')
    console.log()
    console.log('Please sign up/in your aws account with Administrator Access:')
    console.log(chalk.green(awsmobileJSConstant.AWSAmazonConsoleUrl))
    opn(awsmobileJSConstant.AWSAmazonConsoleUrl, {wait: false})

    return pressEnterKeyToContinue.run({message: 'Press Enter to continue'})
    .then((handle)=>{
        console.log('Please specify the new IAM user to be created for awsmobile-cli')
        return inquirer.prompt([
            {
                type: 'input',
                name: 'userName',
                message: "user name: ",
                default: nameManager.generateIAMUserName()
            },
            {
                type: 'list',
                name: 'region',
                message: "region: ",
                choices: awsMobileRegions,
                default: 'us-east-1'
            }])
    }).then((answers)=>{
        let deepLinkURL = awsmobileJSConstant.AWSCreateIAMUsersUrl.replace('{userName}', answers.userName).replace('{region}', answers.region)
        console.log('Please complete the user creation on the aws console')
        console.log(chalk.green(deepLinkURL))
        opn(deepLinkURL, {wait: false})
        userSelectedRegion = answers.region
        return answers.region
    }).then((userSelectedRegion)=>{
        return pressEnterKeyToContinue.run({message: 'Press Enter to continue'})
    }).then((handle)=>{
        console.log('Please enter the access key of the newly created user:')
        return inquirer.prompt([
                {
                    type: 'input',
                    name: 'accessKeyId',
                    message: "accessKeyId: ",
                    default: awsmobileJSConstant.DefaultAWSAccessKeyId
                },
                {
                    type: 'input',
                    name: 'secretAccessKey',
                    message: "secretAccessKey: ",
                    default: awsmobileJSConstant.DefaultAWSSecretAccessKey
                }
            ])
    }).then((answers)=>{
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
        if(userSelectedRegion){
            let newRegion = userSelectedRegion.trim()
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
        return awsConfig
    }).then(function(awsConfig){
        if(awsConfigFileManager.validateAWSConfig(awsDetails.config)){
            console.log()
            console.log('Successfully set the aws configurations for the awsmobile-cli')
            if(callback){
                console.log()
                callback(awsDetails)
            }else{
                promptConfigInstruction()
                process.exit()
            }
        }else{
            console.log()
            console.log('Something went wrong, please try again')
            process.exit()
        }
    })
}

function promptConfigInstruction(){
    console.log()
    console.log(chalk.gray('# to change the credentials for the awsmobile-cli'))
    console.log('    $ awsmobile configure aws')
    console.log()
    console.log(chalk.gray('# to set the awsmobile-cli to use a named profile for aws access'))
    console.log('    $ awsmobile configure aws --profile <name>')
}

module.exports = {
    setupNewUser
}
  