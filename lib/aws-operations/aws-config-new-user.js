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

const awsMobileRegions = require('./aws-regions.js').regions
const awsConfigFileManager = require('./aws-config-info-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const nameManager = require('../utils/awsmobilejs-name-manager.js')

function setupNewUser(awsDetails){
    let awsInfo = awsDetails.info
    let awsConfig = awsDetails.config
    
    console.log('Please follow these steps to setup your awsmobile access')
    console.log()
    console.log('Please sign up/in your aws account with Administrator Access:')
    console.log(chalk.green(awsmobileJSConstant.AWSAmazonUrl))
    opn(awsmobileJSConstant.AWSAmazonUrl, {wait: false})
    PressAnyKeyToContinue('Press any key to continue', function(){
        console.log('Please specify the new IAM user to be created for awsmobile-cli')
        inquirer.prompt([
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
            }
        ]).then(function (answers) {
            let deepLinkURL = awsmobileJSConstant.AWSCreateIAMUsersUrl.replace('{userName}', answers.userName).replace('{region}', answers.region)
            console.log('Please complete the user creation on the aws console')
            console.log(chalk.green(awsmobileJSConstant.AWSCreateIAMUsersUrl))
            opn(deepLinkURL, {wait: false})
            return answers.region
        }).then(function(region){
            PressAnyKeyToContinue('Press any key to continue', function(){
                console.log('Please enter the access key of the newly created user:')
                inquirer.prompt([
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
                    if(region){
                        let newRegion = region.trim()
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
                        console.log('Success!')
                        console.log('You have set the user credential for the awsmobile-cli')
                        promptConfigInstruction()
                    }else{
                        console.log()
                        console.log('Something went wrong, please try again')
                    }
                    process.exit()
                })
            })
        })
    })
}


function PressAnyKeyToContinue(message, callback){
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    console.log(message)
    process.stdin.once('data', function(data){
        if(callback){
            callback()
        }
    })
}


module.exports = {
    setupNewUser
}
  