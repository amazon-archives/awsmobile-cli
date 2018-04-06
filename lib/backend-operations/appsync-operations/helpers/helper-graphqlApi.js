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
const dataSourceType = ["AWS_LAMBDA", "AMAZON_DYNAMODB", "AMAZON_ELASTICSEARCH"]
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function dressForDevBackend(graphqlApi){
    delete graphqlApi.apiId
    delete graphqlApi.arn
    delete graphqlApi.uris
    return graphqlApi
}

function diff(appsyncUpdateHandle){
    let result 
    let currentApi = appsyncUpdateHandle.currentAppSyncInfo.graphqlApi
    let devApi = appsyncUpdateHandle.devAppSyncInfo.graphqlApi
    let regex = new RegExp('^'+awsmobilejsConstant.ByAWSMobileCLI)

    if(regex.test(devApi.name)){
        devApi.name = currentApi.name
    }
    currentApi = dressForDevBackend(currentApi)
    
    if(deepEqual(devApi, currentApi)){
        devApi[DIFF] = NONE
        currentApi[DIFF] = NONE
    }else{
        devApi[DIFF] = UPDATE
        currentApi[DIFF] = UPDATE
        result = devApi
    }
    return result
}

module.exports = {
    dressForDevBackend, 
    diff
}
