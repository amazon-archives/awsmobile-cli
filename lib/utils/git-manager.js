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

const pathManager = require('./awsmobilejs-path-manager.js')

function initialize(projectPath)
{
    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath)
    if(fs.existsSync(gitIgnoreFilePath)){

        let newGitIgnoreString = ''
        let gitIgnoreStringArray = fs.readFileSync(gitIgnoreFilePath, 'utf8').split(os.EOL)
        let isInserted = false

        for(let i=0; i<gitIgnoreStringArray.length; i++){
            if(!gitIgnoreStringArray[i].includes('awsmobilejs')){
                newGitIgnoreString += gitIgnoreStringArray[i] + os.EOL
            }else{
                if(!isInserted){
                    newGitIgnoreString = newGitIgnoreString.trim()
                    newGitIgnoreString += getGitIgnoreAppendString()
                    isInserted = true
                }
            }
        }

        if(!isInserted){
            newGitIgnoreString = newGitIgnoreString.trim()
            newGitIgnoreString += getGitIgnoreAppendString()
        }

        newGitIgnoreString = newGitIgnoreString.trim()
        fs.writeFileSync(gitIgnoreFilePath, newGitIgnoreString)

    }else{
        fs.writeFileSync(gitIgnoreFilePath, getGitIgnoreAppendString().trim())
    }
}

function onAWSMobileJSRemove(projectPath)
{
    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath)
    if(fs.existsSync(gitIgnoreFilePath)){
        let newGitIgnoreString = ''
        let gitIgnoreStringArray = fs.readFileSync(gitIgnoreFilePath, 'utf8').split(os.EOL)

        let isInRemoval = false

        for(let i=0; i<gitIgnoreStringArray.length; i++){
            let newLine = gitIgnoreStringArray[i]
            if(!newLine.includes('awsmobilejs')){
                if(newLine.length > 0){
                
                    if(isInRemoval){
                        newGitIgnoreString = newGitIgnoreString.trim()
                        newGitIgnoreString += os.EOL + os.EOL
                        isInRemoval = false
                    }

                    newGitIgnoreString += gitIgnoreStringArray[i] + os.EOL
                }
            }else{
                isInRemoval = true
            }
        }
        newGitIgnoreString = newGitIgnoreString.trim()
        fs.writeFileSync(gitIgnoreFilePath, newGitIgnoreString)
    }
}

function getGitIgnoreAppendString(){
    let toAppend = os.EOL  + os.EOL +
    '#awsmobilejs' + os.EOL +
    'awsmobilejs/.awsmobile/backend-build' + os.EOL +
    'awsmobilejs/\\#current-backend-info' + os.EOL

    return toAppend
}

module.exports = {
    initialize,
    onAWSMobileJSRemove
}
