jest.mock('fs-extra')

const fs = require('fs-extra')
const path = require('path')
const mockirer = require('mockirer')
const inquirer = require('inquirer')

const chooseStrategy = require('../../../lib/init-steps/s2-choose-strategy.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

describe('s2 choose strategy', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
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
        mobileProjectID: mock_mobileProjectID + '-diff',
        backupAWSMobileJSDirPath: undefined,
        projectInfo: mock_projectInfo,
        projectConfig: mock_projectConfig,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
        initialStage: 'clean-slate'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        fs.__setMockFiles(MOCK_FILE_INFO)   
        mockirer(inquirer, {
            confirmCreateNew: true, 
            confirmReEstablish: true,
            confirmSwitch: true,
            ReEstablishOrNew: 'reestablish',
            ImportOrNew: 'import'
        }) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
        mock_initInfo.mobileProjectID = undefined
        mock_initInfo.initialStage = undefined
    })

    test('initial stage is clean-slate', () => {
        mock_initInfo.initialStage = 'clean-slate'
        chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('create')
    })

    test('initial stage is invalid', () => {
        mock_initInfo.initialStage = 'invalid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('create')
    })

    test('initial stage is backend-valid', () => {
        mock_initInfo.initialStage = 'backend-valid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('import')
    })

    test('initial stage is project-info-valid', () => {
        mock_initInfo.initialStage = 'project-info-valid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('link')
    })

    test('initial stage is valid', () => {
        mock_initInfo.initialStage = 'valid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('create')
    })

    test('with mobile project id and initial stage is clean-slate', () => {
        mock_initInfo.mobileProjectID = mock_mobileProjectID
        mock_initInfo.initialStage = 'clean-slate'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('link')
    })

    test('with mobile project id and initial stage is invalid', () => {
        mock_initInfo.mobileProjectID = mock_mobileProjectID
        mock_initInfo.initialStage = 'invalid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('link')
    })

    test('with mobile project id and initial stage is backend-valid', () => {
        mock_initInfo.mobileProjectID = mock_mobileProjectID
        mock_initInfo.initialStage = 'backend-valid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('link')
    })

    test('with mobile project id and initial stage is valid', () => {
        mock_initInfo.mobileProjectID = mock_mobileProjectID
        mock_initInfo.initialStage = 'valid'
        let resultInitInfo = chooseStrategy.run(mock_initInfo)
        expect(mock_initInfo.strategy).toBe('link')
    })
})