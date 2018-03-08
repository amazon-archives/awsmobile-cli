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
module.exports = {
    AWSMobileJS: "awsmobilejs",
    AWSConfigFileName: "aws-config.json",
    AWSMobileCLIConfigFileName: "awsmobile-cli-config.json",
    CustomUserAgent: "awsmobile-cli/1.0.0",
    ///////////////////////
    SysDotAWSMobileJSDirName: ".awsmobilejs",
    ProjectAWSConfigDirName: "project-aws-config",
    ///////////////////////
    AWSMobileJSDirName: "awsmobilejs",
    AWSMobileJSBackUpDirName: "~awsmobilejs", //will be further appended with timestamp
    ///////////////////////
    DotAWSMobileSubDirName: ".awsmobile",
    BackendBuildDirName: "backend-build",////
    BackendContentZipFileName: "content.zip",
    InfoDirName: "info", ////
    AWSInfoFileName: "aws-info.json",
    ProjectInfoFileName: "project-info.json",
    InitInfoFileName: "init-info.json",
    ProjectConfigFileName: "project-config.json",
    ScriptsDirName: "scripts",////
    ProjectOpsFileName: "project-ops.js",
    BackendTemplatesDirName: "backend-templates",////
    AppSyncTemplatesDirName: "appsync",
    ProjectCreationContentZipFileName: "project-creation-content.zip",
    YmlTempZipFileName: "yml-temp.zip",////
    ExportJSTempZipFileName: "export-js-temp.zip",////
    YmlExtractTempDirName: "yml-extract",////
    ExportJSExtractTempDirName: "export-js-extract",////
    ///////////////////////
    CurrentBackendInfoSubDirName: "#current-backend-info",
    BackendDetailsFileName: "backend-details.json",
    BackendProjectYamlFileName: "mobile-hub-project.yml",
    BackendProjectJsonFileName: "mobile-hub-project.json",
    DressedByFeatureFlag: 'dressedByFeature',
    ///////////////////////
    ClientSubDirName: "client",
    AWSExportFileName: "aws-exports.js",
    AppSyncJSFileName: "AppSync.js",
    ///////////////////////
    BackendSubDirName: "backend",
    AppSyncSpecFileName: "appsync-spec.json",
    ///////////////////////
    DateTimeFormatString: "YYYY-MM-DD-HH-mm-ss",
    DateTimeFormatStringCompact: "YYYYMMDDHHmmss",
    DefaultAWSAccessKeyId: "<YOUR_ACCESS_KEY_ID>",
    DefaultAWSSecretAccessKey: "<YOUR_SECRET_ACCESS_KEY>",
    DefaultAWSRegion: "us-east-1", 
    ///////////////////////////
    AWSMobileAPIEndPoint: "mobile.us-east-1.amazonaws.com", 
    AWSMobileAPIEndPoint_Gamma: "http://awsmobileservi-elb-d6tjnnbm3de3-1999395208.us-east-1.elb.amazonaws.com",
    AWSMobileDeviceFarmTestUrl: 'https://console.aws.amazon.com/mobilehub/home?#/webtest/', 
    AWSMobileDeviceFarmTestUrl_Beta: 'https://aws-mobile-hub-beta.amazon.com/mobilehub/home#/webtest/', 
    AWSAmazonConsoleUrl: "https://console.aws.amazon.com/",
    AWSEnableMobileRoleUrl: "https://console.aws.amazon.com/mobilehub/home?#/activaterole/",
    AWSCreateIAMUsersUrl: 
    "https://console.aws.amazon.com/iam/home?region={region}#/users$new?step=review&accessKey&userNames={userName}&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAWSMobileHub_FullAccess&policies=arn:aws:iam::aws:policy%2FAWSDeviceFarmFullAccess&policies=arn:aws:iam::aws:policy%2FAWSLambdaFullAccess&policies=arn:aws:iam::aws:policy%2FIAMReadOnlyAccess"
}