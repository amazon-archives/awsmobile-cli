jest.mock('fs-extra')
jest.mock('../../lib/project-info-manager')
jest.mock('../../lib/utils/awsmobilejs-constant.js')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/utils/git-manager.js')
jest.mock('../../lib/aws-operations/mobile-exportjs-file-manager.js')

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const projectInfoManager = require('../../lib/project-info-manager')
const awsmobileJSConstant = require('../../lib/utils/awsmobilejs-constant.js')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const gitManager = require('../../lib/utils/git-manager.js')
const mobileExportJSFileManager = require('../../lib/aws-operations/mobile-exportjs-file-manager.js')

const commandRemove = require('../../lib/command-remove.js')

describe('command remove', () => {

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
    var MOCK_FILE_INFO = {}
    const mockDirPath = path.join(mock_projectInfo.ProjectPath, awsmobileJSConstant.AWSMobileJSBackUpDirName)
    const mockFilePath = path.join(mockDirPath, 'mockFileName')
    MOCK_FILE_INFO[mockFilePath] = 'mock file content'
    
    beforeAll(() => {
        global.console = {log: jest.fn()}

        mockirer(inquirer, {
            ok: true
        }) 

        fs.__setMockFiles(MOCK_FILE_INFO)

        projectInfoManager.getProjectInfo = jest.fn(()=>{
            return mock_projectInfo
        })

        mobileExportJSFileManager.onClearBackend = jest.fn()
        gitManager.removeAwsmobilejs = jest.fn()
      
    })

    test('removeAWSMobileJS', () => {
        commandRemove.removeAWSMobileJS()
        
        expect(mobileExportJSFileManager.onClearBackend).toBeCalled()
        expect(gitManager.removeAwsmobilejs).toBeCalled()
        expect(fs.readdirSync).toBeCalled()
        expect(fs.removeSync).toBeCalled()
    })
    
})