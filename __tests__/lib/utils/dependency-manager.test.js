jest.mock('fs-extra')
jest.mock('../../../lib/utils/directory-file-ops.js')
jest.mock('child_process')

const fs = require('fs-extra')
const path = require('path')
const { spawn } = require('child_process')

const dfOps = require('../../../lib/utils/directory-file-ops.js')

const dependencyManager = require('../../../lib/utils/dependency-manager.js')

describe('project info manager functions', () => {
    const projectPath = '/projectName'
    const packageJsonFilePath = path.normalize(path.join(projectPath, 'package.json'))

    const mock_packageJson = {
        "name": "awsmobile-cli",
        "version": "1.0.20",
        "dependencies": {
            "react": "^16.1.0",
        }
    }
    
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[packageJsonFilePath] = JSON.stringify(mock_packageJson, null, 4)

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        spawn.mockImplementation((command, args, options)=>{
            return {
                on: jest.fn((event, callback)=>{
                    if(callback){
                        callback(0)
                    }
                })
            }
        })
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('npmInstall', () => {
        fs.__setMockFiles(MOCK_FILE_INFO) 
        let mock_callback = jest.fn()
        dependencyManager.npmInstall(projectPath, mock_callback)

        expect(mock_callback).toBeCalled()
    })

    test('npmInstall no packagejson', () => {
        fs.__setMockFiles({}) 
        let mock_callback = jest.fn()
        dependencyManager.npmInstall(projectPath, mock_callback)

        expect(mock_callback).toBeCalled()
    })

    test('setupAmplifyDependency empty', () => {
        let mock_initInfo = {
            projectPath: projectPath,
            packageJson: undefined,
            framework: undefined
        }
        dependencyManager.setupAmplifyDependency(mock_initInfo).then((initInfo)=>{
            expect(spawn).toBeCalled()
        })
    })

    test('setupAmplifyDependency react', () => {
        let mock_initInfo = {
            projectPath: projectPath,
            packageJson: mock_packageJson,
            framework: 'react'
        }
        dependencyManager.setupAmplifyDependency(mock_initInfo).then((initInfo)=>{
            expect(spawn).toBeCalled()
        })
    })

    test('setupAmplifyDependency react-native', () => {
        let mock_initInfo = {
            projectPath: projectPath,
            packageJson: mock_packageJson,
            framework: 'react-native'
        }
        dependencyManager.setupAmplifyDependency(mock_initInfo).then((initInfo)=>{
            expect(spawn).toBeCalled()
        })
    })

    test('setupAmplifyDependency default', () => {
        let mock_initInfo = {
            projectPath: projectPath,
            packageJson: mock_packageJson,
            framework: 'default'
        }
        dependencyManager.setupAmplifyDependency(mock_initInfo).then((initInfo)=>{
            expect(spawn).toBeCalled()
        })
    })
})