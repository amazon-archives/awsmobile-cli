const featureDirMapping = require('../../../lib/utils/feature-dir-mapping.js')

describe('feature-dir-mapping', () => {
    test('feature-dir-mapping defined', () => {
        expect(featureDirMapping['user-signin']).toBeDefined()
        expect(featureDirMapping['user-files']).toBeDefined()
        expect(featureDirMapping['cloud-api']).toBeDefined()
        expect(featureDirMapping['database']).toBeDefined()
        expect(featureDirMapping['analytics']).toBeDefined()
        expect(featureDirMapping['hosting']).toBeDefined()
    })
})
