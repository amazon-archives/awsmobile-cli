const publishIgnore = require('../../../lib/utils/awsmobilejs-publish-ignore.js')

describe('awsmobilejs publish ignore', () => {
    test('ignore list defined', () => {
        expect(publishIgnore.DirectoryList).toBeDefined()
        expect(publishIgnore.FileList).toBeDefined()
    })
})
