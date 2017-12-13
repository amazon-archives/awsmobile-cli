"use strict";

// const Amplify = require('../../../../aws-amplify').default;
const Amplify = require('aws-amplify').default
const pathLib = require('path');
const fs = require('fs-extra');
const chalk = require('chalk')

var _tempExportJSFilePath = '';

function invoke(projectInfo, args) {
    let awsExportJSFilePath = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/#current-backend-info/aws-exports.js');
    if (fs.existsSync(awsExportJSFilePath)) {
        let exportsData = fs.readFileSync(awsExportJSFilePath, 'utf8');
        // Ugly temporary solution for converting file to CommonJS. 
        exportsData = exportsData.replace(/export\sdefault\sawsmobile/g, "module.exports = awsmobile");
        _tempExportJSFilePath = pathLib.join(__dirname, projectInfo.ProjectName + "-aws-exports.js");
        fs.writeFileSync(_tempExportJSFilePath, exportsData, 'utf8');
        executeInvoke(args);
    } else {
        console.log(chalk.red('missing backend awsmobile project access information'))
        console.log('can not find file: ' + awsExportJSFilePath)
    }
}

function quit() {
    fs.removeSync(_tempExportJSFilePath)
    process.exit(1);
}

function executeInvoke(args) {
    
    const awsmobile = require(_tempExportJSFilePath);

    let endpoints = awsmobile.aws_cloud_logic_custom;

    if (!endpoints) {
        console.log('Feature not available. Did you call awsmobile push ?');
        quit();
    }
    Amplify.Logger.LOG_LEVEL = 'ERROR';
    Amplify.configure(awsmobile);
    let method = '';
    let apiName = '';
    let path = '';
    let init = null;

    if (args.length < 6) {
        console.log('Not enough arguments, usage:\nawsmobile cloud-api invoke <apiname> <method> <path> [init]');
        quit();
    }

    apiName = args[4];
    
    const endpoint = Amplify.API.endpoint(apiName);

    if (endpoint.length === 0) {
        console.log('Api', apiName, 'does not exists. Api\'s available:')
        try {
            endpoints = JSON.parse(endpoints);
            endpoints.forEach((v) => {
                consolelog(v.name);
            });
        } catch (err) {
        }
        quit();
    }

    method = args[5].toLowerCase();

    switch (method) {
        case 'get':
        case 'put':
        case 'del':
        case 'post':
        case 'head':
            break;
        default:
            console.log('valid method names are get, put, del, post, head');
            quit();
    }

    if (args.length > 6) {
        path = args[6];
    }

    if (args.length > 7) {
        try {
            init = JSON.parse(args[7]);
        } catch(err) {
            console.log('init not valid JSON format');
            quit();
        }
    }

    Amplify.API[method](apiName, path, init).then((data) => {
        console.log(data)
        quit();
    }).catch(err => {
        console.log('Invoke failed')
        console.log(err);        
        quit();
    });

}


exports.invoke = function(projectInfo, args) {
    invoke(projectInfo, args);
}
