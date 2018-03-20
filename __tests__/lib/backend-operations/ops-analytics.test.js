jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/analytics-ops.js')

const opsAnalytics = require('../../../lib/backend-operations/ops-analytics.js')

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
        expect(opsAnalytics.featureName).toBeDefined()
        expect(opsAnalytics.featureCommands).toBeDefined()
        expect(opsAnalytics.specify).toBeDefined()
        expect(opsAnalytics.runCommand).toBeDefined()
        expect(opsAnalytics.onFeatureTurnOn).toBeDefined()
        expect(opsAnalytics.onFeatureTurnOff).toBeDefined()
        expect(opsAnalytics.build).toBeDefined()
        expect(opsAnalytics.preBackendUpdate).toBeDefined()
        expect(opsAnalytics.syncCurrentBackendInfo).toBeDefined()
        expect(opsAnalytics.syncToDevBackend).toBeDefined()
    })

    test('specify', () => {
        opsAnalytics.specify(mock_projectInfo)
        featureOps.specify = jest.fn()
        opsAnalytics.specify(mock_projectInfo)
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsAnalytics.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOn = jest.fn()
        opsAnalytics.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsAnalytics.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        featureOps.onFeatureTurnOff = jest.fn()
        opsAnalytics.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })

    test('hasCommand', () => {
        opsAnalytics.hasCommand('commandName')
    })

    test('runCommand', () => {
        opsAnalytics.runCommand('commandName')
    })

    test('build', () => {
        let callback = jest.fn()
        opsAnalytics.build(mock_projectInfo, mock_backendProjectSpec, callback)
        expect(callback).toBeCalled()
    })

    test('preBackendUpdate', () => {
        let callback = jest.fn()
        opsAnalytics.preBackendUpdate(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })

    test('syncCurrentBackendInfo', () => {
        let callback = jest.fn()
        opsAnalytics.syncCurrentBackendInfo(mock_projectInfo, mock_backendProjectSpec, mock_awsDetails, callback)
        expect(callback).toBeCalled()
    })
})