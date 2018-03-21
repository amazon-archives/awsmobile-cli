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

function constructCreateRoleParam(appsyncCreationHandle)
{
  let RoleName = constructRoleName(appsyncCreationHandle)
  let Description = constructDescription(appsyncCreationHandle)
  let Path = constructPath(appsyncCreationHandle)
  let AssumeRolePolicyDocument = constructAssumeRolePolicyDocument(appsyncCreationHandle)
    
  let result = {
    RoleName,
    Description,
    Path,
    AssumeRolePolicyDocument
  }

  return result
}

function constructRoleName(appsyncCreationHandle){
    return ""
}

function constructDescription(appsyncCreationHandle){
    return ""
}

function constructPath(appsyncCreationHandle){
    return ""
}

function constructAssumeRolePolicyDocument(appsyncCreationHandle){
    /**
     * The trust relationship policy document that grants an entity permission to assume the role. The regex pattern used to validate this parameter is a string of characters consisting of any printable ASCII character ranging from the space character (\u0020) through end of the ASCII character range as well as the printable characters in the Basic Latin and Latin-1 Supplement character set (through \u00FF). It also includes the special characters tab (\u0009), line feed (\u000A), and carriage return (\u000D).
     */
    return ""
}

module.exports = {
  constructCreateRoleParam
}
