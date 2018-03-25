jest.mock('fs-extra')

jest.mock('../../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../../lib/aws-operations/mobile-api-content-generator.js')
jest.mock('../../../lib/aws-operations/mobile-project-export-manager.js')
jest.mock('../../../lib/aws-operations/mobile-yaml-ops.js')

const fs = require('fs-extra')
const path = require('path')

const backendSpecManager = require('../../../lib/backend-operations/backend-spec-manager.js')
const backendContentManager = require('../../../lib/aws-operations/mobile-api-content-generator.js')
const mobileProjectExport = require('../../../lib/aws-operations/mobile-project-export-manager.js')
const awsMobileYamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')

const awsmobileJSConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const opsProject = require('../../../lib/backend-operations/ops-project.js')


describe('project info manager functions', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    const backendContentZipFilePath = pathManager.getBackendContentZipFilePath(projectPath)
    
    
    let mock_projectInfo = {
        ProjectPath: projectPath,
        BackendLastBuildTime: '2000-01-01-01-00-00' //"YYYY-MM-DD-HH-mm-ss"
    }
    let mock_awsDetails = {}
    let mock_backendDetails = {
        state: 'NORMAL'
    }
    let mock_backendProject = {}
    let mock_enabledFeatures = []

    let MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')
    MOCK_FILE_INFO[backendContentZipFilePath] = 'mock zip content'


    beforeAll(() => {
        global.console = {log: jest.fn()}
        backendSpecManager.getLastModificationTime = jest.fn((projectInfo)=>{
            return fs.statSync(backendYmlFilePath).mtime
        })
        backendContentManager.generateContents = jest.fn((projectInfo, backendProject, callback)=>{
            if(callback){
                callback()
            }
        })
        mobileProjectExport.retrieveYaml = jest.fn((projectInfo, callback)=>{
            if(callback){
                callback()
            }
        })
        awsMobileYamlOps.readYamlFileSync = jest.fn((currentBackendYamlFilePath)=>{
            return mock_backendProject
        })
    })

    beforeEach(() => {
        fs.__setMockFiles(MOCK_FILE_INFO) 
        backendContentManager.generateContents.mockClear()
    })

    test('build', () => { 
        mock_projectInfo = {
            ProjectPath: projectPath,
            BackendLastBuildTime: '0000-00-00-00-00-00' //"YYYY-MM-DD-HH-mm-ss", make sure buidl time is before modification time
        }

        MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')

        let callback = jest.fn()
        opsProject.build(mock_projectInfo, mock_backendProject, callback)
        expect(backendContentManager.generateContents).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('build no build needed', () => {

        mock_projectInfo = {
            ProjectPath: projectPath,
            BackendLastBuildTime: '9999-01-01-00-00-00' //"YYYY-MM-DD-HH-mm-ss", make sure build time is not before any modification time
        }

        MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')

        let callback = jest.fn()
        opsProject.build(mock_projectInfo, mock_backendProject, callback)
        expect(backendContentManager.generateContents).not.toBeCalled()
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsProject.syncCurrentBackendInfo(mock_projectInfo, mock_backendDetails, mock_awsDetails, callback)
        expect(mobileProjectExport.retrieveYaml).toBeCalled()
        expect(awsMobileYamlOps.readYamlFileSync).toBeCalled()
        expect(callback).toBeCalledWith(mock_backendProject)
    })

    test('syncToDevBackend', () => {
        opsProject.syncToDevBackend(mock_projectInfo, mock_backendProject, mock_enabledFeatures)
        expect(backendSpecManager.setBackendProjectObject).toBeCalled()
    })

    test('isInNormalState', () => {
        let result = opsProject.isInNormalState(mock_backendDetails)
        expect(result).toBeDefined()
    })
})