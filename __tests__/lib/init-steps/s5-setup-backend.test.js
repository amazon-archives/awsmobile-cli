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

const backendCreate = require('../backend-create.js')
const backendImport = require('../backend-import.js')
const backendRetrieve = require('../backend-retrieve.js')

//if initInto.strategy is not set, the setup-backend step will not carry out any actions
// const strategy = [
//     'create', //use the default yaml to create a mobile project as the backend
//     'import', //if a valid backend spec is already in the project, create a mobile project based on it as the backend
//     'link', //if a mobile project id is in the command arguments, link to it as the backend
// ]

function run(initInfo){
    let result = initInfo
    switch(initInfo.strategy){
        case 'create':
            result = createBackend(initInfo)
        break
        case 'import': 
            result = importBackend(initInfo)
        break
        case 'link':
            result = linkBackend(initInfo)
        break
    }
    return result
}

function createBackend(initInfo){
    return new Promise((resolve, reject)=>{
        backendCreate.createBackendProject(initInfo.projectInfo, {useDefault: true, syncToDevFlag: 1}, function(){
            resolve(initInfo) 
        })
    })
}

function importBackend(initInfo){
    return new Promise((resolve, reject)=>{
        backendImport.run(initInfo.projectInfo, function(){
                resolve(initInfo) 
        })
    })
}

function linkBackend(initInfo){
    return new Promise((resolve, reject)=>{
        backendRetrieve.linkToBackend(initInfo.projectInfo, initInfo.mobileProjectID, 1, function(){
            resolve(initInfo) 
        })
    })
}

module.exports = {
    run
}
