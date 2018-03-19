jest.mock('fs-extra')
jest.mock('../../../lib/utils/awsmobilejs-path-manager.js')

const fs = require('fs-extra')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const cliConfigManager = require('../../../lib/utils/cli-config-manager.js')

describe('project info manager functions', () => {
    const mockCliConfigFilePath = '/cli-config-file.json'
    const mockCliConfig =
    {
        "isInDevMode": true,
        "awsmobileAPIEndpoint": "mock_awsmobileAPIEndpoint",
        "deviceFarmTestUrl": "mock_deviceFarmTestUrl"
    }

    test('good config', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = JSON.stringify(mockCliConfig, null, '\t')
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return mockCliConfigFilePath
        })

        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).toBeDefined()
    })

    test('config file mis-format', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = 'miss-formatted json file'
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return mockCliConfigFilePath
        })
        
        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).not.toBeDefined()
    })

    test('config file missing', () => {
        let MOCK_FILE_INFO = {}
        MOCK_FILE_INFO[mockCliConfigFilePath] = JSON.stringify(mockCliConfig, null, '\t')
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getAWSMobileCLIConfigFilePath = jest.fn(()=>{
            return '/none-existing.json'
        })
        let config = cliConfigManager.getAWSMobileCLIConfig()
        expect(config).not.toBeDefined()
    })
})