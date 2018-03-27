jest.mock('fs-extra')

jest.mock('../../../lib/aws-operations/aws-client.js')
jest.mock('../../../lib/aws-operations/aws-exception-handler.js')
jest.mock('../../../lib/utils/directory-file-ops.js')
jest.mock('../../../lib/aws-operations/aws-config-manager.js')

const fs = require('fs-extra')
const path = require('path')

const awsClient = require('../../../lib/aws-operations/aws-client.js')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const opsCloudApi = require('../../../lib/backend-operations/ops-cloud-api.js')

const lambdaUploader = require('../../../lib/backend-operations/cloud-api-lambda-uploader.js')

describe('cloud-api-lambda-uploader', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const featureBuildDirPath = pathManager.getBackendBuildFeatureDirPath(projectPath, opsCloudApi.featureName)
    const builtZipFilePath1 = path.join(featureBuildDirPath, 'lambda1.zip')
    const builtZipFilePath2 = path.join(featureBuildDirPath, 'lambda2.zip')

    const mock_projectInfo = {
        ProjectPath: projectPath
    }
    
    const mock_awsConfig = {
        "accessKeyId":"mockAccessKeyID",
        "secretAccessKey":"mockSecretAccessKey",
        "region": 'us-east-1'
    }

    const mock_awsInfo = {
        "IsUsingProfile": false,
        "ProfileName": 'default',
        "AWSConfigFilePath": 'awsConfigFilePath_project',
        "AWSInfoFilePath": 'awsInfoFilePath_project',
        "LastProfileSyncTime": "2018-01-01-01-01-01"
    }
    
    const mock_awsDetails = {
        info: mock_awsInfo, 
        config: mock_awsConfig
    }

    const mock_backendProjectDetails = {
        resources: [
            {
                'type': 'AWS::S3::Bucket',
                'feature': 'common',
                'name': 'myapp-deployments-mobilehub-1234323445',
                'attributes': {
                    'region': 'us-east-1',
                    's3-bucket-console-url': 'https://s3.console.aws.amazon.com/s3/buckets/myapp-deployments-mobilehub-1234323445'
                }
            }
        ]
    }

    let MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[builtZipFilePath1] = 'mock-zip-content-1'
    MOCK_FILE_INFO[builtZipFilePath2] = 'mock-zip-content-2'

    beforeAll(() => {
        global.console = {log: jest.fn()}
        fs.__setMockFiles(MOCK_FILE_INFO) 
        fs.createReadStream = jest.fn((filePath)=>{
            return {
                on: jest.fn((event, callback)=>{
                    callback()
                }),
            }
        })
        const mock_s3Client = {
            headObject: jest.fn((param, callback)=>{
                callback({}, {}) //invoke callback with err, means no such object is in S3, go ahead with the upload
            }), 
            upload: jest.fn((param, callback)=>{
                callback(null, {}) 
            })
        }
        awsClient.S3 = jest.fn(()=>{
            return mock_s3Client
        })
    })

    test('uploadLambdaZipFiles', () => {
        let callback = jest.fn()
        lambdaUploader.uploadLambdaZipFiles(mock_projectInfo, mock_awsDetails, mock_backendProjectDetails, opsCloudApi.featureName, callback)
        expect(callback).toBeCalled()
    })
})