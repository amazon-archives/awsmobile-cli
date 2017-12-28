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
const path = require('path')
const archiver = require('archiver')

const awsMobileYamlOps = require('./mobile-yaml-ops.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')

function generateContents(projectInfo, backendProjectSpec, callback) {
    let tempContentYmlFilePath = pathManager.getBackendBuildYamlFilePath(projectInfo.ProjectPath)
    let backendBuildPath = pathManager.getBackendBuildDirPath(projectInfo.ProjectPath)
    let contentZipFilePath = pathManager.getBackendContentZipFilePath(projectInfo.ProjectPath)
    let zipInternalFilePath = 'awsmobile-cli-project/' + awsmobileJSConstant.BackendProjectYamlFileName

    if (!fs.pathExistsSync(backendBuildPath)) {
      fs.ensureDirSync(backendBuildPath);
    }
    awsMobileYamlOps.dumpYaml(backendProjectSpec, tempContentYmlFilePath)

    let output = fs.createWriteStream(contentZipFilePath)
    
    output.on('close', function() {
      fs.removeSync(tempContentYmlFilePath)
      if(callback){
        callback()
      }
    })

    let zip = archiver.create('zip', {})
    zip.pipe(output)
    zip.append(fs.createReadStream(tempContentYmlFilePath), {name: zipInternalFilePath})
    zip.finalize()
}

module.exports = {
  generateContents
}

