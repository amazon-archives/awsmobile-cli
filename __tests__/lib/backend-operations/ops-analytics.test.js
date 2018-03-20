jest.mock('../../../lib/feature-operations/scripts/analytics-ops.js')

const featureOps = require('../../../lib/feature-operations/scripts/analytics-ops.js')

const opsAnalytics = require('../../../lib/backend-operations/ops-analytics.js')

describe('ops analytics', () => {
    const mock_projectInfo = {}
    const mock_backendProjectSpec = {}

    beforeAll(() => {
        global.console = {log: jest.fn()}
        featureOps.specify = jest.fn()
        featureOps.onFeatureTurnOn = jest.fn()
        featureOps.onFeatureTurnOff = jest.fn()
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
        expect(featureOps.specify).toBeCalled()
    })

    test('onFeatureTurnOn', () => {
        opsAnalytics.onFeatureTurnOn(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOn).toBeCalled()
    })

    test('onFeatureTurnOff', () => {
        opsAnalytics.onFeatureTurnOff(mock_projectInfo, mock_backendProjectSpec)
        expect(featureOps.onFeatureTurnOff).toBeCalled()
    })
})