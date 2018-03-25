jest.mock('fs-extra')
jest.mock('n-readlines')
jest.mock('../../../lib/utils/awsmobilejs-path-manager.js')
const fs = require('fs-extra')
const lineByLine = require('n-readlines')
const os = require('os')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const configProfileReader = require('../../../lib/aws-operations/aws-config-profile-reader.js')


describe('aws-config-profile-reader', () => {
    const mock_config_content_lines = [
        '[default]',
        'region = us-east-1',
        ' ',
        '[profile profile1]',
        'region = us-east-2',
    ]

    const mock_credentials_content_lines = [
        '[default]',
        'aws_access_key_id = accesskeyid',
        'aws_secret_access_key = accesskey',
        ' ',
        '[profile1]',
        'aws_access_key_id = profile1accesskeyid',
        'aws_secret_access_key = profile1accesskey',
    ]
    
    const awsConfigFilePath = '~/.aws/config'
    const awsCredentialsFilePath = '~/.aws/credentials'
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[awsConfigFilePath] = mock_config_content_lines.join(os.EOL)
    MOCK_FILE_INFO[awsCredentialsFilePath] = mock_credentials_content_lines.join(os.EOL)

    let configLineIndex = 0
    let credentialsLineIndex = 0

    beforeAll(() => {
        //global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        pathManager.getSysAwsConfigFilePath = jest.fn(()=>{
            return awsConfigFilePath
        })
        pathManager.getSysAwsCredentialsFilePath = jest.fn(()=>{
            return awsCredentialsFilePath
        })
        lineByLine.mockImplementation((filePath) => {
            let result = {}
            if(filePath == awsConfigFilePath){
                result.next = jest.fn(()=>{
                    if(configLineIndex < mock_config_content_lines.length){
                        return mock_config_content_lines[configLineIndex++]
                    }else{
                        return undefined
                    }
                })
            }else if(filePath == awsCredentialsFilePath){
                result.next = jest.fn(()=>{
                    if(credentialsLineIndex < mock_credentials_content_lines.length){
                        return mock_credentials_content_lines[credentialsLineIndex++]
                    }else{
                        return undefined
                    }
                })
            }
            return result
        })
    })

    beforeEach(() => {
        configLineIndex = 0
        credentialsLineIndex = 0
        fs.writeFileSync.mockClear()
    })

    test('getSystemConfig profile exists', () => {
        let sysConfig = configProfileReader.getSystemConfig('profile1')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).toBeDefined()
    })

    test('getSystemConfig profile not exists', () => {
        let sysConfig = configProfileReader.getSystemConfig('non-existing-profile')

        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig aws config file not exist', () => {
        fs.__setMockFiles({
            awsCredentialsFilePath: mock_credentials_content_lines.join(os.EOL)
        }) 
        let sysConfig = configProfileReader.getSystemConfig('profile1')
        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })

    test('getSystemConfig aws credentials file not exist', () => {
        fs.__setMockFiles({
            awsConfigFilePath: mock_config_content_lines.join(os.EOL)
        }) 
        let sysConfig = configProfileReader.getSystemConfig('profile1')
        expect(fs.existsSync).toBeCalled()
        expect(sysConfig).not.toBeDefined()
    })
})