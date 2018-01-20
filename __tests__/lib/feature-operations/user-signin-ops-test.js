'use strict';

jest.mock('fs-extra')

const fs = require('fs-extra')

const inquirer = require('inquirer');
const userSignInOps = require('../../../lib/feature-operations/scripts/user-signin-ops')
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
        [].concat(prompts).forEach(prompt => {

            addConsoleLog(prompt.message);
            if (prompt.choices) {
                [].concat(prompt.choices).forEach(choice => {
                    addConsoleLog(choice.name);
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

test('Enabling default cognito', () => {
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
        mainOptions: 'enable'
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
        "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          alias-attributes:" + "\n" +
        "            - email" + "\n" +
        "            - phone_number" + "\n" +
        "          mfa-configuration: ON" + "\n" +
        "          name: userpool" + "\n" +
        "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
        "            min-length: 8" + "\n" +
        "            require-lower-case: true" + "\n" +
        "            require-numbers: true" + "\n" +
        "            require-symbols: true" + "\n" +
        "            require-upper-case: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Sign-in is currently disabled, what do you want to do next", "Enable sign-in with default settings", "Go to advance settings"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Enabling advance cognito settings', () => {
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
        mainOptions: 'advance',
        selectSignInOptions: 'cognito',
        selectionUserLogin: ['email', 'phone_number'],
        optionsMfa: 'ON',
        password_length: '8',
        selectionPassword: ['require-upper-case', 'require-lower-case', 'require-numbers', 'require-symbols']
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
        "      optional-sign-in: false" + "\n" +
        "    components:" + "\n" +
        "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          alias-attributes:" + "\n" +
        "            - email" + "\n" +
        "            - phone_number" + "\n" +
        "          mfa-configuration: ON" + "\n" +
        "          name: userpool" + "\n" +
        "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
        "            min-length: 8" + "\n" +
        "            require-lower-case: true" + "\n" +
        "            require-numbers: true" + "\n" +
        "            require-symbols: true" + "\n" +
        "            require-upper-case: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Sign-in is currently disabled, what do you want to do next", "Enable sign-in with default settings", "Go to advance settings", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently disabled)", "How are users going to login", "Email", "Username", "Phone number (required for multifactor authentication)", "MFA authentication", "disabled", "optional", "required", "Password minimum length (number of characters)", "Password character requirements", "uppercase", "lowercase", "numbers", "special characters"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Enabling facebook', () => {
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
        mainOptions: 'advance',
        selectSignInOptions: 'facebook',
        facebookAppId: 'abcdef1234'
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
        "      optional-sign-in: false" + "\n" +
        "    components:" + "\n" +
        "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          provider-id: abcdef1234" + "\n" +
        "          provider-name: facebook" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Sign-in is currently disabled, what do you want to do next", "Enable sign-in with default settings", "Go to advance settings", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently disabled)", "Facebook App ID"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Enabling google', () => {
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
        mainOptions: 'advance',
        selectSignInOptions: 'google',
        googleWebapp: 'abcdef1234',
        androidClientId: 'android1234',
        iosClientId: 'ios1234'
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
        "      optional-sign-in: false" + "\n" +
        "    components:" + "\n" +
        "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          open-id-connect-audience-android: android1234" + "\n" +
        "          open-id-connect-audience-ios: ios1234" + "\n" +
        "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
        "          open-id-provider-url: https://accounts.google.com" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Sign-in is currently disabled, what do you want to do next", "Enable sign-in with default settings", "Go to advance settings", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently disabled)", "Google Web App Client ID", "Google Android Client ID", "Google iOS Client ID"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable signin (with api but no restriction for sign in users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
            "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          provider-id: abcdef" + "\n" +
            "          provider-name: facebook" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'disable',
        sureDisable: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Are you sure you want to disable Sign-In"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);

        })
});

test('Disable signin (with api restricted for sign in users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
            "      sign-in-facebook: !com.amazonaws.mobilehub.v0.StandardIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          provider-id: abcdef" + "\n" +
            "          provider-name: facebook" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'disable',
        sureDisable: true,
        sureDisableRestrictedApi: true,
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
        "      sampleCloudApi: !com.amazonaws.mobilehub.v0.API" + "\n" +
        "        attributes: " + "\n" +
        "          name: sampleCloudApi" + "\n" +
        "          requires-signin: false" + "\n" + // These should change on cloudlogic feature if disabling sign in
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
        "          requires-signin: false" + "\n" + // These should change on cloudlogic feature if disabling sign in
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Are you sure you want to disable Sign-In", "There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);

        })
});

test('Disable cognito with more than one sign in method', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'cognito',
        cognitoSignInOptions: 'disable',
        disableCognito: true
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently enabled)", "Facebook sign-in (currently enabled)", "Google sign-in (currently disabled)", "Cognito UserPools enabled, what do you want to do next", "Disable Cognito UserPools", "Are you sure you want to disable Cognito UserPools"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable facebook with more than one sign in method', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'facebook',
        facebookSignInOptions: 'disable',
        disableFacebook: true
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
        "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          alias-attributes:" + "\n" +
        "            - email" + "\n" +
        "            - phone_number" + "\n" +
        "          mfa-configuration: ON" + "\n" +
        "          name: userpool" + "\n" +
        "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
        "            min-length: 8" + "\n" +
        "            require-lower-case: true" + "\n" +
        "            require-numbers: true" + "\n" +
        "            require-symbols: true" + "\n" +
        "            require-upper-case: true" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";
    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently enabled)", "Facebook sign-in (currently enabled)", "Google sign-in (currently disabled)", "Facebook sign-in enabled, what do you want to do next", "Edit facebook sign-in settings", "Disable facebook sign-in", "Are you sure you want to disable Facebook login"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable google with more than one sign in method', () => {
    // Setting yaml
        var data =
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
            "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          open-id-connect-audience-android: android1234" + "\n" +
            "          open-id-connect-audience-ios: ios1234" + "\n" +
            "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
            "          open-id-provider-url: https://accounts.google.com" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'google',
        googleSignInOptions: 'disable',
        disableGoogle: true
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently enabled)", "Google sign-in (currently enabled)", "Google sign-in enabled, what do you want to do next", "Edit google sign-in settings", "Disable google sign-in", "Are you sure you want to disable Google login"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable cognito and is the last sign in method (api without restriction for signin users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'cognito',
        cognitoSignInOptions: 'disable',
        disableCognito: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently enabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently disabled)", "Cognito UserPools enabled, what do you want to do next", "Disable Cognito UserPools", "Are you sure you want to disable Cognito UserPools"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable facebook login and is the last sign in method (api without restriction for signin users)', () => {
    // Setting yaml
        var data =
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
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'facebook',
        facebookSignInOptions: 'disable',
        disableFacebook: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently enabled)", "Google sign-in (currently disabled)", "Facebook sign-in enabled, what do you want to do next", "Edit facebook sign-in settings", "Disable facebook sign-in", "Are you sure you want to disable Facebook login"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable google login and is the last sign in method (api without restriction for signin users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          open-id-connect-audience-android: android1234" + "\n" +
            "          open-id-connect-audience-ios: ios1234" + "\n" +
            "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
            "          open-id-provider-url: https://accounts.google.com" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'google',
        googleSignInOptions: 'disable',
        disableGoogle: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently enabled)", "Google sign-in enabled, what do you want to do next", "Edit google sign-in settings", "Disable google sign-in", "Are you sure you want to disable Google login"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable cognito and is the last sign in method (api restricted for signin users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-user-pools: !com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          alias-attributes:" + "\n" +
            "            - email" + "\n" +
            "            - phone_number" + "\n" +
            "          mfa-configuration: ON" + "\n" +
            "          name: userpool" + "\n" +
            "          password-policy: !com.amazonaws.mobilehub.ConvertibleMap" + "\n" +
            "            min-length: 8" + "\n" +
            "            require-lower-case: true" + "\n" +
            "            require-numbers: true" + "\n" +
            "            require-symbols: true" + "\n" +
            "            require-upper-case: true" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'cognito',
        cognitoSignInOptions: 'disable',
        disableCognito: true,
        disableRestrictedApiQuestion: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently enabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently disabled)", "Cognito UserPools enabled, what do you want to do next", "Disable Cognito UserPools", "Are you sure you want to disable Cognito UserPools", "There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable facebook and is the last sign in method (api restricted for signin users)', () => {
    // Setting yaml
        var data =
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
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'facebook',
        facebookSignInOptions: 'disable',
        disableFacebook: true,
        disableRestrictedApiQuestion: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently enabled)", "Google sign-in (currently disabled)", "Facebook sign-in enabled, what do you want to do next", "Edit facebook sign-in settings", "Disable facebook sign-in", "Are you sure you want to disable Facebook login", "There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Disable google login and is the last sign in method (api restricted for signin users)', () => {
    // Setting yaml
        var data =
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
            "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          open-id-connect-audience-android: android1234" + "\n" +
            "          open-id-connect-audience-ios: ios1234" + "\n" +
            "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
            "          open-id-provider-url: https://accounts.google.com" + "\n" +
            "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
            "    components:" + "\n" +
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
        mainOptions: 'advance',
        selectSignInOptions: 'google',
        googleSignInOptions: 'disable',
        disableGoogle: true,
        disableRestrictedApiQuestion: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  cloudlogic: !com.amazonaws.mobilehub.v0.CloudLogic" + "\n" +
        "    components:" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Which sign-in method you want to configure", "Cognito UserPools (currently disabled)", "Facebook sign-in (currently disabled)", "Google sign-in (currently enabled)", "Google sign-in enabled, what do you want to do next", "Edit google sign-in settings", "Disable google sign-in", "Are you sure you want to disable Google login", "There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Setting signIn required from optional', () => {
    // Setting yaml
        var data =
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
            "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          open-id-connect-audience-android: android1234" + "\n" +
            "          open-id-connect-audience-ios: ios1234" + "\n" +
            "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
            "          open-id-provider-url: https://accounts.google.com" + "\n" +
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
        mainOptions: 'require',
        optionsRequireSignIn: 'required',
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
        "      optional-sign-in: false" + "\n" +
        "    components:" + "\n" +
        "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          open-id-connect-audience-android: android1234" + "\n" +
        "          open-id-connect-audience-ios: ios1234" + "\n" +
        "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
        "          open-id-provider-url: https://accounts.google.com" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be required (Currently set to optional)", "Go to advance settings", "Disable sign-in", "Are users required to sign in to your app?", "Optional", "Required"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});

test('Setting signIn optional from required', () => {
    // Setting yaml
        var data =
            "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
            "features:" + "\n" +
            "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
            "    components:" + "\n" +
            "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
            "  sign-in: !com.amazonaws.mobilehub.v0.SignIn" + "\n" +
            "    attributes:" + "\n" +
            "      enabled: true" + "\n" +
            "      optional-sign-in: false" + "\n" +
            "    components:" + "\n" +
            "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
            "        attributes:" + "\n" +
            "          open-id-connect-audience-android: android1234" + "\n" +
            "          open-id-connect-audience-ios: ios1234" + "\n" +
            "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
            "          open-id-provider-url: https://accounts.google.com" + "\n" +
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
        mainOptions: 'require',
        optionsRequireSignIn: 'optional',
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
        "      sign-in-google: !com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider" + "\n" +
        "        attributes:" + "\n" +
        "          open-id-connect-audience-android: android1234" + "\n" +
        "          open-id-connect-audience-ios: ios1234" + "\n" +
        "          open-id-connect-audience-webapp: abcdef1234" + "\n" +
        "          open-id-provider-url: https://accounts.google.com" + "\n" +
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
    let logResult = ["Sign-in is currently enabled, what do you want to do next", "Configure Sign-in to be optional (Currently set to required)", "Go to advance settings", "Disable sign-in", "Are users required to sign in to your app?", "Optional", "Required"];
    cleanConsoleLog();

    expect.assertions(2);
    return userSignInOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(consoleLogRegistry).toEqual(logResult);
            expect(currentDefiniton.yamlDefinition).toEqual(result);
        })
});