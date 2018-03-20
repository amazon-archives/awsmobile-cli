jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/user-signin-ops.js')

const opsUserSignin = require('../../../lib/backend-operations/ops-user-signin.js')

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
        expect(opsUserSignin.featureName).toBeDefined()
        expect(opsUserSignin.featureCommands).toBeDefined()
        expect(opsUserSignin.specify).toBeDefined()
        expect(opsUserSignin.runCommand).toBeDefined()
        expect(opsUserSignin.onFeatureTurnOn).toBeDefined()
        expect(opsUserSignin.onFeatureTurnOff).toBeDefined()
        expect(opsUserSignin.build).toBeDefined()
        expect(opsUserSignin.preBackendUpdate).toBeDefined()
        expect(opsUserSignin.syncCurrentBackendInfo).toBeDefined()
        expect(opsUserSignin.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsUserSignin.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsUserSignin.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsUserSignin.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsUserSignin.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsUserSignin.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsUserSignin.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsUserSignin.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsUserSignin.runCommand('commandName')
    })

    test('build', () => {
        let callback = jest.fn()
        opsUserSignin.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsUserSignin.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsUserSignin.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })
})