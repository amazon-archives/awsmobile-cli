jest.mock('fs-extra')
jest.mock('archiver')
jest.mock('../../../lib/aws-operations/mobile-yaml-ops.js')

const fs = require('fs-extra')
const archiver = require('archiver')

const awsMobileYamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')

const contentGenerator = require('../../../lib/aws-operations/mobile-api-content-generator.js')

describe('mobile-api-content-generator', () => {
    const projectPath = '/projectName'
    
    const mock_projectInfo = {
        ProjectPath: projectPath
    }
    const backendProjectSpec = {
    }

    beforeAll(() => {
        awsMobileYamlOps.writeYamlFileSync = jest.fn()
        fs.createWriteStream = jest.fn((filePath)=>{
            return {
                on: (event, callback)=>{
                    if(callback){
                        callback()
                    }
                }
            }
        })
        archiver.create = jest.fn((format, options)=>{
            return {
                pipe: jest.fn(),
                append: jest.fn(),
                finalize: jest.fn()
            }
        })
    })

    test('generateContents', () => {
        let callback = jest.fn()
        contentGenerator.generateContents(mock_projectInfo, backendProjectSpec, callback)

        expect(awsMobileYamlOps.writeYamlFileSync).toBeCalled()
        expect(fs.createReadStream).toBeCalled()
        expect(fs.createWriteStream).toBeCalled()
        expect(callback).toBeCalled()
    })
})