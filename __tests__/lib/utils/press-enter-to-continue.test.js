const pressKeyToContinue = require('../../../lib/utils/press-enter-to-continue.js')

describe('press-enter-to-continue', () => {
    test('run', () => {
        let mockData = 'mock-data'
        let handle = {}
        pressKeyToContinue.run(handle).then((handle)=>{
            expect(handle.data).toBeDefined()
            expect(handle.data).toEqual(mockData)
        })
        process.stdin.emit('data', mockData)
    })
})
