jest.mock('fs-extra')

const fs = require('fs-extra')
const path = require('path')
const mockirer = require('mockirer')
const inquirer = require('inquirer')

const configureStep = require('../../../lib/init-steps/s4-configure.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

describe('s4 configure', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
   
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_projectInfo = {"ProjectPath": projectPath}
    const mock_projectConfig = {}
    const mock_backendProject = {}
    const mock_packageJson = {}
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    let mock_initInfo = {
        projectPath: projectPath,
        mobileProjectID: mock_mobileProjectID + '-diff',
        backupAWSMobileJSDirPath: undefined,
        projectInfo: mock_projectInfo,
        projectConfig: undefined,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
        initialStage: 'clean-slate',
		strategy: 'create'
    }

    const mock_srcDir = '/src'
    const mock_distDir = '/dist'
    const mock_buildCommand = 'npm run build'
    const mock_startCommand = 'npm run start'

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

    test('run', () => {
		configureStep.run(mock_initInfo)
		expect(mock_initInfo.projectConfig.StartCommand).toBe(mock_startCommand)
		expect(fs.writeFileSync).toBeCalled()
    })
})