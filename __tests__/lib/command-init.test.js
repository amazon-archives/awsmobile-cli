jest.mock('fs-extra')
jest.mock('../../lib/project-info-manager')
jest.mock('../../lib/awsmobilebase-manager.js')
jest.mock('../../lib/project-validator.js')
jest.mock('../../lib/backend-create.js')
jest.mock('../../lib/backend-retrieve.js')
jest.mock('../../lib/utils/git-manager')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/utils/awsmobilejs-name-manager.js')
jest.mock('../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')
jest.mock('../../lib/backend-operations/ops-project.js')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const projectInfoManager = require('../../lib/project-info-manager')
const awsmobileBaseManager = require('../../lib/awsmobilebase-manager.js')
const projectValidator = require('../../lib/project-validator.js')
const backendCreate = require('../../lib/backend-create.js')
const backendRetrieve = require('../../lib/backend-retrieve.js')
const gitManager = require('../../lib/utils/git-manager')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const nameManager = require('../../lib/utils/awsmobilejs-name-manager.js')
const backendSpecManager = require('../../lib/backend-operations/backend-spec-manager.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')
const opsProject = require('../../lib/backend-operations/ops-project.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')

const commandInit = require('../../lib/command-init.js')

describe('command init', () => {

    const mock_mobile_project_id = 'mock_mobile_project_id'

    const mock_projectInfo = {
        "ProjectName": 'projectName',
        "ProjectPath": '/projectName',
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
        'BackendProjectName': 'BackendProjectName', 
        'BackendProjectID': 'BackendProjectID', 
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}

        mockirer(inquirer, {
            confirmInit: true
        }) 

        awsmobileBaseManager.backupAwsmobileBase = jest.fn()
        awsmobileBaseManager.placeAwsmobileBase = jest.fn((projectPath, callback)=>{
            callback()
        })
        gitManager.initialize = jest.fn()
        projectInfoManager.configureProjectInfo = jest.fn((callback)=>{
            if(callback){
                callback(mock_projectInfo, mock_projectInfo)
            }
        })
        backendRetrieve.linkToBackend = jest.fn((projectInfo, mobileProjectID, flag, callback)=>{
            callback(projectInfo)
        })
        backendCreate.createBackendProject = jest.fn((projectInfo, callback)=>{
            callback(projectInfo)
        })

        pathManager.getDotAWSMobileDirPath_relative = jest.fn((path)=>{return path + 'relative'})
        pathManager.getCurrentBackendInfoDirPath_relative = jest.fn((path)=>{return path + 'relative'})
        pathManager.getBackendDirPath_relative = jest.fn((path)=>{return path + 'relative'})
    })

    beforeEach(() => {
        awsmobileBaseManager.backupAwsmobileBase.mockClear()
        awsmobileBaseManager.placeAwsmobileBase.mockClear()
        backendRetrieve.linkToBackend.mockClear()
        backendCreate.createBackendProject.mockClear()
    })

    test('init without mobile project id', () => {
        commandInit.init()
        
        expect(awsmobileBaseManager.backupAwsmobileBase).toBeCalled()
        expect(awsmobileBaseManager.placeAwsmobileBase).toBeCalled()
        expect(backendRetrieve.linkToBackend).not.toBeCalled()
        expect(backendCreate.createBackendProject).toBeCalled()

    })

    test('init with mobile project id', () => {
        commandInit.init(mock_mobile_project_id)
        
        expect(awsmobileBaseManager.backupAwsmobileBase).toBeCalled()
        expect(awsmobileBaseManager.placeAwsmobileBase).toBeCalled()
        expect(backendRetrieve.linkToBackend).toBeCalled()
        expect(backendCreate.createBackendProject).not.toBeCalled()
    })

    test('init on valid awsmobilejs project without mobile project id', () => {
        projectValidator.validate = jest.fn((projectPath)=>{return true})

        pathManager.getProjectInfoFilePath = jest.fn((projectPath)=>{
            return path.normalize(__dirname +'/../../_mocks_/mock-project-info.json')
        }) 

        commandInit.init()

        expect(backendRetrieve.linkToBackend).not.toBeCalled()
        expect(backendCreate.createBackendProject).toBeCalled()
    })

    test('init on valid awsmobilejs project with mobile project id', () => {
       projectValidator.validate = jest.fn((projectPath)=>{return true})

        pathManager.getProjectInfoFilePath = jest.fn((projectPath)=>{
            return path.normalize(__dirname +'/../../_mocks_/mock-project-info.json')
        }) 

        commandInit.init(mock_mobile_project_id)

        expect(backendRetrieve.linkToBackend).toBeCalled()
        expect(backendCreate.createBackendProject).not.toBeCalled()
    })
    
})