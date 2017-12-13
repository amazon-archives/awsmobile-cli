jest.mock('ora')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')

const inquirer = require('inquirer')
const mockirer = require('mockirer')

const backendDelete = require('../../lib/backend-delete.js')

const projectInfoManager = require('../../lib/project-info-manager.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')

describe('backend delete', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {
        "ProjectName": "",
        "ProjectPath": projectPath,
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
        'BackendProjectName': 'BackendProjectName', 
        'BackendProjectID': 'BackendProjectID', 
    }
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }

    const mock_mobileProjectName = 'mock_mobileProjectName'

    const mock_deleteError = {
        code: 'mockCode'
    }

    const mock_deleteResponse = {
        details: {
            name: mock_mobileProjectName
        }
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}

        projectInfoManager.getProjectInfo = jest.fn(()=>{
            return mock_projectInfo
        })

        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsConfig)
        })
        awsExceptionHandler.handleMobileException = jest.fn()
        mockirer(inquirer, {
            deleteBackend: true
        }) 
        
        backendInfoManager.clearBackendInfo = jest.fn()
    })

    beforeEach(() => {
        backendInfoManager.clearBackendInfo.mockClear()
        awsExceptionHandler.handleMobileException.mockClear()
    })

    test('when api call successful', () => {
        const mock_mobileClient = {
            deleteProject: jest.fn((param, callback)=>{
                callback(null, mock_deleteResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendDelete.run()

        expect(mock_mobileClient.deleteProject).toBeCalled()
        expect(backendInfoManager.clearBackendInfo).toBeCalled()
        expect(backendInfoManager.clearBackendInfo.mock.calls[0][0]).toBe(mock_projectInfo)
    })

    test('when api call rutnrs error', () => {
        const mock_mobileClient = {
            deleteProject: jest.fn((param, callback)=>{
                callback(mock_deleteError, mock_deleteResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendDelete.run()

        expect(mock_mobileClient.deleteProject).toBeCalled()
        expect(backendInfoManager.clearBackendInfo).not.toBeCalled()
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(awsExceptionHandler.handleMobileException.mock.calls[0][0]).toBe(mock_deleteError)
    })
})
