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
const chalk = require('chalk')
const lineByLine = require('n-readlines')

const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

function getSystemConfig(profileName, silentFlag){
    let awsConfig
    let sysCredential = readSystemAwsCredential(profileName, silentFlag)
    if(sysCredential){
        awsConfig = {}
        awsConfig.accessKeyId = sysCredential.aws_access_key_id ? sysCredential.aws_access_key_id : awsmobileJSConstant.DefaultAWSAccessKeyId
        awsConfig.secretAccessKey = sysCredential.aws_secret_access_key ? sysCredential.aws_secret_access_key : awsmobileJSConstant.DefaultAWSSecretAccessKey
    }

    if(awsConfig){

        let sysConfig = readSystemAwsConfig(profileName, silentFlag)

        if(sysConfig){
            awsConfig.region = sysConfig.region ? sysConfig.region : awsmobileJSConstant.DefaultAWSRegion
        }else{
            awsConfig = undefined
        }
    }

    return awsConfig
}

function readSystemAwsConfig(profileName, silentFlag)
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
                if(!silentFlag){
                    console.log()
                    console.log(chalk.red('profile ') + chalk.blue(profileName) + chalk.red(' is not found in aws-cli config file') )
                    console.log('aws-cli config file queried:')
                    console.log(sysConfigFilePath)
                }
            }
        }catch(e){
            if(!silentFlag){
                console.log()
                console.log(chalk.red('error reading config for profile ' + profileName))
                console.log('aws-cli config file queried:')
                console.log(sysConfigFilePath)
                console.log(e)
                result = undefined
            }
        }
    }else{
        if(!silentFlag){
            console.log()
            console.log(chalk.red('no aws-cli config file is found'))
            console.log('aws-cli config file queried:')
            console.log(sysConfigFilePath)
        }
    }

    return result
}

function readSystemAwsCredential(profileName, silentFlag)
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
                if(!silentFlag){
                    console.log()
                    console.log(chalk.red('profile ') + chalk.blue(profileName) + chalk.red(' is not found in aws-cli credentials file') )
                    console.log('aws-cli credentials file queried:')
                    console.log(sysCredentialsFilePath)
                }
            }
        }catch(e){
            if(!silentFlag){
                console.log()
                console.log(chalk.red('error reading credentials for profile ' + profileName))
                console.log('aws-cli credentials file queried:')
                console.log(sysCredentialsFilePath)
                console.log(e)
                result = undefined
            }
        }
    }else{
        if(!silentFlag){
            console.log()
            console.log(chalk.red('no aws-cli credentials file is found'))
            console.log('aws-cli credentials file queried:')
            console.log(sysCredentialsFilePath)
        }
    }
    return result
}


module.exports = {
   getSystemConfig
}
  