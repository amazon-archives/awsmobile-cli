/* 
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
*/
"use strict";
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
