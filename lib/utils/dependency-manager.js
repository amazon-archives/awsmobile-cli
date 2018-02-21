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
const chalk = require('chalk')
const { spawn } = require('child_process')

const dfOps = require('./directory-file-ops.js')

function insertAmplifyDependency(projectPath){
    let packageJsonFilePath = path.normalize(path.join(projectPath, 'package.json'))
    if(fs.existsSync(packageJsonFilePath)){
        let packageObj = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'))
        if(!packageObj.dependencies){
            packageObj.dependencies = {}
        }
        packageObj.dependencies["aws-amplify"] = "^0.2.0"
        let jsonString = JSON.stringify(packageObj, null, 2)
        fs.writeFileSync(packageJsonFilePath, jsonString, 'utf8')
    }
}

function setupAmplifyDependency(initInfo){
    let result = initInfo

    let projectPath = initInfo.projectPath
    if(!initInfo.packageJson){
        result = npmInit(projectPath)
        .then(npmInstallAmplify)
        .then((cwd)=>{
            initInfo.packageJson = dfOps.readJsonFile(path.normalize(path.join(projectPath, 'package.json')))
            return initInfo
        })
    }else{
        switch(initInfo.framework){
            case 'react': 
                result = yarnAddAmplify(projectPath)
                        .then(yarnAddAmplifyReact)
                        .then((cwd)=>{
                            return initInfo
                        })
            break
            case 'react-native': 
                result = yarnAddAmplify(projectPath)
                        .then(yarnAddAmplifyReactNative)
                        .then((cwd)=>{
                            return initInfo
                        })
            break
            default: 
                result = npmInstallAmplify(projectPath)
                        .then((cwd)=>{
                            return initInfo
                        })
            break
        }
    }

    return result
}

function npmInit(cwd){
    return spawnChildProcess('npm', ['init', '-y'], cwd)
}

function yarnInit(cwd){
    return spawnChildProcess('yarn', ['init', '-y'], cwd)
}

function npmInstallAmplify(cwd){
    return spawnChildProcess('npm', ['install', 'aws-amplify'], cwd)
}

function npmInstallAmplifyReact(cwd){
    return spawnChildProcess('npm', ['install', 'aws-amplify-react'], cwd)
}

function npmInstallAmplifyReactNative(cwd){
    return spawnChildProcess('npm', ['install', 'aws-amplify-react-native'], cwd)
}

function yarnAddAmplify(cwd){
    return spawnChildProcess('yarn', ['add', 'aws-amplify'], cwd)
}

function yarnAddAmplifyReact(cwd){
    return spawnChildProcess('yarn', ['add', 'aws-amplify-react'], cwd)
}

function yarnAddAmplifyReactNative(cwd){
    return spawnChildProcess('yarn', ['add', 'aws-amplify-react-native'], cwd)
}

function spawnChildProcess(command, args, cwd){
    return new Promise((resolve, reject)=>{
        console.log('Executing ' + command + ' ' + args.join(' ') + ' ...')
        let childProcess = spawn(command, args, {cwd: cwd, env: process.env, stdio: 'inherit'})
        childProcess.on('exit', function(code) {
            let codeString = code.toString()
            if(code != 0){
                codeString = chalk.red(code.toString())
            }
            console.log(command + ' ' + args.join(' ') + ' returned ' + codeString)
            console.log()
            resolve(cwd)
        })
    })
}

module.exports = {
    insertAmplifyDependency, 
    setupAmplifyDependency
}
