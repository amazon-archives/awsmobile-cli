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
const deepEqual = require('deep-equal')
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function dressForDevBackend(resolvers){
    resolvers.forEach(resolver=>{
        delete resolver.resolverArn
    })
    return resolvers
}

function diff(appsyncUpdateHandle){
    let diffMarkedResolvers = []
    let currentResolvers = appsyncUpdateHandle.currentAppsyncInfo.resolvers
    let devResolvers = appsyncUpdateHandle.devAppsyncInfo.resolvers
    if(devResolvers && devResolvers.length>0){
        for(let i=0;i<devResolvers.length; i++){
            let devResolver = devResolvers[i]
            let currentResolver
            if(currentResolvers && currentResolvers.length>0){
                for(let j=0;j<currentResolvers.length; j++){
                    if(currentResolvers[j].typeName==devResolver.typeName &&
                        currentResolvers[j].fieldName==devResolver.fieldName ){
                        currentResolver = currentResolvers[j]
                        break
                    }
                }
            }
            diffMarkedResolvers.push(markDiff(devResolver, currentResolver))
        }
    }
    if(currentResolvers && currentResolvers.length>0){
        for(let j=0;j<currentResolvers.length; j++){
            if(!currentResolvers[j][DIFF]){
                diffMarkedResolvers.push(markDiff(undefined, currentResolvers[j]))
            }
        }
    }
    diffMarkedResolvers = diffMarkedResolvers.filter(item=>item[DIFF] != NONE)
    return diffMarkedResolvers
}

function markDiff(devResolver, currentResolver){
    let result = devResolver
    if(!currentResolver){
        devResolver[DIFF] = CREATE
    }else if(!devResolver){
        currentResolver[DIFF] = DELETE
        result = currentResolver
    }else{
        if(deepEqual(devResolver, currentResolver)){
                devResolver[DIFF] = NONE
                currentResolver[DIFF] = NONE
        }else{
            devResolver[DIFF] = UPDATE
            currentResolver[DIFF] = UPDATE
        }
    }
    return result
}


module.exports = {
    dressForDevBackend, 
    diff
}
