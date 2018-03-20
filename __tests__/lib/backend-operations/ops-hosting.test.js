jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/hosting-ops.js')

const opsHosting = require('../../../lib/backend-operations/ops-hosting.js')

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
        expect(opsHosting.featureName).toBeDefined()
        expect(opsHosting.featureCommands).toBeDefined()
        expect(opsHosting.specify).toBeDefined()
        expect(opsHosting.runCommand).toBeDefined()
        expect(opsHosting.onFeatureTurnOn).toBeDefined()
        expect(opsHosting.onFeatureTurnOff).toBeDefined()
        expect(opsHosting.build).toBeDefined()
        expect(opsHosting.preBackendUpdate).toBeDefined()
        expect(opsHosting.syncCurrentBackendInfo).toBeDefined()
        expect(opsHosting.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsHosting.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsHosting.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsHosting.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsHosting.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsHosting.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsHosting.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsHosting.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsHosting.runCommand('commandName')
    })

    test('build', () => {
        let callback = jest.fn()
        opsHosting.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsHosting.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsHosting.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })
})