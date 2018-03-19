const objectOps = require('../../../lib/utils/object-ops.js')

describe('object ops', () => {
    test('sortByPropertyKey', () => {
        const testObject = {
            'key4': 'value4',
            'key6': 'value6',
            'key9': 'value9',
            'key1': 'value1',
            'key2': 'value2',
            'key3': 'value3',
            'key7': 'value7',
            'key5': 'value5',
            'key8': 'value8'
        }
        let sortedObj = objectOps.sortByPropertyKey(testObject)

        let sortedKeys = Object.keys(testObject).sort()

        expect(sortedObj).toBeDefined()
        for(let i = 0; i<sortedKeys.length; i++){
            let keyInSortedObj = 
            expect(Object.keys(sortedObj)[i]).toEqual(sortedKeys[i])
            sortedObj[keyInSortedObj] = testObject[keyInSortedObj]
        }
    })
})
