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
const fs = require('fs-extra')

const pathManager = require('./awsmobilejs-path-manager.js')

function getAWSMobileCLIConfig()
{
    let cliConfig

    let cliConfigFilePath = pathManager.getAWSMobileCLIConfigFilePath()
    if(fs.existsSync(cliConfigFilePath)){
        try{
            cliConfig = JSON.parse(fs.readFileSync(cliConfigFilePath, 'utf8'))
        }catch(e){
            cliConfig = undefined
        }
    }else{
        cliConfig = undefined
    }
    return cliConfig
}

//this is a sample json to be put in ~/.awsmobilejs/awsmobile-cli-config.json
//when the file exists and isInDevMode is set to true, the cli will use
//awsmobileAPIEndpoint or deviceFarmTestUrl set in the file instead of the
//production ones.
const cliConfigTemplate =
{
    "isInDevMode": true,
    "awsmobileAPIEndpoint": "http://awsmobileservi-elb-d6tjnnbm3de3-1999395208.us-east-1.elb.amazonaws.com/",
    "deviceFarmTestUrl": 'https://aws-mobile-hub-beta.amazon.com/mobilehub/home#/webtest/',
}

module.exports = {
    getAWSMobileCLIConfig
}