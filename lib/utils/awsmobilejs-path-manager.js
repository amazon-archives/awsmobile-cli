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
const path = require('path')
const fs = require('fs-extra')
const os = require('os')

const awsmobilejsConstant = require('./awsmobilejs-constant.js')
const featureDirMapping = require('./feature-dir-mapping.js')
const featureOpsMapping = require('./feature-ops-mapping.js')
const projectFeatureOpsMapping = require('./feature-project-ops-mapping.js')
const featureYmlTemplateMapping = require('./feature-yaml-template-mapping.js')


//////////////////////////////////////////////////////////////////////
//////////////////// for user project        /////////////////////////
//////////////////////////////////////////////////////////////////////

/////////////////////level 0
function getAWSMobileJSDirPath(projectPath)
{
    return path.normalize(path.join(projectPath, awsmobilejsConstant.AWSMobileJSDirName))
}

function getGitIgnoreFilePath(projectPath)
{
    return path.normalize(path.join(projectPath, '.gitignore'))
}
/////////////////////level 1
function getDotAWSMobileDirPath(projectPath)
{
    return path.normalize(path.join(getAWSMobileJSDirPath(projectPath), awsmobilejsConstant.DotAWSMobileSubDirName))
}

function getDotAWSMobileDirPath_relative(projectPath)
{
    let fullPath = getDotAWSMobileDirPath(projectPath)
    return path.relative(projectPath, fullPath)
}

function getCurrentBackendInfoDirPath(projectPath)
{
    return path.normalize(path.join(getAWSMobileJSDirPath(projectPath), awsmobilejsConstant.CurrentBackendInfoSubDirName))
}

function getCurrentBackendInfoDirPath_relative(projectPath)
{
    let fullPath = getCurrentBackendInfoDirPath(projectPath)
    return path.relative(projectPath, fullPath)
}

function getBackendDirPath(projectPath)
{
    return path.normalize(path.join(getAWSMobileJSDirPath(projectPath), awsmobilejsConstant.BackendSubDirName))
}

function getBackendDirPath_relative(projectPath)
{
    let fullPath = getBackendDirPath(projectPath)
    return path.relative(projectPath, fullPath)
}
/////////////////////level 2
///////.awsmobile
function getBackendBuildDirPath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.BackendBuildDirName))
}

function getInfoDirPath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.InfoDirName))
}

function getScriptsDirPath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.ScriptsDirName))
}

function getYmlTempZipFilePath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.YmlTempZipFileName))
}

function getAWSExportTempZipFilePath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.ExportJSTempZipFileName))
}

function getYmlExtractTempDirPath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.YmlExtractTempDirName))
}

function getAWSExportExtractTempDirPath(projectPath)
{
    return path.normalize(path.join(getDotAWSMobileDirPath(projectPath), awsmobilejsConstant.ExportJSExtractTempDirName))
}
////////#current-backend-info
function getCurrentBackendDetailsFilePath(projectPath)
{
    return path.normalize(path.join(getCurrentBackendInfoDirPath(projectPath),  awsmobilejsConstant.BackendDetailsFileName))
}

function getCurrentBackendDetailsFilePath_Relative(projectPath)
{
    let fullFilePath = getCurrentBackendDetailsFilePath(projectPath)
    return path.relative(projectPath, fullFilePath)
}

function getCurrentBackendYamlFilePath(projectPath)
{
    return path.normalize(path.join(getCurrentBackendInfoDirPath(projectPath), awsmobilejsConstant.BackendProjectYamlFileName))
}

function getCurrentBackendYamlFilePath_Relative(projectPath)
{
    let fullFilePath = getCurrentBackendYamlFilePath(projectPath)
    return path.relative(projectPath, fullFilePath)
}

function getCurrentBackendFeatureDirPath(projectPath, featureName)
{
    return path.normalize(path.join(getCurrentBackendInfoDirPath(projectPath), featureDirMapping[featureName]))
}

function getAWSExportFilePath(projectPath)
{
    return path.normalize(path.join(getCurrentBackendInfoDirPath(projectPath), awsmobilejsConstant.AWSExportFileName))
}

function getAppSyncJSFilePath(projectPath)
{
    return path.normalize(path.join(getCurrentBackendInfoDirPath(projectPath), awsmobilejsConstant.AppSyncJSFileName))
}

function getAWSExportFilePath_relative(projectPath)
{
    let fullPath = getAWSExportFilePath(projectPath)
    return path.relative(projectPath, fullPath)
}

////////backend
function getBackendFeatureDirPath(projectPath, featureName)
{
    return path.normalize(path.join(getBackendDirPath(projectPath), featureDirMapping[featureName]))
}

function getBackendSpecProjectYmlFilePath(projectPath)
{
    return path.normalize(path.join(getBackendDirPath(projectPath), awsmobilejsConstant.BackendProjectYamlFileName))
}


/////////////////////level 3
///////.awsmobile

function getBackendContentZipFilePath(projectPath)
{
    return path.normalize(path.join(getBackendBuildDirPath(projectPath), awsmobilejsConstant.BackendContentZipFileName))
}

function getBackendBuildYamlFilePath(projectPath)
{
    return path.normalize(path.join(getBackendBuildDirPath(projectPath), awsmobilejsConstant.BackendProjectYamlFileName))
}

function getBackendBuildFeatureDirPath(projectPath, featureName)
{
    return path.normalize(path.join(getBackendBuildDirPath(projectPath), featureDirMapping[featureName]))
}

function getAWSInfoFilePath(projectPath)
{
    return path.normalize(path.join(getInfoDirPath(projectPath), awsmobilejsConstant.AWSInfoFileName))
}

function getProjectInfoFilePath(projectPath)
{
    return path.normalize(path.join(getInfoDirPath(projectPath), awsmobilejsConstant.ProjectInfoFileName))
}

function getInitInfoFilePath(projectPath)
{
    return path.normalize(path.join(getInfoDirPath(projectPath), awsmobilejsConstant.InitInfoFileName))
}

function getProjectConfigFilePath(projectPath)
{
    return path.normalize(path.join(getInfoDirPath(projectPath), awsmobilejsConstant.ProjectConfigFileName))
}

function getProjectFeatureOpsFilePath(featureName)
{
    return path.normalize(path.join(__dirname +'/../feature-operations/scripts', projectFeatureOpsMapping[featureName]))
}

//////////////////////////////////////////////////////////////////////
//////////////////// template dependent      /////////////////////////
//////////////////////////////////////////////////////////////////////

function getSrcDirPath(projectInfo)
{
    let srcDir
    if(projectInfo.SourceDir){
        srcDir = path.normalize(path.join(projectInfo.ProjectPath, projectInfo.SourceDir))
    }
    return srcDir
}

function getSrcDirExportFilePath(projectInfo)
{
    let filePathInSrcDir
    if(projectInfo.SourceDir){
        let srcDirPath = path.normalize(path.join(projectInfo.ProjectPath, projectInfo.SourceDir))
        filePathInSrcDir = path.normalize(path.join(srcDirPath, awsmobilejsConstant.AWSExportFileName))
    }
    return filePathInSrcDir
}

function getSrcDirExportFilePath_relative(projectInfo)
{
    let relative_path
    let fullPath = getSrcDirExportFilePath(projectInfo)
    if(fullPath){
        relative_path = path.relative(projectInfo.ProjectPath, fullPath)
    }
    return relative_path
}

//////////////////////////////////////////////////////////////////////
//////////////////// for awsmobile cli       /////////////////////////
//////////////////////////////////////////////////////////////////////
function getBackendTemplatesDirPath()
{
    return path.normalize(path.join(__dirname +'/../feature-operations', awsmobilejsConstant.BackendTemplatesDirName))
}

function getAppSyncTemplateDirPath()
{
    return path.normalize(path.join(getBackendTemplatesDirPath(), awsmobilejsConstant.AppSyncTemplatesDirName))
}

function getFeatureYmlTemplateFilePath(featureName)
{
    return path.normalize(path.join(getBackendTemplatesDirPath(), featureYmlTemplateMapping[featureName]))
}

function getProjectCreationContentZipFilePath()
{
    return path.normalize(path.join(getBackendTemplatesDirPath(), awsmobilejsConstant.ProjectCreationContentZipFileName))
}

function getOpsFeatureFilePath(featureName)
{
    return path.normalize(path.join(__dirname +'/../backend-operations', featureOpsMapping[featureName]))
}

function getSysAwsCredentialsFilePath()
{
    return path.normalize(path.join(os.homedir(), ".aws/credentials")) 
}

function getSysAwsConfigFilePath()
{
    return path.normalize(path.join(os.homedir(), ".aws/config")) 
}

function getSysAWSMobileJSDirPath()
{
    return path.normalize(path.join(os.homedir(), awsmobilejsConstant.SysDotAWSMobileJSDirName)) 
}

function getSysProjectAWSConfigDirPath()
{
    return path.normalize(path.join(getSysAWSMobileJSDirPath(), awsmobilejsConstant.ProjectAWSConfigDirName))
}

function getSysTempDirPath()
{
    return path.normalize(path.join(getSysAWSMobileJSDirPath(), "temp"))
}

function getGeneralAWSInfoFilePath()
{
    return path.normalize(path.join(getSysAWSMobileJSDirPath(), awsmobilejsConstant.AWSInfoFileName))
}

function getGeneralAWSConfigFilePath()
{
    return path.normalize(path.join(getSysAWSMobileJSDirPath(), awsmobilejsConstant.AWSConfigFileName))
}

function getAWSMobileCLIConfigFilePath()
{
    return path.normalize(path.join(getSysAWSMobileJSDirPath(), awsmobilejsConstant.AWSMobileCLIConfigFileName))
}

module.exports = {
    getAWSMobileJSDirPath,
    getGitIgnoreFilePath,
    getDotAWSMobileDirPath,
    getDotAWSMobileDirPath_relative,
    getCurrentBackendInfoDirPath,
    getCurrentBackendInfoDirPath_relative,
    getBackendDirPath,
    getBackendDirPath_relative,
    getBackendBuildDirPath,
    getInfoDirPath,
    getScriptsDirPath,
    getYmlTempZipFilePath,
    getAWSExportTempZipFilePath,
    getYmlExtractTempDirPath,
    getAWSExportExtractTempDirPath,
    getCurrentBackendDetailsFilePath,
    getCurrentBackendDetailsFilePath_Relative,
    getCurrentBackendYamlFilePath,
    getCurrentBackendYamlFilePath_Relative,
    getCurrentBackendFeatureDirPath,
    getAWSExportFilePath,
    getAWSExportFilePath_relative,
    getAppSyncJSFilePath,
    getBackendFeatureDirPath,
    getBackendSpecProjectYmlFilePath,
    getBackendContentZipFilePath,
    getBackendBuildYamlFilePath,
    getBackendBuildFeatureDirPath,
    getAWSInfoFilePath,
    getProjectInfoFilePath,
    getInitInfoFilePath,
    getProjectConfigFilePath,
    getProjectFeatureOpsFilePath,
    getAppSyncTemplateDirPath,
    getFeatureYmlTemplateFilePath,
    getProjectCreationContentZipFilePath,
    getSrcDirPath,
    getSrcDirExportFilePath,
    getSrcDirExportFilePath_relative,
    getOpsFeatureFilePath,
    getSysAwsCredentialsFilePath,
    getSysAwsConfigFilePath,
    getSysAWSMobileJSDirPath,
    getSysProjectAWSConfigDirPath,
    getSysTempDirPath,
    getGeneralAWSInfoFilePath,
    getGeneralAWSConfigFilePath,
    getAWSMobileCLIConfigFilePath
}
  