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
    AppSyncInfoFileName: "appsync-info.json",
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
    AWSExportFileName: "aws-exports.js",
    AppSyncJSFileName: "appsync.js",
    ///////////////////////
    BackendSubDirName: "backend",
    AppSyncResolverMappingsDirName: "resolver-mappings",
    AppSyncApiKeysFileName: "apiKeys.json",
    AppSyncDataSourcesFileName: "dataSources.json",
    AppSyncDynamoDbTablesFileName: "dynamoDbTables.json",
    AppSyncGraphqlApiFileName: "graphqlApi.json",
    AppSyncResolversFileName: "resolvers.json",
    AppSyncSchemaFileName: "schema.graphql",
    AppSyncConfigurablesDirName: "configurables",
    DiffMark: 'diff',
    DiffMark_Create: 'create',
    DiffMark_Update: 'update',
    DiffMark_Delete: 'delete',
    DiffMark_None: 'none',
    ///////////////////////
    ByAWSMobileCLI: "{managed-by-awsmobile-cli}",
    Suffix: "{suffix}",
    DateTimeFormatString: "YYYY-MM-DD-HH-mm-ss",
    DateTimeFormatStringCompact: "YYYYMMDDHHmmss",
    DefaultAWSAccessKeyId: "<YOUR_ACCESS_KEY_ID>",
    DefaultAWSSecretAccessKey: "<YOUR_SECRET_ACCESS_KEY>",
    DefaultAWSRegion: "us-east-1", 
    ///////////////////////////
    AppSyncConsoleUrl: "https://console.aws.amazon.com/appsync/home?region={region}#/{apiId}/v1/home",
    ///////////////////////////
    AWSMobileAPIEndPoint: "mobile.us-east-1.amazonaws.com", 
    AWSMobileDeviceFarmTestUrl: 'https://console.aws.amazon.com/mobilehub/home?#/webtest/', 
    AWSAmazonConsoleUrl: "https://console.aws.amazon.com/",
    AWSEnableMobileRoleUrl: "https://console.aws.amazon.com/mobilehub/home?#/activaterole/",
    AWSCreateIAMUsersUrl: 
    "https://console.aws.amazon.com/iam/home?region={region}#/users$new?step=final&accessKey&userNames={userName}&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess"
}
