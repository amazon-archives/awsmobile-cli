const awsExceptionHandler = require('../../../lib/aws-operations/aws-exception-handler.js')

describe('project info manager functions', () => {

    const mock_err_MobileUnrecognizedClientException = {
        code: 'UnrecognizedClientException'
    }
    const mock_err_MobileInvalidUserCredential = {
        code: 'InvalidUserCredential'
    }
    const mock_err_MobileInvalidSignatureException = {
        code: 'InvalidSignatureException'
    }
    const mock_err_MobileUnauthorizedException = {
        code: 'UnauthorizedException'
    }

    const mock_err_S3InvalidAccessKeyId= {
        code: 'InvalidAccessKeyId'
    }
    const mock_err_S3SignatureDoesNotMatch = {
        code: 'SignatureDoesNotMatch'
    }

    const mock_err_Other = {
        code: 'Other'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()}
        process.exit = jest.fn()
    })

    beforeEach(() => {
        process.exit.mockClear()
    })

    test('Mobile UnrecognizedClientException', () => {
        awsExceptionHandler.handleMobileException(mock_err_MobileUnrecognizedClientException)
        expect(process.exit).toBeCalled()
    })

    test('Mobile InvalidUserCredential', () => {
        awsExceptionHandler.handleMobileException(mock_err_MobileInvalidUserCredential)
        expect(process.exit).toBeCalled()
    })

    test('Mobile InvalidSignatureException', () => {
        awsExceptionHandler.handleMobileException(mock_err_MobileInvalidSignatureException)
        expect(process.exit).toBeCalled()
    })

    test('Mobile UnauthorizedException', () => {
        awsExceptionHandler.handleMobileException(mock_err_MobileUnauthorizedException)
        expect(process.exit).toBeCalled()
    })

    test('Mobile Other', () => {
        awsExceptionHandler.handleMobileException(mock_err_Other)
        expect(process.exit).toBeCalled()
    })

    test('Mobile Undefined', () => {
        awsExceptionHandler.handleMobileException()
        expect(process.exit).toBeCalled()
    })

    test('S3 InvalidAccessKeyId', () => {
        awsExceptionHandler.handleS3Exception(mock_err_S3InvalidAccessKeyId)
        expect(process.exit).toBeCalled()
    })

    test('S3 SignatureDoesNotMatch', () => {
        awsExceptionHandler.handleS3Exception(mock_err_S3SignatureDoesNotMatch)
        expect(process.exit).toBeCalled()
    })

    test('S3 Other', () => {
        awsExceptionHandler.handleS3Exception(mock_err_Other)
        expect(process.exit).toBeCalled()
    })

    test('S3 Other', () => {
        awsExceptionHandler.handleS3Exception()
        expect(process.exit).toBeCalled()
    })
})