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

const pathManager = require('../utils/awsmobilejs-path-manager.js')

function run(initInfo){
    console.log('caught')
    console.log(initInfo)
    if(initInfo.strategy){
        const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(initInfo.projectPath)
        fs.removeSync(awsmobilejsDirPath)
        if(initInfo.backupAWSMobileJSDirPath){
            fs.moveSync(initInfo.backupAWSMobileJSDirPath, awsmobilejsDirPath)
        }
    }
}

module.exports = {
    run
}
