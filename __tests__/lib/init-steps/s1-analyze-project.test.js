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
jest.mock('../../../lib/utils/directory-file-ops.js')

const fs = require('fs-extra')
const path = require('path')

const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')
const awsMobileYamlOps = require('../../../lib/aws-operations/mobile-yaml-ops.js')
const dfOps = require('../../../lib/utils/directory-file-ops.js')

const analyzeProject = require('../../../lib/init-steps/s1-analyze-project.js')

describe('s1 analyze project', () => {
    const projectName = 'projectName'
    const projectPath = path.join('/', projectName)
    const projectInfoFilePath = pathManager.getProjectInfoFilePath(projectPath)
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath)
    const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
    const packageJsonFilePath = path.join(projectPath, 'package.json')
    
    const mock_mobileProjectID = 'mock_mobileProjectID'
    const mock_mobileProjectName = 'mock_mobileProjectName'
    const mock_projectInfo = {
        InitializationTime: "2018-02-21-15-19-30",
        BackendProjectID: mock_mobileProjectID,
        BackendProjectName: mock_mobileProjectName
    }
    const mock_projectConfig = {
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "npm run-script build",
        "StartCommand": "npm run-script start"
    }
    const mock_backendProject = {}
    const mock_packageJson = {
        "name": "projectName",
        "version": "0.1.0",
        "private": true,
        "dependencies": {
          "aws-amplify": "^0.2.7",
          "aws-amplify-react": "^0.1.33",
          "react": "^16.2.0",
          "react-dom": "^16.2.0",
          "react-scripts": "1.1.1"
        },
        "scripts": {
          "start": "react-scripts start",
          "build": "react-scripts build",
          "test": "react-scripts test --env=jsdom",
          "eject": "react-scripts eject"
        }
    }      

    const indexFilePath = path.join(projectPath, mock_projectConfig.SourceDir)

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[projectInfoFilePath] = JSON.stringify(mock_projectInfo, null, '\t')
    MOCK_FILE_INFO[projectConfigFilePath] = JSON.stringify(mock_projectConfig, null, '\t')
    MOCK_FILE_INFO[backendYmlFilePath] = JSON.stringify('--- !com.amazonaws.mobilehub.v0.Project', null, '\t')
    MOCK_FILE_INFO[packageJsonFilePath] = JSON.stringify(mock_packageJson, null, '\t')
    MOCK_FILE_INFO[indexFilePath] = 'index file contents'

    let mock_initInfo = {
        projectPath: projectPath,
        mobileProjectID: mock_mobileProjectID,
        backupAWSMobileJSDirPath: undefined,
        projectInfo: mock_projectInfo,
        projectConfig: mock_projectConfig,
        backendProject: mock_backendProject,
        packageJson: mock_packageJson,
        framework: undefined,
        initialStage: 'clean-slate'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.cwd = jest.fn(()=>{ return projectPath })
        fs.__setMockFiles(MOCK_FILE_INFO) 
        dfOps.readJsonFile = jest.fn((path)=>{
            let obj
            try{
                let fileconstent = fs.readFileSync(path, 'utf8')
                obj = JSON.parse(fileconstent)
            }catch(e){
                console.log(e)
                obj = undefined
            }
            return obj
        })
    })

    beforeEach(() => {
        fs.writeFileSync.mockClear()
    })

    test('run', () => {
        
        let initInfo = {
            projectPath: projectPath,
            yesFlag: false,
            mobileProjectID: 'mock_mobileProjectID'
        }
        return analyzeProject.run(initInfo).then((initInfo) => {
            expect(initInfo.projectPath).toBe(projectPath)
        })
    })
})