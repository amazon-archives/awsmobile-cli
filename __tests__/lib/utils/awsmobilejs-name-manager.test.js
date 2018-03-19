const nameManager = require('../../../lib/utils/awsmobilejs-name-manager.js')

describe('awsmobilejs name manager', () => {
    const projectName = 'projectName'
    const projectPath = '/projectName'
    
    const projectInfo = {
        "ProjectName": "",
        "ProjectPath": projectPath,
        "SourceDir": "src",
        "DistributionDir": "dist"
    }

    beforeAll(() => {
    })

    test('name generation methods exist', () => {
        expect(nameManager.generateProjectName()).toBeDefined()
        expect(nameManager.generateAWSConfigFileName(projectInfo)).toBeDefined()
        expect(nameManager.generateIAMUserName()).toBeDefined()
        expect(nameManager.generateBackendProjectName(projectInfo)).toBeDefined()
        expect(nameManager.generateDeviceFarmTestRunName(projectInfo)).toBeDefined()
        expect(nameManager.generateCloudFrontInvalidationReference(projectInfo)).toBeDefined()
        expect(nameManager.generateTempName('seedName')).toBeDefined()
    })
})
