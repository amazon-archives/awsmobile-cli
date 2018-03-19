const starterConfigMapping = require('../../../lib/utils/starter-config-mapping.js')

describe('feature-yaml-template-mapping', () => {
    test('feature-yaml-template-mapping defined', () => {
        expect(starterConfigMapping['react']).toBeDefined()
        expect(starterConfigMapping['react-native']).toBeDefined()
        expect(starterConfigMapping['ionic']).toBeDefined()
        expect(starterConfigMapping['vue']).toBeDefined()
    })
})
