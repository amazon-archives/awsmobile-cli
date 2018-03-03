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
const inquirer = require('inquirer')

//if initInfo.strategy is not set, the setup-backend step will not carry out any functions
const strategy = [
    'create', //use the default yaml to create a mobile project as the backend
    'import', //if a valid backend spec is already in the project, create a mobile project based on it as the backend
    'link', //if a mobile project id is in the command arguments, link to it as the backend
    'conform' //if there is an update in the cli, run init on a valid awsmobilejs project setup by the cli of previous version
]

function run(initInfo){
    let result = initInfo

    if(initInfo.mobileProjectID){
        initInfo.strategy = 'link'
    }else{
        initInfo.strategy = 'create'
    }

    switch(initInfo.initialStage){
        case 'clean-slate':
            //nothing extra
        break
        case 'invalid': 
            //nothing extra
        break
        case 'backend-valid':
            result = chooseForBackendValid(initInfo)
        break
        case 'project-info-valid':
            result = chooseForProjectInfoValid(initInfo)
        break
        case 'valid': 
            result = chooseForValid(initInfo).then((initInfo)=>{
                if(!initInfo.strategy){
                    prepConform(initInfo)
                }
                return initInfo
            })
        break
    }

    return result
}

function chooseForBackendValid(initInfo){
    let result = initInfo

    if(initInfo.mobileProjectID){
        initInfo.strategy = 'link'
    }else{ //if no mobile project id, will import.
        console.log('A valid backend specification is detected in this project')
        result = chooseImportOrCreate(initInfo)
    }

    return result
}

function chooseForProjectInfoValid(initInfo){
    let result = initInfo
    initInfo.strategy = undefined

    console.log('this project\'s backend is currently set to be ' + chalk.blue(initInfo.projectInfo.BackendProjectName))
    console.log('with mobile project id = ' + chalk.blue(initInfo.projectInfo.BackendProjectID))
    console.log('and was initialized at ' + chalk.blue(initInfo.projectInfo.InitializationTime))

    if(initInfo.mobileProjectID){
        if(initInfo.mobileProjectID != initInfo.projectInfo.BackendProjectID){
            result = confirmToSwitchBackend(initInfo).then((initInfo)=>{
                if(!initInfo.strategy){ //user declined to switch backend
                    return confirmToReEstablishBackend(initInfo)
                }else{
                    return initInfo
                }
            })
        }else{
            prepReEstablish(initInfo)
        }
    }else{
        result = chooseReEstablishOrCreate(initInfo)
    }

    return result
}

function chooseForValid(initInfo){
    let result = initInfo
    initInfo.strategy = undefined

    console.log('this project\'s current backend is ' + chalk.blue(initInfo.projectInfo.BackendProjectName))
    console.log('with mobile project id = ' + chalk.blue(initInfo.projectInfo.BackendProjectID))
    console.log('and was initialized at ' + chalk.blue(initInfo.projectInfo.InitializationTime))

    if(initInfo.mobileProjectID){
        if(initInfo.mobileProjectID != initInfo.projectInfo.BackendProjectID){
            result = confirmToSwitchBackend(initInfo)
        }else{
            console.log('you have specified the same id: ' + chalk.blue(initInfo.projectInfo.BackendProjectID))
            console.log('init is aborted')
            console.log(chalk.gray('# to retrieve the latest details of the backend awsmobile project'))
            console.log('    $ awsmobile pull')
        }
    }else{
        result = confirmToCreateNewBackend(initInfo)
    }

    return result
}

function confirmToCreateNewBackend(initInfo){
    initInfo.strategy = undefined

    let question = {
        type: 'confirm',
        name: 'confirmCreateNew',
        message: 'create a new awsmobile project as the backend',
        default: false
    }

    if(initInfo.yesFlag){
        return initInfo
    }else{
        return inquirer.prompt(question).then(function (answers) {
            if(answers.confirmCreateNew){
                prepCreateNew(initInfo)
            }
            return initInfo
        })
    }
}

function confirmToReEstablishBackend(initInfo){
    initInfo.strategy = undefined

    let message = 're-establish association with the original backend awsmobile project'
    let question = {
        type: 'confirm',
        name: 'confirmReEstablish',
        message: message,
        default: true
    }

    if(initInfo.yesFlag){
        console.log(message)
        prepReEstablish(initInfo)
        return initInfo
    }else{
        return inquirer.prompt(question).then(function (answers) {
            if(answers.confirmReEstablish){
                prepReEstablish(initInfo)
            }
            return initInfo
        })
    }
}

function confirmToSwitchBackend(initInfo){
    initInfo.strategy = undefined
    
    let message = 'switch backend to awsmobile project with id = ' + initInfo.mobileProjectID
    let question = {
        type: 'confirm',
        name: 'confirmSwitch',
        message: message,
        default: false
    }

    if(initInfo.yesFlag){
        return initInfo
    }else{
        return inquirer.prompt(question).then(function (answers) {
            if(answers.confirmSwitch){
                prepSwitch(initInfo)
            }
            return initInfo
        })
    }
}

function chooseReEstablishOrCreate(initInfo){
    initInfo.strategy = undefined

    let question = {
        type: 'list',
        name: 'ReEstablishOrNew',
        message: 'create a new backend or re-establish association with the original backend',
        choices: [
            {
              name: 're-establish association',
              value: 'reestablish'
            },
            {
              name: 'create a new backend',
              value: 'create'
            }
          ]
        }

    if(initInfo.yesFlag){
        console.log('re-establish association with the original backend')
        prepReEstablish(initInfo)
        return initInfo
    }else{
        return inquirer.prompt(question).then(function (answers) {
            switch (answers.ReEstablishOrNew) {
                case 'reestablish': 
                    prepReEstablish(initInfo)
                break
                case 'create': 
                    prepCreateNew(initInfo)
                break
            }
            return initInfo
        })
    }
}

function chooseImportOrCreate(initInfo){
    initInfo.strategy = undefined

    let question = {
        type: 'list',
        name: 'ImportOrNew',
        message: 'create the new backend with default features or specified features',
        choices: [
            {
              name: 'specified features',
              value: 'import'
            },
            {
              name: 'default features',
              value: 'create'
            }
          ]
        }

    if(initInfo.yesFlag){
        console.log('create the new backend with the specified features')
        prepImport(initInfo)
        return initInfo
    }else{
        return inquirer.prompt(question).then(function (answers) {
            switch (answers.ImportOrNew) {
                case 'import': 
                    prepImport(initInfo)
                break
                case 'create': 
                    prepCreateNew(initInfo)
                break
              }
            return initInfo
        })
    }
}

function prepCreateNew(initInfo){
    // console.log('init will now try to create a new backend awsmobile project')
    initInfo.strategy = 'create'
}

function prepSwitch(initInfo){
    console.log('init will now try to switch to the newly specified backend')
    initInfo.strategy = 'link'
}

function prepReEstablish(initInfo){
    console.log('init will now try to re-establish the association with the backend awsmobile project')
    initInfo.strategy = 'link'
    initInfo.mobileProjectID = initInfo.projectInfo.BackendProjectID
}

function prepImport(initInfo){
    initInfo.strategy = 'import'
}

function prepConform(initInfo){
    initInfo.yesFlag = true
    initInfo.mobileProjectID = initInfo.projectInfo.BackendProjectID
    initInfo.strategy = 'conform'
}

module.exports = {
    run
}
