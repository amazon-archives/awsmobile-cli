jest.mock('fs-extra')

const fs = require('fs-extra')

jest.mock('../../../lib/utils/dependency-manager.js')
jest.mock('../../../lib/utils/git-manager.js')

const dependencyManager = require('../../../lib/utils/dependency-manager.js')
const gitManager = require('../../../lib/utils/git-manager.js')

const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const onSuccess = require('../../../lib/init-steps/s60-on-success.js')

describe('s5 setup backend', () => {
  
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
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    let mock_initInfo = {
        projectPath: projectPath,
        mobileProjectID: mock_mobileProjectID,
        backupAWSMobileJSDirPath: undefined,
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
        fs.__setMockFiles(MOCK_FILE_INFO) 

        dependencyManager.setupAmplifyDependency = jest.fn((initInfo)=>{
            return new Promise((resolve, reject)=>{
                resolve(initInfo)
            })
        })
        gitManager.insertAwsmobilejs = jest.fn()
    })

    test('run', () => {
		return onSuccess.run(mock_initInfo).then((initInfo)=>{
            expect(dependencyManager.setupAmplifyDependency).toBeCalled()
            expect(gitManager.insertAwsmobilejs).toBeCalled()
            expect(fs.writeFileSync).toBeCalled()
        })
    })
})