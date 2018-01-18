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

const awsClient = require('../aws-operations/aws-client.js')
const pathManager = require('../utils/awsmobilejs-path-manager.js')

let _featureBuildDirPath
let _projectInfo
let _backendProjectDetails
let _callback

function uploadLambdaZipFiles(projectInfo, awsDetails, backendProjectDetails, featureName, callback){
    _projectInfo = projectInfo
    _backendProjectDetails = backendProjectDetails
    _callback = callback

    _featureBuildDirPath = pathManager.getBackendBuildFeatureDirPath(_projectInfo.ProjectPath, featureName)
    if(fs.existsSync(_featureBuildDirPath)){

        let deploymentBucket = getDeploymentBucket()
        let s3 = awsClient.S3(awsDetails, getDeploymentBucketRegion(deploymentBucket))

        let fileList = fs.readdirSync(_featureBuildDirPath)
        let uploadCount = 0
        let totalFileCount = fileList.length
        
        if(totalFileCount > 0){
            fileList.forEach(function(fileName) {
                let filePath = path.join(_featureBuildDirPath, fileName)
                let current = fs.lstatSync(filePath)
                if(current.isFile()) {
                    let key = 'uploads/' + fileName
                    
                    //first check if the file is already uploaded
                    let headRequestParams = {Bucket: getDeploymentBucketName(deploymentBucket), Key: key}
                    s3.headObject(headRequestParams, function(err, data){
                        if(err){ 
                            let fileStream = fs.createReadStream(filePath)
                            fileStream.on('error', function(err) {
                                console.log(fileName + ' read stream error', err)
                            })                    
                            
                            let contentType = mime.lookup(fileName)
                            let uploadParams = {Bucket: getDeploymentBucketName(deploymentBucket), Key: key, Body: fileStream, ContentType: contentType? contentType: "text/plain"}
                            
                            console.log('   uploading ' + fileName)
                            s3.upload (uploadParams, function (err, data) {
                                if (err) {
                                    console.log(chalk.red(fileName + ": upload error: ", err))
                                } if (data) {
                                    console.log("   upload Successful ", fileName)
                                }
                                uploadCount++ 
                                if(uploadCount == totalFileCount){
                                    onPreBackendUpdateComplete()
                                }
                            })
                        }else{
                            uploadCount++ 
                            if(uploadCount == totalFileCount){
                                onPreBackendUpdateComplete()
                            }
                        }
                    })
                }
            }, this)
        }else{
            onPreBackendUpdateComplete()
        }
    }else{
        onPreBackendUpdateComplete()
    }
}

function onPreBackendUpdateComplete(){
    if(_callback){
        _callback()
    }
}


function getDeploymentBucket(){
    return _backendProjectDetails.resources.find(isDeploymentBucket)
}

function getDeploymentBucketName(deploymentBucket){
    let deploymentBucketName 
    if(deploymentBucket){
        deploymentBucketName = deploymentBucket.name
    }
    return deploymentBucketName
}

function getDeploymentBucketRegion(deploymentBucket){
    let deploymentBucketRegion
    if(deploymentBucket){
        deploymentBucketRegion = deploymentBucket.attributes.region
    }
    return deploymentBucketRegion
}

function isDeploymentBucket(resource){
    let result = false
    try{
        result = (resource.type == "AWS::S3::Bucket" && 
                    resource.feature == 'common' &&
                    resource.name.includes('-deployments-'))
    }catch(e){
        result = false
    }
    return result
}

module.exports = {
    uploadLambdaZipFiles
}
  