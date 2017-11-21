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
const moment = require('moment')

const awsmobileJSConstant = require('./awsmobilejs-constant.js')

function generateProjectName() 
{
    return 'awsmobilejs-' + makeid()
}

function generateBackendProjectName(projectInfo)
{
    return projectInfo.ProjectName + '-' + moment().format(awsmobileJSConstant.DateTimeFormatString)
}

function generateDeviceFarmTestRunName(projectInfo)
{
    return Date.now().toString()
}

function generateCloudFrontInvalidationReference(projectInfo)
{
    return Date.now().toString()
}


function makeid() {
  let text = ""
  let possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

  for (let i = 0; i < 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

module.exports = {
    generateProjectName,
    generateBackendProjectName,
    generateDeviceFarmTestRunName,
    generateCloudFrontInvalidationReference
}
  