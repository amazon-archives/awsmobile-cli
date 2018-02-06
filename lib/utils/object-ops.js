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
function sortByPropertyKey(obj){
    let ordered = {}
    Object.keys(obj).sort().forEach(function(key) {
        ordered[key] = obj[key]
    })
    return ordered
}

function slice(obj, start, end){
    let sliced = new Object()
    let keys = Object.keys(obj)
    let length = keys.length
    for(let i = start; i < end; i++){
        let key = keys[i]
        sliced[key] = this[key]
    }
    return sliced
}

module.exports = {
    sortByPropertyKey,
    slice
}
