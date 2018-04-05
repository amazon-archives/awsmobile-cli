const featureOpsMapping = require('../../../lib/utils/feature-ops-mapping.js')

describe('feature-ops-mapping', () => {
    test('feature-ops-mapping defined', () => {
        expect(featureOpsMapping['user-signin']).toBeDefined()
        expect(featureOpsMapping['user-files']).toBeDefined()
        expect(featureOpsMapping['cloud-api']).toBeDefined()
        expect(featureOpsMapping['database']).toBeDefined()
        expect(featureOpsMapping['analytics']).toBeDefined()
        expect(featureOpsMapping['hosting']).toBeDefined()
    })
})
