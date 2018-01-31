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
const fs = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')

const starterURLMapping = require('./utils/starter-url-mapping.js')

function start(projectName, starterName){
    
}

function list(){   
    console.log(chalk.gray('    # awsmobile features'))
    for(var starter in starterURLMapping){
        console.log('      ' + starter)
    }
}

module.exports = {
    start,
    list
}

