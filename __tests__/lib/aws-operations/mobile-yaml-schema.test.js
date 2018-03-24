const yamlSchema = require('../../../lib/aws-operations/mobile-yaml-schema.js')

describe('mobile-yaml-ops', () => {
    test('schema defined', () => {
        expect(yamlSchema.AWS_MOBILE_YAML_SCHEMA).toBeDefined()
    })
})
