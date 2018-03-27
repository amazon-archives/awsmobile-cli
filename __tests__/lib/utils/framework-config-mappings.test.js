const frameworkConfigMapping = require('../../../lib/utils/framework-config-mapping.js')

describe('feature-yaml-template-mapping', () => {
    test('feature-yaml-template-mapping defined', () => {
        expect(frameworkConfigMapping['react']).toBeDefined()
        expect(frameworkConfigMapping['react-native']).toBeDefined()
        expect(frameworkConfigMapping['angular']).toBeDefined()
        expect(frameworkConfigMapping['ionic']).toBeDefined()
        expect(frameworkConfigMapping['vue']).toBeDefined()
        expect(frameworkConfigMapping['default']).toBeDefined()
    })
})
