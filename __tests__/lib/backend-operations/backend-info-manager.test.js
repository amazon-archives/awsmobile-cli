jest.mock('fs-extra')
jest.mock('../../../lib/backend-operations/ops-project.js')
jest.mock('../../../lib/backend-operations/ops-analytics.js')
jest.mock('../../../lib/backend-operations/ops-cloud-api')
jest.mock('../../../lib/backend-operations/ops-database')
jest.mock('../../../lib/backend-operations/ops-hosting')
jest.mock('../../../lib/backend-operations/ops-user-files')
jest.mock('../../../lib/backend-operations/ops-user-signin')
jest.mock('../../../lib/project-info-manager.js')
jest.mock('../../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../../lib/aws-operations/mobile-exportjs-file-manager.js')

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const opsProject = require('../../../lib/backend-operations/ops-project.js')
const opsAnalytics = require('../../../lib/backend-operations/ops-analytics.js')
const opsCloudApi = require('../../../lib/backend-operations/ops-cloud-api')
const opsDatabase = require('../../../lib/backend-operations/ops-database')
const opsHosting = require('../../../lib/backend-operations/ops-hosting')
const opsUserFiles = require('../../../lib/backend-operations/ops-user-files')
const opsUserSignin = require('../../../lib/backend-operations/ops-user-signin')
const backendSpecManager = require('../../../lib/backend-operations/backend-spec-manager.js')
const awsExportFileManager = require('../../../lib/aws-operations/mobile-exportjs-file-manager.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const projectInfoManager = require('../../../lib/project-info-manager.js')

const awsMobileYamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')

const backendInfoManager = require('../../../lib/backend-operations/backend-info-manager.js')

describe('backend-info-manager', () => {
    const projectName = 'mockappname'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const currentBackendInfoDirPath = pathManager.getCurrentBackendInfoDirPath(projectPath)
    const backendDetailsFilePath = pathManager.getCurrentBackendDetailsFilePath(projectPath)
    const backendYamlFilePath = pathManager.getCurrentBackendYamlFilePath(projectPath)

    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }
    const mock_awsInfo = {
        "AWSConfigFilePath":"mockConfigFilePath"
    }
    const mock_awsDetails = {
        info: mock_awsInfo, 
        config: mock_awsConfig
    }

    const mock_projectInfo_old = {
        "ProjectName": projectName,
        "ProjectPath": projectPath,
        "InitializationTime": "2018-03-23-16-40-22",
        "LastConfigurationTime": "2018-03-23-16-40-04",
        "SourceDir": "srcold",
        "DistributionDir": "build",
        "BuildCommand": (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
        "StartCommand": (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start")
    }

    const mock_projectInfo = {
        "ProjectName": projectName,
        "ProjectPath": projectPath,
        "InitializationTime": "2018-03-23-16-40-22",
        "LastConfigurationTime": "2018-03-23-16-40-04",
        "SourceDir": "src",
        "DistributionDir": "build",
        "BuildCommand": (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
        "StartCommand": (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start")
    }

    const mock_backendProject = {
        features: { 
            'sign-in':{},
            'user-files': {},
            'user-profiles': {},
            'cloudlogic':{},
            'database': {},
            'mobile-analytics': {},
            'content-delivery': {}
        }
    }

    const mock_backendProjectDetails = {
        "name": "mockappname",
        "projectId": "mock_project_id",
        "region": "us-east-1",
        "state": "NORMAL",
        "createdDate": "2018-03-23T23:40:04.502Z",
        "lastUpdatedDate": "2018-03-23T23:56:32.789Z",
        "consoleUrl": "https://console.aws.amazon.com/mobilehub/home#/mock_project_id/build",
        "resources": [
            {
                "type": "AWS::S3::Bucket",
                "name": "mockappname-userfiles-mobilehub-mock_id",
                "arn": null,
                "feature": "user-data",
                "attributes": {
                    "lastUpdateRequestID": "mock_request_id",
                    "region": "us-east-1",
                    "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-userfiles-mobilehub-mock_id"
                }
            },
            {
                "type": "AWS::IAM::Policy",
                "name": "mockappname_userfiles_MOBILEHUB_mock_id",
                "arn": null,
                "feature": "user-data",
                "attributes": {
                    "authType": "unauthenticated",
                    "lastUpdateRequestID": "mock_request_id",
                    "role": "mockappname_unauth_MOBILEHUB_mock_id"
                }
            },
            {
                "type": "AWS::Cognito::IdentityPool",
                "name": "mockappname_MOBILEHUB_mock_id",
                "arn": "us-east-1:mock_arn_id",
                "feature": "user-signin",
                "attributes": {
                    "lastUpdateRequestID": "mock_request_id",
                    "poolid": "us-east-1:mock_arn_id",
                    "roleARNs": "arn:aws:iam::mockaccountnumber:role/mockappname_unauth_MOBILEHUB_mock_id"
                }
            },
            {
                "type": "AWS::IAM::Role",
                "name": "mockappname_unauth_MOBILEHUB_mock_id",
                "arn": "arn:aws:iam::mockaccountnumber:role/mockappname_unauth_MOBILEHUB_mock_id",
                "feature": "user-signin",
                "attributes": {
                    "authType": "unauthenticated",
                    "lastUpdateRequestID": "mock_request_id"
                }
            },
            {
                "type": "AWS::Pinpoint::AnalyticsApplication",
                "name": "mockappname20180323164004_MobileHub",
                "arn": "mock_arn",
                "feature": "analytics",
                "attributes": {
                    "lastUpdateRequestID": "mock_request_id"
                }
            },
            {
                "type": "AWS::IAM::Policy",
                "name": "mockappname_mobileanalytics_MOBILEHUB_mock_id",
                "arn": null,
                "feature": "analytics",
                "attributes": {
                    "authType": "unauthenticated",
                    "lastUpdateRequestID": "mock_request_id",
                    "role": "mockappname_unauth_MOBILEHUB_mock_id"
                }
            },
            {
                "type": "AWS::IAM::Policy",
                "name": "mockappname_userprofiles_MOBILEHUB_mock_id",
                "arn": null,
                "feature": "user-data",
                "attributes": {
                    "authType": "unauthenticated",
                    "lastUpdateRequestID": "mock_request_id",
                    "role": "mockappname_unauth_MOBILEHUB_mock_id"
                }
            },
            {
                "type": "AWS::S3::Bucket",
                "name": "mockappname-hosting-mobilehub-mock_id",
                "arn": null,
                "feature": "hosting",
                "attributes": {
                    "lastUpdateRequestID": "mock_request_id",
                    "region": "us-east-1",
                    "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-hosting-mobilehub-mock_id",
                    "s3-bucket-website-url": "https://s3.amazonaws.com/mockappname-hosting-mobilehub-mock_id"
                }
            },
            {
                "type": "AWS::CloudFront::Distribution",
                "name": "d1pwacowmw2me2.cloudfront.net",
                "arn": null,
                "feature": "hosting",
                "attributes": {
                    "id": "E79VBAWVFP7BV",
                    "lastUpdateRequestID": "mock_request_id"
                }
            },
            {
                "type": "AWS::IAM::Policy",
                "name": "mockappname_hosting_MOBILEHUB_mock_id",
                "arn": null,
                "feature": "hosting",
                "attributes": {
                    "authType": "unauthenticated",
                    "lastUpdateRequestID": "mock_request_id",
                    "role": "mockappname_unauth_MOBILEHUB_mock_id"
                }
            },
            {
                "type": "AWS::S3::Bucket",
                "name": "mockappname-deployments-mobilehub-mock_id",
                "arn": null,
                "feature": "common",
                "attributes": {
                    "region": "us-east-1",
                    "s3-bucket-console-url": "https://s3.console.aws.amazon.com/s3/buckets/mockappname-deployments-mobilehub-mock_id"
                }
            },
            {
                "type": "AWS::CloudFormation::Stack",
                "name": "Development",
                "arn": null,
                "feature": "cloud-api",
                "attributes": {
                    "primary": "true",
                    "region": "us-east-1",
                    "stateSummary": "NOT_YET_DEPLOYED"
                }
            }
        ]
    }

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendDetailsFilePath] = JSON.stringify(mock_backendProjectDetails, null, '\t')

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        mockirer(inquirer, {
            syncToDevBackend: true,
        }) 
        projectInfoManager.onClearBackend = jest.fn()
        backendSpecManager.onClearBackend = jest.fn()
        awsExportFileManager.onClearBackend = jest.fn()
        awsExportFileManager.getAWSExportFile = jest.fn((projectInfo, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        projectInfoManager.updateBackendProjectDetails = jest.fn((projectInfo, backendDetails)=>{
            return projectInfo
        })
        opsAnalytics.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsCloudApi.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsDatabase.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsHosting.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsUserFiles.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsUserSignin.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
            if(callback){
                callback()
            }
        })
        opsProject.syncCurrentBackendInfo = jest.fn((projectInfo, backendDetails, awsDetails, callback)=>{
           if(callback){
                callback(mock_backendProject)
           }
        })
        opsAnalytics.syncToDevBackend = jest.fn()
        opsCloudApi.syncToDevBackend = jest.fn()
        opsDatabase.syncToDevBackend = jest.fn()
        opsHosting.syncToDevBackend = jest.fn()
        opsUserFiles.syncToDevBackend = jest.fn()
        opsUserSignin.syncToDevBackend = jest.fn()
        opsProject.syncToDevBackend = jest.fn()
        backendSpecManager.getEnabledFeaturesFromObject = jest.fn((backendProject)=>{
            return ['user-signin', 'user-files', 'cloud-api', 'database', 'analytics', 'hosting' ]
        })
        opsProject.syncToDevBackend = jest.fn()
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('getBackendDetails', () => {
        let backendDetails = backendInfoManager.getBackendDetails(projectPath)
        expect(backendDetails).toBeDefined()
        expect(fs.ensureDirSync).toBeCalledWith(currentBackendInfoDirPath)
        expect(backendDetails.projectId).toEqual(mock_backendProjectDetails.projectId)
    })

    test('setBackendDetails', () => {
        backendInfoManager.setBackendDetails(projectPath, mock_backendProjectDetails, false)
        expect(fs.ensureDirSync).toBeCalledWith(currentBackendInfoDirPath)
        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toEqual(backendDetailsFilePath)
    })

    test('clearBackendInfo', () => {
        backendInfoManager.clearBackendInfo(mock_projectInfo)
        expect(fs.emptyDirSync).toBeCalledWith(currentBackendInfoDirPath)
        expect(projectInfoManager.onClearBackend).toBeCalled()
        expect(backendSpecManager.onClearBackend).toBeCalled()
        expect(awsExportFileManager.onClearBackend).toBeCalled()
    })

    test('onProjectConfigChange', () => {
        backendInfoManager.onProjectConfigChange(mock_projectInfo_old, mock_projectInfo)
        expect(awsExportFileManager.onProjectConfigChange).toBeCalled()
        expect(awsExportFileManager.onProjectConfigChange.mock.calls[0][0]).toEqual(mock_projectInfo_old)
        expect(awsExportFileManager.onProjectConfigChange.mock.calls[0][1]).toEqual(mock_projectInfo)
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        backendInfoManager.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectDetails, mock_awsDetails, 2, callback)

        expect(opsProject.syncCurrentBackendInfo).toBeCalled()
        expect(opsAnalytics.syncCurrentBackendInfo).toBeCalled()
        expect(opsCloudApi.syncCurrentBackendInfo).toBeCalled()
        expect(opsDatabase.syncCurrentBackendInfo).toBeCalled()
        expect(opsHosting.syncCurrentBackendInfo).toBeCalled()
        expect(opsUserFiles.syncCurrentBackendInfo).toBeCalled()
        expect(opsUserSignin.syncCurrentBackendInfo).toBeCalled()
        expect(opsProject.syncToDevBackend).toBeCalled()
        expect(opsAnalytics.syncToDevBackend).toBeCalled()
        expect(opsCloudApi.syncToDevBackend).toBeCalled()
        expect(opsDatabase.syncToDevBackend).toBeCalled()
        expect(opsHosting.syncToDevBackend).toBeCalled()
        expect(opsUserFiles.syncToDevBackend).toBeCalled()
        expect(opsUserSignin.syncToDevBackend).toBeCalled()
        expect(callback).toBeCalled()
    })
})