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
const fs = require('fs-extra')
const jsyaml = require('js-yaml')
const chalk = require('chalk')
const _ = require('lodash')
const util = require('util')

const ymalSchema = require('./mobile-yaml-schema.js')

function readYamlFileSync(ymlFilePath, verbose){
    let backendProject
    try{
        let yml = fs.readFileSync(ymlFilePath)
        backendProject = jsyaml.safeLoad(yml, { schema: ymalSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5, noRefs: true, skipInvalid: true })
    }catch(e){
        if(verbose){
            console.log(chalk.red('error occured in parsing the yaml file:'))
            console.log(ymlFilePath)
            console.log(e)
        }
        backendProject = undefined
    }
    return backendProject
}

function writeYamlFileSync(obj, ymlFilePath){
    obj = ymalSchema.trimObject(obj)
    let yml = jsyaml.safeDump(obj, { schema: ymalSchema.AWS_MOBILE_YAML_SCHEMA, lineWidth: 10000, noCompatMode: true, scalarType: 5, noRefs: true, skipInvalid: true })
    yml = dressYmlForMobileHub(yml)
    fs.writeFileSync(ymlFilePath, yml, 'utf8')
}


function readJsonFileSync(jsonFilePath, verbose){
    let backendProject
    try{
        let rawBackendProject = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))
        backendProject = ymalSchema.dressObject(rawBackendProject)
    }catch(e){
        if(verbose){
            console.log(chalk.red('error occured in parsing the json file:'))
            console.log(jsonFilePath)
            console.log(e)
        }
        backendProject = undefined
    }
    return backendProject
}

function writeJsonFileSync(obj, jsonFilePath){
    let jsonString = JSON.stringify(obj, null, '\t')
    fs.writeFileSync(jsonFilePath, jsonString, 'utf8')
}


function dressYmlForMobileHub(yml){
    return '--- ' + yml.replace(/!<|>/g, '')
}

module.exports = {
    readYamlFileSync, 
    writeYamlFileSync,
    readJsonFileSync,
    writeJsonFileSync
}