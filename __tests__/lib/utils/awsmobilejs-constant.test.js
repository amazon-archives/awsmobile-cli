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
const awsmobilejsConstant = require('../../../lib/utils/awsmobilejs-constant.js')

describe('awsmobilejs constants', () => {
    test('awsmobilejs constants exist', () => {
        expect(awsmobilejsConstant.AWSMobileJS).toBeDefined()
        expect(awsmobilejsConstant.AWSConfigFileName).toBeDefined()
        expect(awsmobilejsConstant.AWSMobileCLIConfigFileName).toBeDefined()
        expect(awsmobilejsConstant.CustomUserAgent).toBeDefined()
        expect(awsmobilejsConstant.SysDotAWSMobileJSDirName).toBeDefined()
        expect(awsmobilejsConstant.ProjectAWSConfigDirName).toBeDefined()
        expect(awsmobilejsConstant.AWSMobileJSDirName).toBeDefined()
        expect(awsmobilejsConstant.AWSMobileJSBackUpDirName).toBeDefined()
        expect(awsmobilejsConstant.DotAWSMobileSubDirName).toBeDefined()
        expect(awsmobilejsConstant.BackendBuildDirName).toBeDefined()
        expect(awsmobilejsConstant.BackendContentZipFileName).toBeDefined()
        expect(awsmobilejsConstant.InfoDirName).toBeDefined()
        expect(awsmobilejsConstant.AWSInfoFileName).toBeDefined()
        expect(awsmobilejsConstant.ProjectInfoFileName).toBeDefined()
        expect(awsmobilejsConstant.InitInfoFileName).toBeDefined()
        expect(awsmobilejsConstant.ProjectConfigFileName).toBeDefined()
        expect(awsmobilejsConstant.ScriptsDirName).toBeDefined()
        expect(awsmobilejsConstant.ProjectOpsFileName).toBeDefined()
        expect(awsmobilejsConstant.BackendTemplatesDirName).toBeDefined()
        expect(awsmobilejsConstant.ProjectCreationContentZipFileName).toBeDefined()
        expect(awsmobilejsConstant.YmlTempZipFileName).toBeDefined()
        expect(awsmobilejsConstant.ExportJSTempZipFileName).toBeDefined()
        expect(awsmobilejsConstant.YmlExtractTempDirName).toBeDefined()
        expect(awsmobilejsConstant.ExportJSExtractTempDirName).toBeDefined()
        expect(awsmobilejsConstant.CurrentBackendInfoSubDirName).toBeDefined()
        expect(awsmobilejsConstant.BackendDetailsFileName).toBeDefined()
        expect(awsmobilejsConstant.BackendProjectYamlFileName).toBeDefined()
        expect(awsmobilejsConstant.BackendProjectJsonFileName).toBeDefined()
        expect(awsmobilejsConstant.DressedByFeatureFlag).toBeDefined()
        expect(awsmobilejsConstant.ClientSubDirName).toBeDefined()
        expect(awsmobilejsConstant.AWSExportFileName).toBeDefined()
        expect(awsmobilejsConstant.BackendSubDirName).toBeDefined()
        expect(awsmobilejsConstant.DateTimeFormatString).toBeDefined()
        expect(awsmobilejsConstant.DateTimeFormatStringCompact).toBeDefined()
        expect(awsmobilejsConstant.DefaultAWSAccessKeyId).toBeDefined()
        expect(awsmobilejsConstant.DefaultAWSSecretAccessKey).toBeDefined()
        expect(awsmobilejsConstant.DefaultAWSRegion).toBeDefined()
        expect(awsmobilejsConstant.AWSMobileAPIEndPoint).toBeDefined()
        expect(awsmobilejsConstant.AWSMobileDeviceFarmTestUrl).toBeDefined()
        expect(awsmobilejsConstant.AWSAmazonConsoleUrl).toBeDefined()
        expect(awsmobilejsConstant.AWSEnableMobileRoleUrl).toBeDefined()
        expect(awsmobilejsConstant.AWSCreateIAMUsersUrl).toBeDefined() 
    })
})
