const featureProjectOpsMapping = require('../../../lib/utils/feature-project-ops-mapping.js')

describe('feature-project-ops-mapping', () => {
    test('feature-project-ops-mapping defined', () => {
        expect(featureProjectOpsMapping['user-signin']).toBeDefined()
        expect(featureProjectOpsMapping['user-files']).toBeDefined()
        expect(featureProjectOpsMapping['cloud-api']).toBeDefined()
        expect(featureProjectOpsMapping['database']).toBeDefined()
        expect(featureProjectOpsMapping['analytics']).toBeDefined()
        expect(featureProjectOpsMapping['hosting']).toBeDefined()
    })
})
