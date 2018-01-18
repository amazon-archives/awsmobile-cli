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
"use strict";
const AWS = require('aws-sdk')

const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const cliConfigManager = require('../utils/cli-config-manager.js')
const awsConfigFileManager = require('./aws-config-file-manager.js')

function Mobile(awsDetails){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    AWS.config.update({region: 'us-east-1'}) 
    //mobile api is only available in us-ease-1, but mobile project can be created in other regions
   
    let awsmobileAPIEndpoint = awsmobileJSConstant.AWSMobileAPIEndPoint
    let _cliConfig = cliConfigManager.getAWSMobileCLIConfig()
    if(_cliConfig && _cliConfig.isInDevMode && _cliConfig.isUsingBetaConsole){
        awsmobileAPIEndpoint = awsmobileJSConstant.AWSMobileAPIEndPoint_Gamma
    } 
    const ep = new AWS.Endpoint(awsmobileAPIEndpoint)

    return new AWS.Mobile({endpoint: ep})
}

function S3(region){
    const awsConfigFilePath = awsConfigFileManager.getAWSConfigFilePath()
    AWS.config.loadFromPath(awsConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    if(region){
        AWS.config.update({region: region})
    }

    return new AWS.S3()
}

function Lambda(region){
    const awsConfigFilePath = awsConfigFileManager.getAWSConfigFilePath()
    AWS.config.loadFromPath(awsConfigFilePath)
    if(region){
        AWS.config.update({region: region})
    }

    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    return new AWS.Lambda()
}

function CloudFront(awsDetails){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})

    return new AWS.CloudFront()
}

module.exports = {
    Mobile,
    S3,
    Lambda,
    CloudFront
}
  