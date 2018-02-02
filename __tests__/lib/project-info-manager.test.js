jest.mock('fs-extra')

const fs = require('fs-extra')
const path = require('path')
const mockirer = require('mockirer')
const inquirer = require('inquirer')

const projectInfoManager = require('../../lib/project-info-manager.js')

const awsmobileJSConstant = require('../../lib/utils/awsmobilejs-constant.js')
const templateValidator = require('../../lib/project-validator.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const backendFormats = require('../../lib/backend-operations/backend-formats.js')

describe('project info manager functions', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {}
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    const mock_srcDir = '/src'
    const mock_distDir = '/dist'
    const mock_buildCommand = 'npm run build'
    const mock_startCommand = 'npm run start'

    const mock_backendProjectDetails = {
        "name": "name",
        "projectId": "projectId",
        "createdDate": "createdDate",
        "lastUpdatedDate": "lastUpdatedDate",
        "consoleUrl": "consoleUrl",
        "InitializationTime": "",
        "LastConfigurationTime": "",
        "LastNPMInstallTime": "",
        "FrontendLastBuildTime": "",
        "LastPublishTime": "",
        "BackendFormat": "yml",
        "BackendLastSyncTime": "",
        "BackendLastBuildTime": "",
        "BackendLastPushTime": "",
        "BackendLastPushSuccessful": false,
        "BackendProjectID": "",
        "BackendProjectName":  "",
        "BackendProjectConsoleUrl": "",
        "BackendProjectCreationTime": "",
        "BackendProjectLastUpdatedTime": ""
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        fs.__setMockFiles(MOCK_FILE_INFO) 
        mockirer(inquirer, {
            srcDir: mock_srcDir, 
            distDir: mock_distDir,
            buildCommand: mock_buildCommand,
            startCommand: mock_startCommand
        }) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('initialize', () => {
        projectInfoManager.initialize(projectPath)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })

    test('configureProjectInfo', () => {
       // process.cwd = jest.fn(()=>{ return projectPath })
        const callback = jest.fn()
        projectInfoManager.configureProjectInfo(callback)

        expect(callback).toBeCalled()
        expect(callback.mock.calls[0][1].SourceDir).toBe(mock_srcDir)
        expect(callback.mock.calls[0][1].DistributionDir).toBe(mock_distDir)
        expect(callback.mock.calls[0][1].BuildCommand).toBe(mock_buildCommand)
        expect(callback.mock.calls[0][1].StartCommand).toBe(mock_startCommand)
    })

    test('getProjectInfo', () => {
        //process.cwd = jest.fn(()=>{ return projectPath })
      
        const projectInfo = projectInfoManager.getProjectInfo()

        expect(projectInfo.ProjectPath).toBe(projectPath)
     })


    test('setProjectInfo', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })
        
        const projectInfo = projectInfoManager.setProjectInfo(mock_projectInfo)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })

    test('updateBackendProjectDetails', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })
        
        projectInfo = projectInfoManager.updateBackendProjectDetails(mock_projectInfo, mock_backendProjectDetails)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
        expect(projectInfo.BackendProjectID).toEqual(mock_backendProjectDetails.projectId)
    })
    
    test('onClearBackend', () => {
        // process.cwd = jest.fn(()=>{ return projectPath })

        projectInfoManager.onClearBackend(mock_projectInfo)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(projectInfoFilePath)
    })
})
