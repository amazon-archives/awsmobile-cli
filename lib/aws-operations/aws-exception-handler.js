/* 
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
*/
"use strict";
const chalk = require('chalk')
const opn = require('opn')
const awsmobilejsConstant = require('../utils/awsmobilejs-constant.js')

function handleMobileException(err){
    if(err && err.code && err.code.length > 0){
        switch(err.code){
            case 'UnrecognizedClientException': 
                InvalidUserCredential(err)
            break
            case 'InvalidSignatureException': 
                InvalidSignature(err)
            break;
            case 'UnauthorizedException': 
                UnauthorizedException(err)
            break
            default: 
                Default(err)
            break
        }
    }else{
        Default(err)
    }
}

function handleS3Exception(err){
    if(err && err.code && err.code.length > 0){
        switch(err.code){
            case 'InvalidAccessKeyId': 
                InvalidUserCredential(err)
            break
            case 'SignatureDoesNotMatch': 
                InvalidSignature(err)
            break
            default: 
                Default(err)
            break
        }
    }else{
        Default(err)
    }
}

function InvalidUserCredential(err){
    console.log()
    console.log('the security token included in the request is invalid')
    console.log()
    console.log(err)
    console.log()
    console.log('Visit the following address to setup your aws account/user credentials:')
    console.log(chalk.green(awsmobilejsConstant.AWSCreateIAMUsersUrl))
    opn(awsmobilejsConstant.AWSCreateIAMUsersUrl, {wait: false})
    console.log()
    console.log(chalk.gray('# to set up the credentials for the awsmobile-cli'))
    console.log('    $ awsmobile configure aws')
    process.exit(4)
}

function InvalidSignature(err){
    console.log()
    console.log('Invalid Signature')
    console.log()
    console.log(err)
    console.log()
    console.log(chalk.gray('# to change the configuration for the awsmobile-cli'))
    console.log('    $ awsmobile configure aws')
    process.exit(3)
}

function UnauthorizedException(err){
    console.log()
    console.log(err)
    console.log()
    process.exit(2)
}

function Default(err){
    console.log(err)
    process.exit(1)
}

module.exports = {
    handleMobileException,
    handleS3Exception
}
  

