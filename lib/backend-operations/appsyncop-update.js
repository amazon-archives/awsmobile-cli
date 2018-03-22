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
const moment = require('moment')
const _ = require('lodash')

const _featureName = 'appsync'

const awsClient = require('../aws-operations/aws-client.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../utils/awsmobilejs-constant.js')
const dfOps = require('../utils/directory-file-ops.js')

function run(projectInfo, awsDetails){
}

function updateAPI(projectInfo, awsDetails){
  let param = {
    apiId: projectInfo.AppSyncApiId,
    name: String,
    // authenticationType?: AuthenticationType,
    // userPoolConfig?: UserPoolConfig
  }
  let appsyncClient = awsClient.AppSync(awsDetails)
  return new Promise((resolve, reject) => {
    appsyncClient.updateGraphqlApi(param, (err, data)=>{
      if(err){
        console.log(err)
        reject(err)
      }else{
        console.log(data)
        resolve(data)
      }
    })
  })
}

function updateDataSource(projectInfo, awsDetails){
}

function updateResolver(projectInfo, awsDetails){
}

module.exports = {
  run
}
