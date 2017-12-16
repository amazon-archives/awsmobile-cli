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
const path = require('path')
const chalk = require('chalk')
const mime = require('mime-types')
const opn = require('opn')
const ora = require('ora')
const moment = require('moment')

const projectInfoManager = require('./project-info-manager.js')
const projectAppBuilder = require('./project-frontend-builder.js')
const projectBackendBuilder = require('./project-backend-builder.js')
const awsConfigManager = require('./aws-operations/aws-config-manager.js')
const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const awsClient = require('./aws-operations/aws-client.js')
const hostingOps = require('./backend-operations/ops-hosting.js')
const dfops = require('./utils/directory-file-ops.js')
const publishIgnore = require('./utils/awsmobilejs-publish-ignore.js')
const pathManager = require('./utils/awsmobilejs-path-manager.js')
const nameManager = require('./utils/awsmobilejs-name-manager.js')
const backendInfoManager = require('./backend-operations/backend-info-manager.js')
const opsProject = require('./backend-operations/ops-project.js')
const awsmobileJSConstant = require('./utils/awsmobilejs-constant.js')
const cliConfigManager = require('./utils/cli-config-manager.js')

let _projectInfo
let _backendDetails
let _awsConfig 
let _hostingInfo 
let _testFlag
let _cloudFrontFlag

function publish(testFlag, cloudFrontFlag) {
    _projectInfo = projectInfoManager.getProjectInfo()
    if(_projectInfo){
        awsConfigManager.checkAWSConfig(function(awsConfig){
            _testFlag = testFlag
            _cloudFrontFlag = cloudFrontFlag
            _awsConfig = awsConfig
            _backendDetails = backendInfoManager.getBackendDetails(_projectInfo.ProjectPath)
            if(_backendDetails){
                _hostingInfo = hostingOps.getInfo(_projectInfo, _awsConfig, _backendDetails)
                if(_hostingInfo){
                    projectAppBuilder.build(function(){
                        uploadFiles()
                    })
                }else{
                    console.log(chalk.red('no hosting feature'))
                    console.log('please enable hosting and try again')
                }
            }else{
                console.log(chalk.red('no backend awsmobile project'))
            }
        })
    }
}

let uploadFilesExits = false
let uploadCount = 0
function uploadFiles()
{
    let distributionDirPath = path.normalize(path.join(_projectInfo.ProjectPath, _projectInfo.DistributionDir))
    
    if(fs.existsSync(distributionDirPath)){

        let s3 = awsClient.S3(_hostingInfo.hostingBucket.attributes.region)

        let fileList = dfops.scan(distributionDirPath, publishIgnore.DirectoryList, publishIgnore.FileList)
    
        let totalFileCount = fileList.length
    
        if(totalFileCount > 0){
            let spinner = ora('uploading files').start()
        
            for(let file of fileList){
                let relativeFilePath = path.relative(distributionDirPath, file)
                let fileStream = fs.createReadStream(file)
                fileStream.on('error', function(err) {
                    console.log(chalk.red(relativeFilePath + ' read stream error', err))
                })
        
                let contentType = mime.lookup(relativeFilePath)
                let uploadParams = {Bucket: _hostingInfo.hostingBucket.name, Key: relativeFilePath, Body: fileStream, ContentType: contentType? contentType: "text/plain"}
                
                s3.upload (uploadParams, function (err, data) {
                    if (err) {
                        if(!uploadFilesExits){
                            uploadFilesExits = true
                            spinner.stop()
                            console.log(chalk.red('upload error: ')+ relativeFilePath + ': ' + err )
                            onPublishComplete(err)
                        }
                    }else{
                        //console.log("upload complete: ", relativeFilePath) //the verbose option
                        uploadCount++ 
                        if(uploadCount == totalFileCount){
                            spinner.stop()
                            onPublishComplete(null)
                        }
                    }
                })
            }
        }else{
            console.log(chalk.red('the specified distribution directory is empty'))
            console.log(distributionDirPath)
            console.log(chalk.gray('    # to set the correct build command and distribution directory for awsmobile-cli:'))
            console.log('    $ awsmobile configure project')
        }
    }else{
        console.log(chalk.red('the specified distribution directory does not exist'))
        console.log(distributionDirPath)
        console.log(chalk.gray('    # to set the correct build command and distribution directory for awsmobile-cli:'))
        console.log('    $ awsmobile configure project')
    }
}

function onPublishComplete(err)
{
    if(err){
        awsExceptionHandler.handleS3Exception(err)
    }else{
        _projectInfo = projectInfoManager.getProjectInfo() 
        _projectInfo.LastPublishTime = moment().format(awsmobileJSConstant.DateTimeFormatString) 
        projectInfoManager.setProjectInfo(_projectInfo)
        runDeviceFarmTest(function(){
            console.log()
            console.log("Successful!")
            console.log("your application is published and hosted at:")
            console.log(chalk.green(_hostingInfo.hostingSiteUrl))
            opn(_hostingInfo.hostingSiteUrl, {wait: false})
            refreshCloudFront()
        })
    }
}

function runDeviceFarmTest(callback){
    if(_testFlag > 0){
        let testUrl = constructDeviceFarmTestUrl()
        console.log()
        console.log('your application is tested by awsmobile DeviceFarm:')
        console.log(chalk.green(testUrl))
        console.log()
        opn(testUrl, {wait: false}).then(function(result){
            setTimeout(function(){
                callback()
            }, 3000)
        })
    }else{
        callback()
    }
}

function constructDeviceFarmTestUrl(){
    let testUrl = awsmobileJSConstant.AWSMobileDeviceFarmTestUrl

    let _cliConfig = cliConfigManager.getAWSMobileCLIConfig()
    if(_cliConfig && _cliConfig.isInDevMode && _cliConfig.isUsingBetaConsole){
        testUrl = awsmobileJSConstant.AWSMobileDeviceFarmTestUrl_Beta
    } 

    testUrl += '?projectId=' + _projectInfo.BackendProjectID
    testUrl += '&testRun=' + nameManager.generateDeviceFarmTestRunName(_projectInfo)
    testUrl += '&s=1'
    return testUrl
}

function refreshCloudFront(){
    if(_hostingInfo.cloudFront){
        console.log('your application is also distributed through aws CloudFront')
        console.log(chalk.green('https://' + _hostingInfo.cloudFront.name))

        if(_cloudFrontFlag > 0){
            let cloudFront = awsClient.CloudFront()
            let invalidateParams = {
                DistributionId: _hostingInfo.cloudFront.attributes.id,
                InvalidationBatch: {
                    Paths: {
                        Quantity: 1,
                        Items: ['/*']
                    },
                    CallerReference: nameManager.generateCloudFrontInvalidationReference(_projectInfo)
                }
            }
            cloudFront.createInvalidation(invalidateParams, function(err, data){
                if(err){
                    console.log('CloudFront invalidation request error:')
                    console.log(err)
                }else{
                    console.log('CloudFront invalidation request sent')
                    console.log('   invalidation Id: ' + data.Invalidation.Id)
                }
            })
        }else{
            console.log(chalk.gray('please note that CloudFront content may not have been refreshed'))
        }
    }
}

module.exports = {
    publish
}
