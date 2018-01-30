jest.mock('fs-extra')
jest.mock('../../lib/project-info-manager')
jest.mock('../../lib/awsmobilebase-manager.js')
jest.mock('../../lib/project-validator.js')
jest.mock('../../lib/backend-create.js')
jest.mock('../../lib/backend-retrieve.js')
jest.mock('../../lib/utils/git-manager')
jest.mock('../../lib/utils/awsmobilejs-path-manager.js')
jest.mock('../../lib/utils/awsmobilejs-name-manager.js')
jest.mock('../../lib/backend-operations/backend-spec-manager.js')
jest.mock('../../lib/backend-operations/backend-info-manager.js')
jest.mock('../../lib/backend-operations/ops-project.js')
jest.mock('../../lib/aws-operations/aws-client.js')
jest.mock('../../lib/aws-operations/aws-config-manager')
jest.mock('../../lib/aws-operations/aws-exception-handler.js')

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const mockirer = require('mockirer')

const projectInfoManager = require('../../lib/project-info-manager')
const awsmobileBaseManager = require('../../lib/awsmobilebase-manager.js')
const projectValidator = require('../../lib/project-validator.js')
const backendCreate = require('../../lib/backend-create.js')
const backendRetrieve = require('../../lib/backend-retrieve.js')
const gitManager = require('../../lib/utils/git-manager')
const pathManager = require('../../lib/utils/awsmobilejs-path-manager.js')
const nameManager = require('../../lib/utils/awsmobilejs-name-manager.js')
const backendSpecManager = require('../../lib/backend-operations/backend-spec-manager.js')
const backendInfoManager = require('../../lib/backend-operations/backend-info-manager.js')
const opsProject = require('../../lib/backend-operations/ops-project.js')
const awsClient = require('../../lib/aws-operations/aws-client.js')
const awsConfigManager = require('../../lib/aws-operations/aws-config-manager')
const awsExceptionHandler = require('../../lib/aws-operations/aws-exception-handler.js')

const commandInit = require('../../lib/command-init.js')

describe('command init', () => {

    const mock_mobile_project_id = 'mock_mobile_project_id'

    
    beforeAll(() => {
        global.console = {log: jest.fn()}

        mockirer(inquirer, {
            confirmInit: true
        }) 




        projectInfoManager.setProjectInfo = jest.fn()

        backendSpecManager.getBackendProjectObject = jest.fn((projectInfo)=>{
            return mock_backendProject
        })

        pathManager.getOpsFeatureFilePath = jest.fn((featureName)=>{
            return path.normalize(path.join(__dirname +'/../../lib/backend-operations', featureOpsMapping[featureName]))
        })

        backendSpecManager.getEnabledFeaturesFromObject = jest.fn((backendProject) => {
            return ['cloud-api']
        })

        opeCloudApi.build = jest.fn((projectInfo, backendProject, callback)=>{
            callback(true)
        })

        opsProject.build = jest.fn((projectInfo, backendProject, callback)=>{
            callback(true)
        })
    })

    beforeEach(() => {
    })

    test('int without mobile project id', () => {
        commandInit.init()
    })

    test('int with mobile project id', () => {
        commandInit.init(mock_mobile_project_id)
    })

    test('int on valid awsmobilejs project without mobile project id', () => {
        pathManager.getProjectInfoFilePath = jest.fn((projectPath)=>{
            return path.normalize(__dirname +'/../../_mocks_/mock-project-info.json')
        }) 
        commandInit.init()
    })

    test('int on valid awsmobilejs project with mobile project id', () => {
        pathManager.getProjectInfoFilePath = jest.fn((projectPath)=>{
            return path.normalize(__dirname +'/../../_mocks_/mock-project-info.json')
        }) 
        commandInit.init(mock_mobile_project_id)
    })
    
})