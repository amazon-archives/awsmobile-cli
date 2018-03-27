jest.mock('fs-extra')
jest.mock('https')
jest.mock('extract-zip')
jest.mock('../../../lib/aws-operations/aws-client.js')
jest.mock('../../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../../lib/utils/directory-file-ops.js')
jest.mock('../../../lib/aws-operations/aws-config-manager.js')

const fs = require('fs-extra')
const path = require('path')
const https = require('https')
const extract = require('extract-zip')

const awsConfigManager = require('../../../lib/aws-operations/aws-config-manager.js')
const awsClient = require('../../../lib/aws-operations/aws-client.js')
const awsExceptionHandler = require('../../../lib/aws-operations/aws-exception-handler.js')
const awsmobileJSConstant = require('../../../lib/utils/awsmobilejs-constant.js')
const dfops = require('../../../lib/utils/directory-file-ops.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const mobileProjectExportManager = require('../../../lib/aws-operations/mobile-project-export-manager.js')

describe('mobile-exportjs-file-manager', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const awsInfoFilePath_project = pathManager.getAWSInfoFilePath(projectPath)
    const awsConfigFilePath_project = '~/.awsmobilejs/project-aws-config/projectName-randomString'

    const mock_projectInfo = {
        ProjectPath: projectPath,
        BackendProjectID: 'mock_BackendProjectID',	
        SourceDir: "src",
        DistributionDir: "dist",
        BuildCommand: (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
        StartCommand: (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start")
    }
    
    const mock_projectInfo_old = {
        ProjectPath: projectPath,
        BackendProjectID: 'mock_BackendProjectID',	
        SourceDir: "src_old",
        DistributionDir: "build",
        BuildCommand: (/^win/.test(process.platform) ? "npm.cmd run-script build" : "npm run-script build"),
        StartCommand: (/^win/.test(process.platform) ? "npm.cmd run-script start" : "npm run-script start")
    }
    
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": 'us-east-1'
    }

    const mock_awsInfo = {
        "IsUsingProfile": false,
        "ProfileName": 'default',
        "AWSConfigFilePath": awsConfigFilePath_project,
        "AWSInfoFilePath": awsInfoFilePath_project,
        "LastProfileSyncTime": "2018-01-01-01-01-01"
    }
    
    const mock_awsDetails = {
        info: mock_awsInfo, 
        config: mock_awsConfig
    }

    const currentInfoDirExportJSFilePath = pathManager.getAWSExportFilePath(mock_projectInfo.ProjectPath) 
    const srcDirExportFilePath = pathManager.getSrcDirExportFilePath(mock_projectInfo)
    const srcDirExportFilePath_old = pathManager.getSrcDirExportFilePath(mock_projectInfo_old)

    let MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[awsInfoFilePath_project] = JSON.stringify(mock_awsInfo, null, '\t')
    MOCK_FILE_INFO[awsConfigFilePath_project] = JSON.stringify(mock_awsConfig, null, '\t')
    MOCK_FILE_INFO[currentInfoDirExportJSFilePath] = 'mock-aws-exports.js-contents'
    MOCK_FILE_INFO[srcDirExportFilePath] = 'mock-aws-exports.js-contents'
    MOCK_FILE_INFO[srcDirExportFilePath_old] = 'mock-aws-exports.js-contents-old'

    const mock_exportProjectResponse = {
        downloadUrl: 'mock_downloadUrl'
    }

    const mock_stream = {
        on: jest.fn((event, callback)=>{
            callback()
        }),
        pipe: jest.fn((writeStream)=>{
            return mock_stream
        })
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        awsConfigManager.checkAWSConfig = jest.fn((callback)=>{
            callback(mock_awsDetails)
        })
        const mock_mobileClient = {
            exportProject: jest.fn((param, callback)=>{
                callback(null, mock_exportProjectResponse)
            })
        }
        awsClient.Mobile = jest.fn(()=>{
            return mock_mobileClient
        })
        awsExceptionHandler.handleMobileException = jest.fn()
        https.get = jest.fn((url, callback)=>{
            callback(mock_stream)
        })
        extract.mockImplementation((zipFilePath, options, callback) => {
            callback(null)
        })
        dfops.findFile = jest.fn((dir,fileName)=>{
            return 'mock_file_path'
        })
    })

    test('retrieveYaml', () => {
        let callback = jest.fn()
        mobileProjectExportManager.retrieveYaml(mock_projectInfo, callback)
        expect(callback).toBeCalled()
    })
})