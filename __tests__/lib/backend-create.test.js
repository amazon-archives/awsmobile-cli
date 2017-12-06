jest.mock('fs-extra')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager.js')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')

const fs = require('fs-extra')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const backendCreate = require('../../lib/backend-create.js')

const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')

describe('backend create', () => {
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
    }
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }

    const mock_mobileProjectName = 'mock_mobileProjectName'

    const mock_createError = {
        code: 'mockCode'
    }

    const mock_createResponse = {
        details: {
            name: mock_mobileProjectName
        }
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsConfig)
        })
        awsExceptionHandler.handleMobileException = jest.fn()
        mockirer(inquirer, {
            mobileProjectName: mock_mobileProjectName
        }) 
        backendInfoManager.syncCurrentBackendInfo = 
        jest.fn((projectInfo, backendDetails, awsConfig, syncToDevFlag, callback) => {
            if(callback){
                callback()
            }
        })
    })

    beforeEach(() => {
        fs.existsSync.mockClear()
        fs.renameSync.mockClear()
        fs.emptydir.mockClear()
        fs.copySync.mockClear()
    })

    test('when api call successful', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            createProject: jest.fn((param, callback)=>{
                callback(null, mock_createResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendCreate.createBackendProject(mock_projectInfo, callback)

        expect(backendInfoManager.syncCurrentBackendInfo).toBeCalled()
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][0]).toBe(mock_projectInfo)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][1]).toBe(mock_createResponse.details)
        expect(backendInfoManager.syncCurrentBackendInfo.mock.calls[0][2]).toBe(mock_awsConfig)
        expect(callback).toBeCalled()
    })

    test('when api call rutnrs error', () => {
        const callback = jest.fn()
        const mock_mobileClient = {
            createProject: jest.fn((param, callback)=>{
                callback(mock_createError, mock_createResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })

        backendCreate.createBackendProject(mock_projectInfo, callback)
        expect(awsExceptionHandler.handleMobileException).toBeCalled()
        expect(awsExceptionHandler.handleMobileException.mock.calls[0][0]).toBe(mock_createError)
        expect(callback).not.toBeCalled()
    })
})
