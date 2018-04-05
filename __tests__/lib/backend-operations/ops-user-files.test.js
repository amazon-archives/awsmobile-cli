jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/user-files-ops.js')

const opsUserFiles = require('../../../lib/backend-operations/ops-user-files.js')

describe('ops analytics', () => {
    const mock_projectInfo = {}
    const mock_backendProjectSpec = {}
    const mock_awsDetails = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}
    })

    beforeEach(() => {
        featureOps.specify = undefined
        featureOps.onFeatureTurnOn = undefined
        featureOps.onFeatureTurnOff = undefined
    })

    test('property definitions', () => {
        expect(opsUserFiles.featureName).toBeDefined()
        expect(opsUserFiles.featureCommands).toBeDefined()
        expect(opsUserFiles.specify).toBeDefined()
        expect(opsUserFiles.runCommand).toBeDefined()
        expect(opsUserFiles.onFeatureTurnOn).toBeDefined()
        expect(opsUserFiles.onFeatureTurnOff).toBeDefined()
        expect(opsUserFiles.build).toBeDefined()
        expect(opsUserFiles.preBackendUpdate).toBeDefined()
        expect(opsUserFiles.syncCurrentBackendInfo).toBeDefined()
        expect(opsUserFiles.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsUserFiles.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsUserFiles.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsUserFiles.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsUserFiles.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsUserFiles.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsUserFiles.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsUserFiles.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsUserFiles.runCommand('commandName')
    })

    test('build', () => {
        let callback = jest.fn()
        opsUserFiles.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsUserFiles.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsUserFiles.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })
})