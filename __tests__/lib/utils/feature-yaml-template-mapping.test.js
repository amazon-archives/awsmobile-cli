const featureYamlTemplateMapping = require('../../../lib/utils/feature-yaml-template-mapping.js')

describe('feature-yaml-template-mapping', () => {
    test('feature-yaml-template-mapping defined', () => {
        expect(featureYamlTemplateMapping['user-signin']).toBeDefined()
        expect(featureYamlTemplateMapping['user-files']).toBeDefined()
        expect(featureYamlTemplateMapping['cloud-api']).toBeDefined()
        expect(featureYamlTemplateMapping['database']).toBeDefined()
        expect(featureYamlTemplateMapping['analytics']).toBeDefined()
        expect(featureYamlTemplateMapping['hosting']).toBeDefined()
    })
})
