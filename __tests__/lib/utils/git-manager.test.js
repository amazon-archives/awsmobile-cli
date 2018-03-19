jest.mock('fs-extra')
jest.mock('../../../lib/utils/awsmobilejs-path-manager.js')

const fs = require('fs-extra')
const path = require('path')
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const gitManager = require('../../../lib/utils/git-manager.js')

describe('git manager functions', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const gitIgnoreFilePath = path.join(projectPath, '.gitignore')
    
    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[gitIgnoreFilePath] = 'mockignorefile'

    beforeAll(() => {
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })

    beforeEach(() => {
        fs.appendFileSync.mockClear()
        fs.writeFileSync.mockClear()
    })

    test('insertAwsmobilejs with gitignore file exists', () => {
        pathManager.getGitIgnoreFilePath = jest.fn((projectPath)=>{
            return gitIgnoreFilePath
        })

        gitManager.insertAwsmobilejs(projectPath)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(gitIgnoreFilePath)
        expect(fs.appendFileSync).toBeCalled()
        expect(fs.appendFileSync.mock.calls[0][0]).toBe(gitIgnoreFilePath)
    })


    test('insertAwsmobilejs with gitignore file not exists', () => {
        pathManager.getGitIgnoreFilePath = jest.fn((projectPath)=>{
            return '/none-existing/file/path'
        })

        gitManager.insertAwsmobilejs(projectPath)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe('/none-existing/file/path')
    })

    test('removeAwsmobilejs', () => {
        pathManager.getGitIgnoreFilePath = jest.fn((projectPath)=>{
            return gitIgnoreFilePath
        })

        gitManager.removeAwsmobilejs(projectPath)

        expect(fs.writeFileSync).toBeCalled()
        expect(fs.writeFileSync.mock.calls[0][0]).toBe(gitIgnoreFilePath)
    })
})