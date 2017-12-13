const ora = jest.fn((message)=>{
    return {
        start: jest.fn(),
        stop: jest.fn()
    }
})

module.exports = ora