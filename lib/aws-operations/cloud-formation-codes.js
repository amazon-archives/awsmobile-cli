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
const stackStatusCodes = [
    'NOT_YET_DEPLOYED',
    'CREATE_COMPLETE',
    'CREATE_IN_PROGRESS',
    'CREATE_FAILED',
    'DELETE_COMPLETE',
    'DELETE_FAILED',
    'DELETE_IN_PROGRESS',
    'REVIEW_IN_PROGRESS',
    'ROLLBACK_COMPLETE',
    'ROLLBACK_FAILED',
    'ROLLBACK_IN_PROGRESS',
    'UPDATE_COMPLETE',
    'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
    'UPDATE_IN_PROGRESS',
    'UPDATE_ROLLBACK_COMPLETE',
    'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
    'UPDATE_ROLLBACK_FAILED',
    'UPDATE_ROLLBACK_IN_PROGRESS'
]

const terminalState_NotDeployed = [
    'NOT_YET_DEPLOYED'
]

const terminalState_Complete = [
    'CREATE_COMPLETE',
    'DELETE_COMPLETE',
    'ROLLBACK_COMPLETE',
    'UPDATE_COMPLETE',
    'UPDATE_ROLLBACK_COMPLETE'
]

const terminalState_Failed = [
    'CREATE_FAILED',
    'DELETE_FAILED',
    'ROLLBACK_FAILED',
    'UPDATE_ROLLBACK_FAILED'
]

module.exports = {
    stackStatusCodes,
    terminalState_NotDeployed,
    terminalState_Complete,
    terminalState_Failed
}
  
