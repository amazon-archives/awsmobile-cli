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
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function dressForDevBackend(apiKeys){
    for(let i=0;i<apiKeys.length;i++){
        apiKeys[i].id = awsmobilejsConstant.ByAWSMobileCLI + ':' + i
    }
    return apiKeys
}

function diff(appsyncUpdateHandle){
    let diffMarkedApiKeys = []
    let currentApiKeys = appsyncUpdateHandle.currentAppsyncInfo.apiKeys
    let devApiKeys = appsyncUpdateHandle.devAppsyncInfo.apiKeys
    if(devApiKeys && devApiKeys.length>0){
        for(let i=0;i<devApiKeys.length;i++){
            let devApiKey = devApiKeys[i]
            let currentApiKey
            let regex = new RegExp('^'+awsmobilejsConstant.ByAWSMobileCLI)
            // if(/^{managed-by-awsmobile-cli}/.test(devApiKey.id)){
            if(regex.test(devApiKey.id)){
                let strs = devApiKey.id.split(':')
                if(strs.length>1){
                    let index = parseInt(strs[1])
                    if(!isNaN(index) && index < currentApiKeys.length){
                        currentApiKey = currentApiKeys[index]
                    }
                }
            }else if(currentApiKeys && currentApiKeys.length>0){
                for(let j=0;j<currentApiKeys.length;j++){
                    if(devApiKey.id == currentApiKeys[i].id){
                        currentApiKey = currentApiKeys[i]
                        break
                    }
                }
            }
            diffMarkedApiKeys.push(markDiff(devApiKey, currentApiKey))
        }
    }

    if(currentApiKeys && currentApiKeys.length>0){
        for(let j=0;j<currentApiKeys.length;j++){
            if(!currentApiKeys[j][DIFF]){
                diffMarkedApiKeys.push(markDiff(undefined, currentApiKeys[j]))
            }
        }
    }

    diffMarkedApiKeys = diffMarkedApiKeys.filter(item=>item[DIFF] != NONE)
    return diffMarkedApiKeys
}

function markDiff(devApiKey, currentApiKey){
    let result = devApiKey
    if(!currentApiKey){
        devApiKey[DIFF] = CREATE
    }else if(!devApiKey){
        currentApiKey[DIFF] = DELETE
        result = currentApiKey
    }else{
        if(devApiKey.description == currentApiKey.description && 
            devApiKey.expires == currentApiKey.expires){
            devApiKey[DIFF] = NONE
            currentApiKey[DIFF] = NONE
        }else{
            devApiKey[DIFF] = UPDATE
            currentApiKey[DIFF] = UPDATE
        }
    }
    return result
}

module.exports = {
    dressForDevBackend, 
    diff
}
