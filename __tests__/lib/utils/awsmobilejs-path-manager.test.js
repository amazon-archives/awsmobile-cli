jest.mock('path')

const path = require('path')

const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')


describe('path manager get paths', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    const featureName = 'cloud-api'
    
    const projectInfo = {
        "ProjectName": "",
        "ProjectPath": projectPath,
        "SourceDir": "src",
        "DistributionDir": "dist"
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        path.normalize = jest.fn(path=>{return path})
        path.join = jest.fn((base, path)=>{
            if(base && path){
                return base+'/'+path
            }else{
                return '/'
            }
        })
    })

    test('get paths', () => {
        pathManager.getAWSMobileJSDirPath(projectPath)
        pathManager.getGitIgnoreFilePath(projectPath)
        pathManager.getDotAWSMobileDirPath(projectPath)
        pathManager.getDotAWSMobileDirPath_relative(projectPath)
        pathManager.getCurrentBackendInfoDirPath(projectPath)
        pathManager.getCurrentBackendInfoDirPath_relative(projectPath)
        pathManager.getBackendDirPath(projectPath)
        pathManager.getBackendDirPath_relative(projectPath)
        pathManager.getBackendBuildDirPath(projectPath)
        pathManager.getInfoDirPath(projectPath)
        pathManager.getScriptsDirPath(projectPath)
        pathManager.getYmlTempZipFilePath(projectPath)
        pathManager.getAWSExportTempZipFilePath(projectPath)
        pathManager.getYmlExtractTempDirPath(projectPath)
        pathManager.getAWSExportExtractTempDirPath(projectPath)
        pathManager.getCurrentBackendDetailsFilePath(projectPath)
        pathManager.getCurrentBackendDetailsFilePath_Relative(projectPath)
        pathManager.getCurrentBackendYamlFilePath(projectPath)
        pathManager.getCurrentBackendYamlFilePath_Relative(projectPath)
        pathManager.getCurrentBackendFeatureDirPath(projectPath, featureName)
        pathManager.getAWSExportFilePath(projectPath)
        pathManager.getAWSExportFilePath_relative(projectPath)
        pathManager.getBackendFeatureDirPath(projectPath, featureName)
        pathManager.getBackendSpecProjectYmlFilePath(projectPath)
        pathManager.getBackendSpecProjectJsonFilePath(projectPath)
        pathManager.getBackendContentZipFilePath(projectPath)
        pathManager.getBackendBuildYamlFilePath(projectPath)
        pathManager.getBackendBuildFeatureDirPath(projectPath, featureName)
        pathManager.getAWSInfoFilePath(projectPath)
        pathManager.getProjectInfoFilePath(projectPath)
        pathManager.getInitInfoFilePath(projectPath)
        pathManager.getProjectConfigFilePath(projectPath)
        pathManager.getProjectFeatureOpsFilePath(featureName)
        pathManager.getFeatureYmlTemplateFilePath(featureName)
        pathManager.getProjectCreationContentZipFilePath()
        pathManager.getSrcDirPath(projectInfo)
        pathManager.getSrcDirExportFilePath(projectInfo)
        pathManager.getSrcDirExportFilePath_relative(projectInfo)
        pathManager.getOpsFeatureFilePath(featureName)
        pathManager.getSysAwsCredentialsFilePath()
        pathManager.getSysAwsConfigFilePath()
        pathManager.getSysAWSMobileJSDirPath()
        pathManager.getSysProjectAWSConfigDirPath()
        pathManager.getSysTempDirPath()
        pathManager.getGeneralAWSInfoFilePath()
        pathManager.getGeneralAWSConfigFilePath()
        pathManager.getAWSMobileCLIConfigFilePath()

        expect(path.normalize).toBeCalled()
        expect(path.join).toBeCalled()
    })
})
