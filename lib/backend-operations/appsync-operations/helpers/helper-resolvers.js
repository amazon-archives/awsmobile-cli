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
const path = require('path')
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
    let currentResolvers = dressForDevBackend(appsyncUpdateHandle.currentAppSyncInfo.resolvers)
    let devResolvers = appsyncUpdateHandle.devAppSyncInfo.resolvers
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

function writeResolverMappings(containerDirPath, resolver){
    let resolverMappingsDirPath = path.join(containerDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    fs.ensureDirSync(resolverMappingsDirPath)
  
    let requestMappingFileName = resolver.typeName + '.' + resolver.fieldName + '.request'
    let responseMappingFileName = resolver.typeName + '.' + resolver.fieldName + '.response'

    let requestMappingFilePath = path.join(resolverMappingsDirPath, requestMappingFileName)
    let responseMappingFilePath = path.join(resolverMappingsDirPath, responseMappingFileName)
  
    fs.writeFileSync(requestMappingFilePath, resolver.requestMappingTemplate)
    fs.writeFileSync(responseMappingFilePath, resolver.responseMappingTemplate)
  
    resolver.requestMappingTemplate = awsmobilejsConstant.ByAWSMobileCLI + ':' + requestMappingFileName
    resolver.responseMappingTemplate = awsmobilejsConstant.ByAWSMobileCLI + ':' + responseMappingFileName
}

function readResolverMappings(containerDirPath, resolver){
    let resolverMappingsDirPath = path.join(containerDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
    if(fs.existsSync(resolverMappingsDirPath)){
        let regex = new RegExp('^'+awsmobilejsConstant.ByAWSMobileCLI)

        if(regex.test(resolver.requestMappingTemplate)){
            let requestMappingFileName = resolver.typeName + '.' + resolver.fieldName + '.request'
            let strs = resolver.requestMappingTemplate.split(':')
            if(strs.length > 1){
                requestMappingFileName = strs[1]
            }
            let requestMappingFilePath = path.join(resolverMappingsDirPath, requestMappingFileName)
            if(fs.existsSync(requestMappingFilePath)){
                resolver.requestMappingTemplate = fs.readFileSync(requestMappingFilePath).toString()
            }else{
                throw new Error('can not find mapping file: ' + requestMappingFilePath)
            }
        }
        
        if(regex.test(resolver.responseMappingTemplate)){
            let responseMappingFileName = resolver.typeName + '.' + resolver.fieldName + '.response'
            let strs = resolver.responseMappingTemplate.split(':')
            if(strs.length > 1){
                let responseMappingFileName = strs[1]
            }
            let responseMappingFilePath = path.join(resolverMappingsDirPath, responseMappingFileName)
            if(fs.existsSync(responseMappingFilePath)){
                resolver.responseMappingTemplate = fs.readFileSync(responseMappingFilePath).toString()
            }else{
                throw new Error('can not find mapping file: ' + responseMappingFilePath)
            }
        }
    }
}

module.exports = {
    writeResolverMappings,
    readResolverMappings,
    dressForDevBackend, 
    diff
}
