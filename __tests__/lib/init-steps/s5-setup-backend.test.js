jest.mock('../../../lib/backend-create.js')
jest.mock('../../../lib/backend-import.js')
jest.mock('../../../lib/backend-retrieve.js')

const backendCreate = require('../../../lib/backend-create.js')
const backendImport = require('../../../lib/backend-import.js')
const backendRetrieve = require('../../../lib/backend-retrieve.js')

const setupBackend = require('../../../lib/init-steps/s5-setup-backend.js')

describe('s5 setup backend', () => {
    const projectName = 'projectName'
    const projectPath = '/' + projectName
   
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_projectInfo = {"ProjectPath": projectPath}
    const mock_projectConfig = {}
    const mock_backendProject = {}
    const mock_packageJson = {}

    let mock_initInfo = {
        projectPath: '/projectName',
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

    beforeAll(() => {
        global.console = {log: jest.fn()}
        backendCreate.createBackendProject = jest.fn((projectInfo, options, callback)=>{
            callback()
        })
        backendImport.run = jest.fn((projectInfo, callback)=>{
            callback()
        })
        backendRetrieve.linkToBackend = jest.fn((projectInfo, mobileProjectID, syncToDevFlag, callback)=>{
            callback()
        })
    })

    test('create strategy', () => {
        mock_initInfo.strategy = 'create'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendCreate.createBackendProject).toBeCalled()
        })
    })

    test('import strategy', () => {
        mock_initInfo.strategy = 'import'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendImport.run).toBeCalled()
        })
    })

    test('link strategy', () => {
        mock_initInfo.strategy = 'link'
		return setupBackend.run(mock_initInfo).then((initInfo)=>{
            expect(backendRetrieve.linkToBackend).toBeCalled()
        })
    })
})