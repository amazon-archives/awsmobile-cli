jest.mock('fs-extra')

const fs = require('fs-extra')
const path = require('path')

jest.mock('../../../lib/utils/directory-file-ops.js')

const dfOps = require('../../../lib/utils/directory-file-ops.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const onFailure = require('../../../lib/init-steps/s61-on-failure.js')

describe('s61 on failure', () => {
  
    const projectName = 'projectName'
    const projectPath = '/' + projectName
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_projectInfo = {}
    const mock_projectConfig = {}
    const mock_backendProject = {}
    const mock_packageJson = {}
    const mock_backupAWSMobileJSDirPath = path.join(projectPath, 'mock_backendDir')
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    let mock_initInfo = {
        projectPath: projectPath,
        mobileProjectID: mock_mobileProjectID,
        backupAWSMobileJSDirPath: mock_backupAWSMobileJSDirPath,
        projectInfo: mock_projectInfo,
        projectConfig: mock_projectConfig,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
		initialStage: 'clean-slate',
		strategy: 'create'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        process.exit = jest.fn((code)=>{return code})
        fs.__setMockFiles(MOCK_FILE_INFO) 

        dfOps.readJsonFile = jest.fn((path)=>{
            return mock_initInfo
        })
    })

    test('run', () => {
        let mock_error = {
            'message': 'mock error message'
        }
		onFailure.run(mock_error)
        expect(dfOps.readJsonFile).toBeCalled()
        expect(fs.removeSync).toBeCalled()
        expect(fs.moveSync).toBeCalled()
    })
})