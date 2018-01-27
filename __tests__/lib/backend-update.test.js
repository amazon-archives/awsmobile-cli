jest.mock('fs-extra')
jest.mock('ora')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')
jest.mock('../../lib/backend-create.js')
jest.mock('../../lib/project-backend-builder.js')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../lib/backend-operations/ops-cloud-api.js')

const inquirer = require('inquirer')
const mockirer = require('mockirer')
const path = require('path')

const backendUpdate = require('../../lib/backend-update.js')

const projectInfoManager = require('../../lib/project-info-manager.js')
const backendCreate = require('../../lib/backend-create.js')
const projectBackendBuilder = require('../../lib/project-backend-builder.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')
const backendSpecManager = require('../../lib/backend-operations/backend-spec-manager.js')
const opsCloudApi = require('../../lib/backend-operations/ops-cloud-api.js')

describe('backend update', () => {
    
    const mock_projectInfo = {
        "ProjectName": 'projectName',
        "ProjectPath": '/projectName',
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
        'BackendProjectName': 'BackendProjectName', 
        'BackendProjectID': 'BackendProjectID'
    }

    const mock_mobileProjectID = 'mock_backend_projectID'

    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }

    const mock_awsDetails = {
        info: null, 
        config: mock_awsConfig
    }

    const mock_backendProjectDetails = {}

    const mockOpsFeatureFilePath = path.normalize(path.join(__dirname, '../../__mocks__/mock-ops-feature.js'))
    const mockOpsFeature = require(mockOpsFeatureFilePath)

    const mock_udpateError = {
        code: 'mockCode'
    }

    const mock_updateResponse = {
        details: {
            name: 'mock_mobileProjectName'
        }
    }

    const mock_describeError = {
        code: 'mockCode'
    }

    const mock_describeResponse = {
        details: {
            name: 'mock_mobileProjectName'
        }
    }

    let mock_mobileClient = {
        updateProject: jest.fn((param, callback)=>{
            callback(null, mock_updateResponse)
        }),
        describeProject: jest.fn((param, callback)=>{
            callback(null, mock_describeResponse)
        })
    }
    
    beforeAll(() => {
        global.console = {log: jest.fn()}
        
        projectInfoManager.getProjectInfo = jest.fn(()=>{
            return mock_projectInfo
        })

        projectInfoManager.checkBackendUpdateNoConflict = jest.fn((projectInfo, backendDetails) => {
            return true
        })

        projectInfoManager.setProjectInfo = jest.fn()

        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsDetails)
        })

        awsExceptionHandler.handleMobileException = jest.fn()

        mockirer(inquirer, {
            createBackend: true
        }) 
        
        pathManager.getOpsFeatureFilePath = jest.fn(()=>{
            return mockOpsFeatureFilePath
        })

        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendInfoManager.syncCurrentBackendInfo = 
        jest.fn((projectInfo, backendDetails, awsConfig, syncToDevFlag, callback) => {
            if(callback){
                callback()
            }
        })
    })

    beforeEach(() => {
        mock_projectInfo.BackendLastPushSuccessful = false
        backendCreate.createBackendProject.mockClear()
        backendInfoManager.syncCurrentBackendInfo.mockClear()
        awsExceptionHandler.handleMobileException.mockClear()
        mock_mobileClient.updateProject.mockClear()
        mock_mobileClient.describeProject.mockClear()
    })

    test('no existing backend', () => {
        const callback = jest.fn()
        const waitFlag = 1
        const syncToDevFlag = 0

        mock_projectInfo.BackendProjectID = ''

        backendCreate.createBackendProject = jest.fn()

        backendUpdate.run(callback)

        expect(backendCreate.createBackendProject).toBeCalled()
        expect(mock_mobileClient.updateProject).not.toBeCalled()
        expect(callback).not.toBeCalled()
    })

    test('backend without cloud-api and without api call errors', () => {
        const callback = jest.fn()

        mock_projectInfo.BackendProjectID = 'mock_backendProjectID'
        
        backendInfoManager.getBackendDetails = jest.fn((projectPath) => {
            return mock_backendProjectDetails
        })

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['hosting']
        })

        projectBackendBuilder.build = jest.fn((callback) => {
            if(callback){
                callback()
            }
        })

        backendUpdate.run(callback)

        expect(backendCreate.createBackendProject).not.toBeCalled()
        expect(callback).toBeCalled()
    })

    test('backend with cloud-api and without api call errors', () => {
        const callback = jest.fn()

        mock_projectInfo.BackendProjectID = 'mock_backendProjectID'
        
        backendInfoManager.getBackendDetails = jest.fn((projectPath) => {
            return mock_backendProjectDetails
        })

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['cloud-api']
        })

        projectBackendBuilder.build = jest.fn((callback) => {
            if(callback){
                callback()
            }
        })

        opsCloudApi.getFormationStateSummary = jest.fn((backendDetails) => {
            return {}
        })

        opsCloudApi.getStateGroup = jest.fn((cloudFormationState) => {
            return 1
        })

        backendUpdate.run(callback)

        expect(backendCreate.createBackendProject).not.toBeCalled()
        expect(mock_mobileClient.describeProject).toBeCalled()
        expect(callback).toBeCalled()
    })


})
