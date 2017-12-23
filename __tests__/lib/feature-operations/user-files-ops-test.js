'use strict';

jest.mock('child_process');

const inquirer = require('inquirer');
const user_data_ops = require('../../../lib/feature-operations/scripts/user-files-ops')
var mhYamlLib = require('../../../lib/feature-operations/scripts/lib/mh-yaml-lib.js');
var yaml = require('js-yaml');

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

mhYamlLib.save = function (projectInfo, yaml, callback) { }

test('Enabling user-files originally disabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

    // answer enable
    mockirer(inquirer, {
        enableUserData: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      wildcard-cors-policy: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['This feature is for storing user files in the cloud, would you like to enable it?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Disabling user-files originally enabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
        var data =
            "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
            "features:" + "\n" +
            "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
            "    components:" + "\n" +
            "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
            "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
            "    attributes:" + "\n" +
            "      enabled: true" + "\n" +
            "      wildcard-cors-policy: true" + "\n" +
            "name: '-2017-09-11-10-33-25'" + "\n" +
            "region: us-east-1" + "\n" +
            "uploads: []" + "\n" +
            "sharedComponents: {}" + "\n";
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

    mockirer(inquirer, {
        enableUserData: false
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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['User files storage is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Setting user-files default (enabled) from disabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

    // answer default
    mockirer(inquirer, {

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      wildcard-cors-policy: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['This feature is for storing user files in the cloud, would you like to enable it?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Setting user-files default (enabled) from enabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
        var data =
            "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
            "features:" + "\n" +
            "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
            "    components:" + "\n" +
            "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
            "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
            "    attributes:" + "\n" +
            "      enabled: true" + "\n" +
            "      wildcard-cors-policy: true" + "\n" +
            "name: '-2017-09-11-10-33-25'" + "\n" +
            "region: us-east-1" + "\n" +
            "uploads: []" + "\n" +
            "sharedComponents: {}" + "\n";
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

    // answer default
    mockirer(inquirer, {

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      wildcard-cors-policy: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['User files storage is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Disabling user-files originally disabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

    // answer disable
    mockirer(inquirer, {
        enableUserData: false
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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['This feature is for storing user files in the cloud, would you like to enable it?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Enabling user-files originally enabled', () => {

    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
        var data =
            "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
            "features:" + "\n" +
            "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
            "    components:" + "\n" +
            "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
            "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
            "    attributes:" + "\n" +
            "      enabled: true" + "\n" +
            "      wildcard-cors-policy: true" + "\n" +
            "name: '-2017-09-11-10-33-25'" + "\n" +
            "region: us-east-1" + "\n" +
            "uploads: []" + "\n" +
            "sharedComponents: {}" + "\n";
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }
    // answer enabling
    mockirer(inquirer, {
        enableUserData: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
        "    attributes:" + "\n" +
        "      enabled: true" + "\n" +
        "      wildcard-cors-policy: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['User files storage is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return user_data_ops.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});
