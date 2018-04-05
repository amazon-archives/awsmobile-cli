'use strict';

jest.mock('fs-extra')

const fs = require('fs-extra')
const inquirer = require('inquirer');
const hostingOps = require('../../../lib/feature-operations/scripts/hosting-ops')
const yamlOps = require('../../../lib/aws-operations/mobile-yaml-ops');
const yamlSchema = require('../../../lib/aws-operations/mobile-yaml-schema');
const yaml = require('js-yaml');
const pathManager = require('../../../lib/utils/awsmobilejs-path-manager.js')

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
        [].concat(prompts).forEach(function (prompt) {
            addConsoleLog(prompt.message);
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

test('Enabling hosting originally disabled', () => {
    // Setting yaml
    var data =
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
        enable: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Disable hosting originally enabled', () => {
    // Setting yaml
    var data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer disable
    mockirer(inquirer, {
        enable: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Default (enable) hosting originally disabled', () => {
    // Setting yaml
    var data =
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

    // Default answer
    mockirer(inquirer, {

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Default (enable) hosting originally enabled', () => {
    // Setting yaml
    var data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // Default answer
    mockirer(inquirer, {

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Not enabling hosting originally disabled', () => {
    // Setting yaml
    var data =
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

    // answer disable
    mockirer(inquirer, {
        enable: false
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Enabling hosting originally enabled', () => {
    // Setting yaml
    var data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO[backendYmlFilePath] = data;
    fs.__setMockFiles(MOCK_FILE_INFO)

    // answer enable
    mockirer(inquirer, {
        enable: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  content-delivery: !com.amazonaws.mobilehub.v0.ContentDelivery" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      visibility: public-global" + "\n" +
        "    components:" + "\n" +
        "      release: !com.amazonaws.mobilehub.v0.Bucket {}" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});