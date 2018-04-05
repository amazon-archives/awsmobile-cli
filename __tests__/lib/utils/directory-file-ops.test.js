jest.mock('fs-extra')

const fs = require('fs-extra')
const path = require('path')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

describe('directory-file-ops', () => {

    const mock_dirPath = '/mock_dir'
    const mock_file1Path = path.join(mock_dirPath, 'file1')
    const mock_file2Path = path.join(mock_dirPath, 'file2')
    const mock_file3Path = path.join(mock_dirPath, 'file3.json')

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[mock_file1Path] = 'file1 contents'
    MOCK_FILE_INFO[mock_file2Path] = 'file2 contents'
    MOCK_FILE_INFO[mock_file3Path] = JSON.stringify({
        key: 'value'
    }, null, 4)

    beforeAll(() => {
        fs.__setMockFiles(MOCK_FILE_INFO) 
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('getDirContentMTime', () => {
        let mtime = dfOps.getDirContentMTime(mock_dirPath)
        expect(mtime).toBeDefined()
    })

    test('scan', () => {
        let fileList = dfOps.scan(mock_dirPath)
        expect(fileList).toBeDefined()
    })

    test('findFile', () => {
        let filePath = dfOps.findFile(mock_dirPath,'file1')
        expect(filePath).toEqual(mock_file1Path)
    })

    test('readJsonFile', () => {
        let obj = dfOps.readJsonFile(mock_file3Path)
        expect(obj).toBeDefined()
    })
})
