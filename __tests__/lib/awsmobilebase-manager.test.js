jest.mock('fs-extra')

const fs = require('fs-extra')

const baseManager = require('../../lib/awsmobilebase-manager.js')

const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')

describe('awsmobile base manager functions', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    const awsmobilejsDirPath = pathManager.getAWSMobileJSDirPath(projectPath)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    
    const mock_projectInfo = {
        "ProjectName": "",
        "ProjectPath": "",
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start",
    }
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })

    beforeEach(() => {
        fs.existsSync.mockClear()
        fs.renameSync.mockClear()
        fs.emptydir.mockClear()
        fs.copySync.mockClear()
    })

    test('placeAwsmobileBase', () => {
        const callback = jest.fn()

        baseManager.placeAwsmobileBase(projectPath, callback)

        expect(fs.existsSync).toBeCalled()
        expect(fs.existsSync.mock.calls[0][0]).toBe(awsmobilejsDirPath)
        expect(callback).toBeCalled()
    })

    test('backupAwsmobileBase', () => {
        baseManager.backupAwsmobileBase(projectPath)
        expect(fs.renameSync).toBeCalled()
    })
})
