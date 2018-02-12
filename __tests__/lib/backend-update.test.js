jest.mock('fs-extra')
jest.mock('ora')
jest.mock('opn')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')
jest.mock('../../lib/backend-create.js')
jest.mock('../../lib/build-backend.js')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../lib/backend-operations/ops-cloud-api.js')
jest.mock('../../lib/backend-operations/ops-project.js')

const inquirer = require('inquirer')
const mockirer = require('mockirer')
const path = require('path')
const moment = require('moment')
const opn = require('opn')

const backendUpdate = require('../../lib/backend-update.js')

const projectInfoManager = require('../../lib/project-info-manager.js')
const backendRetrieve = require('../../lib/backend-retrieve.js')
const projectBackendBuilder = require('../../lib/build-backend.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const awsmobileJSConstant = require('../../lib/utils/awsmobilejs-constant.js')
const dfops = require('../../lib/utils/directory-file-ops.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')
const backendSpecManager = require('../../lib/backend-operations/backend-spec-manager.js')
const opsCloudApi = require('../../lib/backend-operations/ops-cloud-api.js')
const opsProject = require('../../lib/backend-operations/ops-project.js')

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

    const mock_backendProjectDetails = {
        consoleUrl: 'mockConsoleUrl'
    }

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

        backendRetrieve.getLatestBackendDetails =  jest.fn((backendProjectID, callback)=>{
            callback(mock_backendProjectDetails)
        })

        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsDetails)
        })

        projectInfoManager.getProjectInfo = jest.fn(()=>{
            return mock_projectInfo
        })

        projectInfoManager.checkBackendUpdateNoConflict = jest.fn((projectInfo, backendDetails) => {
            return true
        })

        projectInfoManager.setProjectInfo = jest.fn()

        awsExceptionHandler.handleMobileException = jest.fn()
        
        pathManager.getOpsFeatureFilePath = jest.fn(()=>{
            return mockOpsFeatureFilePath
        })

        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        projectBackendBuilder.build = jest.fn((callback) => {
            if(callback){
                callback()
            }
        })

        backendInfoManager.syncCurrentBackendInfo = 
        jest.fn((projectInfo, backendDetails, awsConfig, syncToDevFlag, callback) => {
            if(callback){
                callback()
            }
        })

        opsProject.isInNormalState = jest.fn((backendDetails) => {
            return true
        })
    })

    beforeEach(() => {
        mock_projectInfo.BackendLastSyncTime = '2018-01-01-01-01-01'
        mock_projectInfo.BackendLastPushTime = '2018-01-01-01-01-01'
        dfops.getDirContentMTime  = jest.fn((dir, ignoredDirs, ignoredFiles) => {
            return moment('2018-01-01-01-01-02',  awsmobileJSConstant.DateTimeFormatString)
        })
        projectInfoManager.checkBackendUpdateNoConflict = jest.fn((projectInfo, backendDetails)=>{
            return true
        })
        mock_projectInfo.BackendProjectID = 'BackendProjectID'
        mock_projectInfo.BackendLastPushSuccessful = true
        projectBackendBuilder.build.mockClear()
        projectInfoManager.checkBackendUpdateNoConflict.mockClear()
        backendRetrieve.getLatestBackendDetails.mockClear()
        backendInfoManager.syncCurrentBackendInfo.mockClear()
        awsExceptionHandler.handleMobileException.mockClear()
        mock_mobileClient.updateProject.mockClear()
        mock_mobileClient.describeProject.mockClear()
    })

    test('timestamp check fail', () => {
        const callback = jest.fn()

        dfops.getDirContentMTime  = jest.fn((dir, ignoredDirs, ignoredFiles) => {
            return moment('2018-01-01-01-01-00',  awsmobileJSConstant.DateTimeFormatString)
        })

        backendUpdate.run(callback)

        expect(backendRetrieve.getLatestBackendDetails).not.toBeCalled()
        expect(mock_mobileClient.updateProject).not.toBeCalled()
        expect(callback).toBeCalled()
    })

    test('no existing backend', () => {
        const callback = jest.fn()

        mock_projectInfo.BackendProjectID = ''

        backendUpdate.run(callback)

        expect(backendRetrieve.getLatestBackendDetails).not.toBeCalled()
        expect(mock_mobileClient.updateProject).not.toBeCalled()
        expect(callback).not.toBeCalled()
    })

    test('backend updated by in cloud others, no force push', () => {
        const callback = jest.fn()
        projectInfoManager.checkBackendUpdateNoConflict = jest.fn((projectInfo, backendDetails)=>{
            return false
        })
        
        mockirer(inquirer, {
            forcePush: false,
            openConsole: true
        }) 

        backendUpdate.run(callback)

        expect(backendRetrieve.getLatestBackendDetails).toBeCalled()
        expect(opn).toBeCalled()
        expect(opn.mock.calls[0][0]).toBe(mock_backendProjectDetails.consoleUrl)
        expect(mock_mobileClient.updateProject).not.toBeCalled()
        expect(callback).not.toBeCalled()
    })

    test('backend updated by in cloud others, force push', () => {
        const callback = jest.fn()
        projectInfoManager.checkBackendUpdateNoConflict = jest.fn((projectInfo, backendDetails)=>{
            return false
        })

        mockirer(inquirer, {
            forcePush: true,
            openConsole: true
        }) 

        backendUpdate.run(callback)

        expect(backendRetrieve.getLatestBackendDetails).toBeCalled()
        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('backend update call failed', () => {
        const callback = jest.fn()

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['hosting']
        })

        mock_mobileClient.updateProject = jest.fn((param, callback)=>{
            callback({err: 'update call failed'}, mock_updateResponse)
        })

        backendUpdate.run(callback)

        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(callback).not.toBeCalled()
    })

    test('backend update call successful, not wait needed', () => {
        const callback = jest.fn()

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['hosting']
        }) 
        
        mock_mobileClient.updateProject = jest.fn((param, callback)=>{
            callback(null, mock_updateResponse)
        })

        opsCloudApi.getFormationStateSummary = jest.fn((backendDetails) => {
            return {}
        })

        opsCloudApi.getStateGroup = jest.fn((cloudFormationState) => {
            return 1
        })

        backendUpdate.run(callback)

        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('backend update call successful, wait needed and end in success', () => {
        const callback = jest.fn()

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['cloud-api']
        })

        mock_mobileClient.updateProject = jest.fn((param, callback)=>{
            callback(null, mock_updateResponse)
        })

        opsCloudApi.getFormationStateSummary = jest.fn((backendDetails) => {
            return {}
        })

        opsCloudApi.getStateGroup = jest.fn()
        opsCloudApi.getStateGroup.mockReturnValueOnce(0)
        opsCloudApi.getStateGroup.mockReturnValueOnce(1)


        backendUpdate.run(callback)

        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('backend update call successful, wait needed and end in interruption', () => {
        const callback = jest.fn()

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['cloud-api']
        })

        mock_mobileClient.updateProject = jest.fn((param, callback)=>{
            callback(null, mock_updateResponse)
        })

        opsCloudApi.getFormationStateSummary = jest.fn((backendDetails) => {
            return {}
        })

        opsCloudApi.getStateGroup = jest.fn()
        opsCloudApi.getStateGroup.mockReturnValueOnce(0)
        opsCloudApi.getStateGroup.mockReturnValueOnce(-1)


        backendUpdate.run(callback)

        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(callback).not.toBeCalled()
    })

    test('backend update call successful, wait needed and end in failure', () => {
        const callback = jest.fn()

        backendSpecManager.getEnabledFeatures = jest.fn((projectInfo) => {
            return ['cloud-api']
        })

        mock_mobileClient.updateProject = jest.fn((param, callback)=>{
            callback(null, mock_updateResponse)
        })

        opsCloudApi.getFormationStateSummary = jest.fn((backendDetails) => {
            return {}
        })

        opsCloudApi.getStateGroup = jest.fn()
        opsCloudApi.getStateGroup.mockReturnValueOnce(0)
        opsCloudApi.getStateGroup.mockReturnValueOnce(2)


        backendUpdate.run(callback)

        expect(mock_mobileClient.updateProject).toBeCalled()
        expect(callback).not.toBeCalled()
    })
})
