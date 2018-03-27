jest.mock('fs-extra')
jest.mock('opn')
jest.mock('../../../lib/aws-operations/aws-config-info-manager.js')
jest.mock('../../../lib/utils/press-enter-to-continue.js')

const fs = require('fs-extra')
const opn = require('opn')

const inquirer = require('inquirer')
const mockirer = require('mockirer')

const awsConfigFileManager = require('../../../lib/aws-operations/aws-config-info-manager.js')
let pressEnterKeyToContinue = require('../../../lib/utils/press-enter-to-continue.js')

const configNewUser = require('../../../lib/aws-operations/aws-config-new-user.js')

describe('project info manager functions', () => {
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": "us-east-1"
    }
    const mock_awsInfo = {
        "AWSConfigFilePath":"mockConfigFilePath"
    }
    const mock_awsDetails = {
        info: mock_awsInfo, 
        config: mock_awsConfig
    }
    const mock_region = 'us-east-1'

    beforeAll(() => {
        global.console = {log: jest.fn()}
        pressEnterKeyToContinue.run = jest.fn((handle)=>{
            return new Promise((resolve, reject)=>{
                resolve(handle)
            })
        })
        mockirer(inquirer, {
            userName: 'mock_userName', 
            region: 'us-east-1',
            accessKeyId: 'newKeyID',
            secretAccessKey: "newKey",
        }) 
        awsConfigFileManager.setNoProfileSync = jest.fn()
        awsConfigFileManager.validateAWSConfig = jest.fn(()=>{return true})
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('setupNewUser', () => {
        let callback = jest.fn()
        return configNewUser.setupNewUser(mock_awsDetails, callback).then(() => {
            expect(callback).toBeCalled()
        })
    })
})