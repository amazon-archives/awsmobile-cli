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
"use strict";
const AWS = require('aws-sdk')

const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const cliConfigManager = require('../utils/cli-config-manager.js')

function Mobile(awsDetails){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    AWS.config.update({region: 'us-east-1'}) 
    //mobile api is only available in us-ease-1, but mobile project can be created in other regions
   
    let awsmobileAPIEndpoint = awsmobileJSConstant.AWSMobileAPIEndPoint
    let cliConfig = cliConfigManager.getAWSMobileCLIConfig()
    if(cliConfig && cliConfig.isInDevMode && cliConfig.awsmobileAPIEndpoint){
        awsmobileAPIEndpoint = cliConfig.awsmobileAPIEndpoint
    } 
    const ep = new AWS.Endpoint(awsmobileAPIEndpoint)

    return new AWS.Mobile({endpoint: ep})
}

function S3(awsDetails, region){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    if(region){
        AWS.config.update({region: region})
    }

    return new AWS.S3()
}

function DynamoDB(awsDetails, region){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    if(region){
        AWS.config.update({region: region})
    }

    return new AWS.DynamoDB()
}

function Lambda(awsDetails, region){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})
    if(region){
        AWS.config.update({region: region})
    }

    return new AWS.Lambda()
}

function CloudFront(awsDetails){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})

    return new AWS.CloudFront()
}

function AppSync(awsDetails){
    AWS.config.loadFromPath(awsDetails.info.AWSConfigFilePath)
    AWS.config.update({customUserAgent: awsmobileJSConstant.CustomUserAgent})

    return new AWS.AppSync()
}

module.exports = {
    Mobile,
    S3,
    Lambda,
    DynamoDB,
    CloudFront,
    AppSync
}
  