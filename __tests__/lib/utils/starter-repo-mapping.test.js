const starterRepoMapping = require('../../../lib/utils/starter-repo-mapping.js')

describe('feature-yaml-template-mapping', () => {
    test('feature-yaml-template-mapping defined', () => {
        expect(starterRepoMapping['react']).toBeDefined()
        expect(starterRepoMapping['react-native']).toBeDefined()
    })
})
