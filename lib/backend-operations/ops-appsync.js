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
const moment = require('moment')
const path = require('path')
const chalk = require('chalk')
const opn = require('opn')

const projectInfoManager = require('../project-info-manager.js')
const appsyncManager = require('./appsync-operations/appsync-manager.js')
const appsyncCreate = require('./appsync-operations/ops-appsync-create.js')
const appsyncRetrieve = require('./appsync-operations/ops-appsync-retrieve.js')
const appsyncUpdate = require('./appsync-operations/ops-appsync-update.js')
const appsyncDelete = require('./appsync-operations/ops-appsync-delete.js')
const apiKeysHelper = require('./appsync-operations/helpers/helper-apiKeys.js')
const dataSourceHelper = require('./appsync-operations/helpers/helper-dataSources.js')
const graphqlHelper = require('./appsync-operations/helpers/helper-graphqlApi.js')
const resolversHelper = require('./appsync-operations/helpers/helper-resolvers.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')
const awsConfigManager = require('../aws-operations/aws-config-manager.js')
const dfOps = require('../utils/directory-file-ops.js')
const dependencyManager = require('../utils/dependency-manager.js')

const _featureName = 'appsync'
const _featureCommands = {
    'console': 'open the web console of the appsync api associated with this project'
}

let _featureBuildDirPath
let _projectInfo
let _awsConfig
let _backendProjectDetails
let _callback


function specify(projectInfo) {
    try{
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.specify(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' feature specification error:'))
        console.log(e)
    }
}

function hasCommand(command){
    return _featureCommands.hasOwnProperty(command)
}

function runCommand(command, projectInfo, args){
    switch(command){
        case 'console': 
            commandConsole(projectInfo, args)
        break
        default: 
            console.log(chalk.red('awsmobile ' + _featureName + ' does NOT recognize the command: ' + command))
        break
    }
}

function commandConsole(projectInfo, args){
    let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)
    if(appsyncInfo && appsyncInfo.AppSyncConsoleUrl && appsyncInfo.AppSyncConsoleUrl.length > 0){
        console.log(chalk.green(appsyncInfo.AppSyncConsoleUrl))
        opn(appsyncInfo.AppSyncConsoleUrl, {wait: false})
    }else{
        console.log(chalk.red('can not locate the appsync console url'))
        console.log(chalk.gray('# to retrieve the latest details of the backend awsmobile project'))
        console.log('    $ awsmobile pull')
    }
}

function onFeatureTurnOn(projectInfo, backendProjectSpec){
    try{
        appsyncManager.enable(projectInfo.ProjectPath)
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.onFeatureTurnOn(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOn error:'))
        console.log(e)
    }
}

function onFeatureTurnOff(projectInfo, backendProjectSpec){
    try{
        appsyncManager.disable(projectInfo.ProjectPath)
        const projectFeatureOps = require(pathManager.getProjectFeatureOpsFilePath(_featureName))
        projectFeatureOps.onFeatureTurnOff(projectInfo)
    }catch(e){
        console.log(chalk.red(_featureName + ' onFeatureTurnOff error:'))
        console.log(e)
    }
}

function build(projectInfo, backendProject, callback){
    if(callback){
        callback(false)
    }
}

function preBackendUpdate(projectInfo, awsDetails, backendProjectDetails, callback) {
    if(callback){
        callback()
    }
}

//////////////////// sync backend project ////////////////////
function syncCurrentBackendInfo(projectInfo, backendDetails, awsDetails, callback){
    appsyncRetrieve.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function syncToDevBackend(projectInfo, backendProject, enabledFeatures){
    let currentFeatureInfoDirPath = pathManager.getCurrentBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
    let backendFeatureDirPath = pathManager.getBackendFeatureDirPath(projectInfo.ProjectPath, _featureName)
    if(fs.existsSync(currentFeatureInfoDirPath)){
        fs.ensureDirSync(backendFeatureDirPath)
        //resolver-mappings
        let srcResolverMappingsDirPath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
        let desResolverMappingsDirPath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncResolverMappingsDirName)
        if(fs.existsSync(srcResolverMappingsDirPath)){
            fs.copySync(srcResolverMappingsDirPath, desResolverMappingsDirPath)
        }
        //apiKeys
        let srcApiKeysFilePath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncApiKeysFileName)
        let desApiKeysFilePath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncApiKeysFileName)
        let apiKeys = dfOps.readJsonFile(srcApiKeysFilePath)
        if(apiKeys && apiKeys.length > 0){
            apiKeysHelper.dressForDevBackend(apiKeys)
            dfOps.writeJsonFile(desApiKeysFilePath, apiKeys)
        }
        //dataSources.json
        let srcDataSourcesFilePath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncDataSourcesFileName)
        let desDataSourcesFilePath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncDataSourcesFileName)
        let dataSources = dfOps.readJsonFile(srcDataSourcesFilePath)
        if(dataSources){
            dataSourceHelper.dressForDevBackend(dataSources)
            dfOps.writeJsonFile(desDataSourcesFilePath, dataSources)
        }
        //graphqlApi.json
        let srcGraphqlApiFilePath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncGraphqlApiFileName)
        let desGraphqlApiFilePath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncGraphqlApiFileName)
        let gaphqlApi = dfOps.readJsonFile(srcGraphqlApiFilePath)
        if(gaphqlApi){
            graphqlHelper.dressForDevBackend(gaphqlApi)
            dfOps.writeJsonFile(desGraphqlApiFilePath, gaphqlApi)
        }
        //resolvers.json
        let srcResolversFilePath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncResolversFileName)
        let desResolversFilePath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncResolversFileName)
        let resolvers = dfOps.readJsonFile(srcResolversFilePath)
        if(resolvers && resolvers.length > 0){
            resolversHelper.dressForDevBackend(resolvers)
            dfOps.writeJsonFile(desResolversFilePath, resolvers)
        }
        //schema.graphql
        let srcSchemaFilePath = path.join(currentFeatureInfoDirPath, awsmobilejsConstant.AppSyncSchemaFileName)
        let desSchemaFilePath = path.join(backendFeatureDirPath, awsmobilejsConstant.AppSyncSchemaFileName)
        if(fs.existsSync(srcSchemaFilePath)){
            fs.copySync(srcSchemaFilePath, desSchemaFilePath)
        }

        //update project info timestamp
        let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)  
        if(!appsyncInfo){
            appsyncInfo = {}
        }
        appsyncInfo.lastSyncToDevTime = moment().format(awsmobilejsConstant.DateTimeFormatString)
        delete appsyncInfo.freshLocalEnableDisableFlag
        appsyncManager.setAppSyncInfo(projectInfo.ProjectPath, appsyncInfo)
    }
}

////////////////////////extras for appsync
function createApi(projectInfo, awsDetails, callback) {
    appsyncCreate.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function retrieveApi(projectInfo, awsDetails, callback) {
    appsyncRetrieve.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function updateApi(projectInfo, awsDetails, callback) {
    let appsyncInfo = appsyncManager.getAppSyncInfo(projectInfo.ProjectPath)
    if(appsyncInfo){
        if(appsyncInfo.freshLocalEnableDisableFlag){
            switch(appsyncInfo.freshLocalEnableDisableFlag){
                case 'enable': 
                    createApi(projectInfo, awsDetails, callback)
                break
                case 'disable': 
                    deleteApi(projectInfo, awsDetails, callback)
                break
            }
        }else if(getEnabledFeatures(projectInfo.ProjectPath).length > 0){
            appsyncUpdate.run(projectInfo, awsDetails).then(()=>{
                if(callback){
                    callback()
                }
            })
        }else{
            if(callback){
                callback()
            }
        }
    }else{
        if(callback){
            callback()
        }
    }
}

function deleteApi(projectInfo, awsDetails, callback) {
    appsyncDelete.run(projectInfo, awsDetails).then(()=>{
        if(callback){
            callback()
        }
    })
}

function getAppSyncJS(projectPath){
    return appsyncManager.getAppSyncJS(projectPath)
}

function getEnabledFeatures(projectPath){
    return appsyncManager.getEnabledFeatures(projectPath)
}

module.exports = {
    featureName: _featureName,
    featureCommands: _featureCommands,
    specify,
    hasCommand,
    runCommand,
    onFeatureTurnOn,
    onFeatureTurnOff,
    build,
    preBackendUpdate,
    syncCurrentBackendInfo,
    syncToDevBackend,
////////////////////////extras for appsync
    createApi,
    retrieveApi,
    updateApi,
    deleteApi,
    getAppSyncJS,
    getEnabledFeatures
}