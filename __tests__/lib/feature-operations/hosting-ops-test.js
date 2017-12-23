'use strict';

jest.mock('child_process');

const inquirer = require('inquirer');
const hostingOps = require('../../../lib/feature-operations/scripts/hosting-ops')
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

test('Enabling hosting originally disabled', () => {
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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Disable hosting originally enabled', () => {
    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Default (enable) hosting originally disabled', () => {
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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Default (enable) hosting originally enabled', () => {
    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Not enabling hosting originally disabled', () => {
    mhYamlLib.load = function (projectInfo, callback) {
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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is disabled, do you want to host your web app including a global CDN?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Enabling hosting originally enabled', () => {
    mhYamlLib.load = function (projectInfo) {
        return new Promise(function (resolve, reject) {
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
            resolve(yaml.safeLoad(data, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 }));
        });
    }

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

    let result = yaml.safeLoad(resultYaml, { schema: mhYamlLib.YML_SCHEMA, noCompatMode: true, scalarType: 5 });
    let logResult = ['Currently Hosting is enabled, do you want to keep it enabled?'];
    cleanConsoleLog();

    expect.assertions(2);
    return hostingOps.specify({})
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});