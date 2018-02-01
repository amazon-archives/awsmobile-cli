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
const chalk = require('chalk')
const fs = require('fs-extra')
const os = require('os')

function setupAmplifyDependency(projectPath){
    let packageJsonFilePath = path.normalize(path.join(projectPath, 'package.json'))
    if(fs.existsSync(packageJsonFilePath)){
        let packageObj = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
        if(!packageObj.dependencies){
            packageObj.dependencies = {}
        }
        packageObj.dependencies["aws-amplify"] = "^0.2.0"
        let jsonString = JSON.stringify(packageObj, null, 2)
        fs.writeFileSync(packageJsonFilePath, jsonString, 'utf8')
    }
}

module.exports = {
    setupAmplifyDependency
}
