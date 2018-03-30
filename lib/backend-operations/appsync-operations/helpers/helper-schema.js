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
const os = require('os')
const awsmobilejsConstant = require('../../../utils/awsmobilejs-constant.js')
const DIFF = awsmobilejsConstant.DiffMark
const CREATE = awsmobilejsConstant.DiffMark_Create
const UPDATE = awsmobilejsConstant.DiffMark_Update
const NONE = awsmobilejsConstant.DiffMark_None
const DELETE = awsmobilejsConstant.DiffMark_Delete

function diff(appsyncUpdateHandle){
    let result
    let currentSchema = appsyncUpdateHandle.currentAppsyncInfo.schema
    let devSchema = appsyncUpdateHandle.devAppsyncInfo.schema

    if(schemaEqual(devSchema, currentSchema)){
        devSchema[DIFF] = NONE
        currentSchema[DIFF] = NONE
    }else{
        devSchema[DIFF] = UPDATE
        currentSchema[DIFF] = UPDATE
        result = devSchema
    }

    return result
}

function schemaEqual(devSchema, currentSchema){
    let result = true
   let devSchemaLines = devSchema.definition.split(os.EOL).filter(line=>line.trim().length>0)
   let currentSchemaLines = currentSchema.definition.split(os.EOL).filter(line=>line.trim().length>0)

   let devLineCount = devSchemaLines.length
   let currentLineCount = currentSchemaLines.length

   if(devLineCount == currentLineCount){
        for(let i=0; i<devLineCount; i++){
            if(devSchemaLines[i]!=currentSchemaLines[i]){
                result = false
                break
            }
        }
   }else{
       result = false
   }

   return result
}




module.exports = {
    diff
}
