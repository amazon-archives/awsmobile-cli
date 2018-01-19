'use strict';

jest.mock('fs-extra')

const fs = require('fs-extra')
const inquirer = require('inquirer');
const cloudApiOps = require('../../../lib/feature-operations/scripts/cloud-api-ops')
const databaseOps = require('../../../lib/feature-operations/scripts/database-ops')

const yamlSchema = require('../../../lib/aws-operations/mobile-yaml-schema');
const yaml = require('js-yaml');
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

const functionGeneration = require('../../../lib/feature-operations/scripts/lib/function-generation');

const projectPath = '/projectName';
const projectName = 'projectName'
const backendYmlFilePath = pathManager.getBackendSpecProjectYmlFilePath(projectPath)
const mock_projectInfo = {
    "ProjectName": projectName,
    "ProjectPath": projectPath,
    "SourceDir": "src",
    "DistributionDir": "dist",
    "BuildCommand": "npm run-script build",
    "StartCommand": "npm run-script start",
}

const projectInfo = {};

var consoleLogRegistry = [];

const addConsoleLog = function (message) {
    consoleLogRegistry.push(message);
}

const cleanConsoleLog = function () {
    consoleLogRegistry = [];
}
const mockirer = function (inquirer, answers) {
    var answersTypeOf = typeof answers;

    if (answersTypeOf !== 'object') {
        throw new Error('[mockirer] - The answers should be a object, ${answersTypeOf} given.');
    }

    if (typeof inquirer === 'undefined') {
        throw new Error('[mockirer] - Must pass inquirer as dependency injection.');
    }

    inquirer.prompt = function (prompts) {
        [].concat(prompts).forEach(prompt => {

            addConsoleLog(prompt.message);
            if (prompt.choices) {
                [].concat(prompt.choices).forEach(choice => {
                    if (choice.name) {
                        addConsoleLog(choice.name);
                    } else {
                        addConsoleLog(choice);
                    }
                });
            }
            var hasAwnserForQuestion = (prompt.name in answers);
            var hasDefaultAwnser = (typeof prompt.default !== 'undefined');

            if (!hasAwnserForQuestion && hasDefaultAwnser) {
                answers[prompt.name] = prompt.default;
            };
        });

        return {
            then: (callback) => {
                return Promise.resolve(callback(answers));
            },
            catch: (callback) => {
                return Promise.reject(callback());
            }
        };
    };
};

function mockLog() {
    [...arguments].forEach(arg => addConsoleLog(arg));
}
console.log = mockLog;

functionGeneration.createLambdaFunctionFolder = function (functionFolder) {
    console.log('...');
}

functionGeneration.createLambdaFunctionCrudApi = function (lambdaDynamoPackageFolder, functionFolder, cloudLogicDefinition, path, table_name, hasUserId) {
    console.log('...');
    var hashKeyName = cloudLogicDefinition.projectDefinition.nosql.tables[table_name].hashKeyName;
    var hashKeyType = databaseOps.getTypeCode(cloudLogicDefinition.projectDefinition.nosql.tables[table_name].hashKeyType);
    var sortKeyName = cloudLogicDefinition.projectDefinition.nosql.tables[table_name].sortKeyName;
    var sortKeyType = databaseOps.getTypeCode(cloudLogicDefinition.projectDefinition.nosql.tables[table_name].sortKeyType);

    var pathParams = '/' + table_name;

    var objectPath = '/' + table_name + '/object';
    var listObjectsPath = '/' + table_name;
    if (!hasUserId) {
        objectPath += '/:' + hashKeyName;
        listObjectsPath += '/:' + hashKeyName;
    }

    const hasDynamicPrefix = cloudLogicDefinition.projectDefinition.nosql.tables[table_name].hasDynamicPrefix;

    var jsonPut = {};
    Object.keys(cloudLogicDefinition.projectDefinition.nosql.tables[table_name].attributes).map(attrKey => {
        jsonPut[attrKey] = {}
        const attrType = databaseOps.getTypeCode(cloudLogicDefinition.projectDefinition.nosql.tables[table_name].attributes[attrKey]);
        jsonPut[attrKey] = "INSERT VALUE HERE";
    })

    if (hasUserId) {
        delete jsonPut[hashKeyName];
    }

    console.log('Path to be used on API for get and remove an object should be like:\n' + objectPath + '\n');
    console.log('Path to be used on API for list objects on get method should be like:\n' + listObjectsPath + '\n');
    console.log('JSON to be used as data on put request should be like:\n' + JSON.stringify(jsonPut, null, 2));
}

test('Creating cloud api, unrestricted (signin disabled)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'add',
        apiName: 'sampleCloudApi',
        pathName: '/items',
        functionName: 'sampleLambda',
        addAnothePath: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Welcome to CloudLogic wizard", "You will be asked a series of questions to create your API", "API name", "HTTP path name", "Lambda function name (This will be created if it does not already exists)", "Add another HTTP path", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Creating cloud api, unrestricted (signin enabled)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'add',
        apiName: 'sampleCloudApi',
        pathName: '/items',
        functionName: 'sampleLambda',
        requiredSignin: false,
        addAnothePath: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Welcome to CloudLogic wizard", "You will be asked a series of questions to create your API", "API name", "Restrict API access to signed-in users", "HTTP path name", "Lambda function name (This will be created if it does not already exists)", "Add another HTTP path", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Creating cloud api, restricted (signin enabled)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'add',
        apiName: 'sampleCloudApi',
        pathName: '/items',
        functionName: 'sampleLambda',
        requiredSignin: true,
        addAnothePath: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Welcome to CloudLogic wizard", "You will be asked a series of questions to create your API", "API name", "Restrict API access to signed-in users", "HTTP path name", "Lambda function name (This will be created if it does not already exists)", "Add another HTTP path", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Deleting cloud api, with more than one api', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "      sampleCloudApi2: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'del',
        apiKey: 'sampleCloudApi2',
        confirmDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Remove an API from the project", "Edit an API from the project", "Select API to be deleted", "sampleCloudApi", "sampleCloudApi2", "Are you sure you want to delete the API"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {

            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Deleting cloud api, only one api left', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'del',
        apiKey: 'sampleCloudApi',
        confirmDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Remove an API from the project", "Edit an API from the project", "Select API to be deleted", "sampleCloudApi", "Are you sure you want to delete the API"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {

            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Edit cloud api, set api restricted for signin users', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'edit',
        apiKeyEdit: 'sampleCloudApi',
        editOptions: 'signed-in',
        requiredSignin: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Remove an API from the project", "Edit an API from the project", "Select API to be edited", "sampleCloudApi", "Select from one of the choices below.", "Add path", "Remove path", "Configure API access to signed-in users", "Restrict API access to signed-in users", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Edit cloud api, set api unrestricted for signin users', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: true" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'edit',
        apiKeyEdit: 'sampleCloudApi',
        editOptions: 'signed-in',
        requiredSignin: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Remove an API from the project", "Edit an API from the project", "Select API to be edited", "sampleCloudApi", "Select from one of the choices below.", "Add path", "Remove path", "Configure API access to signed-in users", "Restrict API access to signed-in users", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Edit cloud api, add path', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'edit',
        apiKeyEdit: 'sampleCloudApi',
        editOptions: 'add-path',
        pathName: '/items2',
        functionName: 'sampleLambda',
        requiredSignin: true,
        addAnothePath: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /items: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          /items2: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/items2/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: sampleLambda" + "\n" +
        "            codeFilename: uploads/sampleLambda.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Remove an API from the project", "Edit an API from the project", "Select API to be edited", "sampleCloudApi", "Select from one of the choices below.", "Add path", "Remove path", "Configure API access to signed-in users", "HTTP path name", "Lambda function name (This will be created if it does not already exists)", "Add another HTTP path", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/sampleLambda/", "...", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "sampleCloudApi", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Creating crud api for dynamo table, unrestricted (signin enabled)', () => {
    // Setting yaml
        let data =
            "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
            "features:" + "\n" +
            "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
            "    components:" + "\n" +
            "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
            "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
            "    attributes:" + "\n" +
            "      enabled: true" + "\n" +
            "      optional-sign-in: true" + "\n" +
            "    components:" + "\n" +
            "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          provider-id: abcdef" + "\n" +
            "          provider-name: facebook" + "\n" +
            "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
            "    components: " + "\n" +
            "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
            "        tables: " + "\n" +
            "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
            "            attributes: " + "\n" +
            "              teamName: S" + "\n" +
            "            hashKeyName: teamId" + "\n" +
            "            hashKeyType: S" + "\n" +
            "            rangeKeyName: ''" + "\n" +
            "            rangeKeyType: ''" + "\n" +
            "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
            "            tablePrivacy: public" + "\n" +
            "name: '-2017-09-11-10-33-25'" + "\n" +
            "region: us-east-1" + "\n" +
            "uploads: []" + "\n" +
            "sharedComponents: {}" + "\n";
        
            var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        apiOptions: 'dynamo',
        dynamoKey: 'AWSMobileTable',
        requiredSignin: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      optional-sign-in: true" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef" + "\n" +
        "          provider-name: facebook" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: " + "\n" +
        "              teamName: S" + "\n" +
        "            hashKeyName: teamId" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components: " + "\n" +
        "      AWSMobileTableCRUD: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: AWSMobileTableCRUD" + "\n" +
        "          requires-signin: false" + "\n" +
        "        paths: " + "\n" +
        "          /AWSMobileTable: !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: AWSMobileTable" + "\n" +
        "            codeFilename: uploads/AWSMobileTable.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "          '/AWSMobileTable/{proxy+}': !com.amazonaws.mobilehub.v0.Function " + "\n" +
        "            name: AWSMobileTable" + "\n" +
        "            codeFilename: uploads/AWSMobileTable.zip" + "\n" +
        "            handler: lambda.handler" + "\n" +
        "            enableCORS: true" + "\n" +
        "            runtime: nodejs6.10" + "\n" +
        "            environment: {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\n\nThis feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table.\n\n", "Select from one of the choices below.", "Create a new API", "Create CRUD API for an existing Amazon DynamoDB table", "Select Amazon DynamoDB table to connect to a CRUD API", "AWSMobileTable", "Restrict API access to signed-in users", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/AWSMobileTable/", "...", "Path to be used on API for get and remove an object should be like:\n/AWSMobileTable/object/:teamId\n", "Path to be used on API for list objects on get method should be like:\n/AWSMobileTable/:teamId\n", "JSON to be used as data on put request should be like:\n{\n  \"teamName\": \"INSERT VALUE HERE\",\n  \"teamId\": \"INSERT VALUE HERE\"\n}", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "AWSMobileTableCRUD", "<method> <path> [init]", "Adding lambda function code on: \n/projectName/awsmobilejs/backend/cloud-api/AWSMobileTable/", "...", "Path to be used on API for get and remove an object should be like:\n/AWSMobileTable/object/:teamId\n", "Path to be used on API for list objects on get method should be like:\n/AWSMobileTable/:teamId\n", "JSON to be used as data on put request should be like:\n{\n  \"teamName\": \"INSERT VALUE HERE\",\n  \"teamId\": \"INSERT VALUE HERE\"\n}", "To test the api from the command line (after awsmobile push) use this commands", "awsmobile cloud-api invoke", "AWSMobileTableCRUD", "<method> <path> [init]"];
    cleanConsoleLog();

    expect.assertions(2);
    return cloudApiOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});