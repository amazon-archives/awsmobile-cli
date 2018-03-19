const featureYamlNameMapping = require('../../../lib/utils/feature-yaml-name-mapping.js')

describe('feature-yaml-name-mapping', () => {
    test('feature-yaml-name-mapping defined', () => {
        expect(featureYamlNameMapping['user-signin']).toBeDefined()
        expect(featureYamlNameMapping['user-files']).toBeDefined()
        expect(featureYamlNameMapping['cloud-api']).toBeDefined()
        expect(featureYamlNameMapping['database']).toBeDefined()
        expect(featureYamlNameMapping['analytics']).toBeDefined()
        expect(featureYamlNameMapping['hosting']).toBeDefined()
    })
})
