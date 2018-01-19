'use strict';

jest.mock('fs-extra')

const fs = require('fs-extra')

const inquirer = require('inquirer');
const analytics = require('../../../lib/feature-operations/scripts/analytics-ops')

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

test('Enabling analytics (originally disabled)', () => {
	// Setting yaml
	var data =
		"---!com.amazonaws.mobilehub.v0.Project" + "\n" +
		"features:" + "\n" +
		"  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
		"    attributes:" + "\n" +
		"      enabled: true" + "\n" +
		"      wildcard-cors-policy: true" + "\n" +
		"name: '-2017-09-11-10-33-25'" + "\n" +
		"region: us-east-1" + "\n" +
		"uploads: []" + "\n" +
		"sharedComponents: {}" + "\n";

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)

	mockirer(inquirer, {
		enableAnalytics: true
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

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is disabled, do you want to enable it?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

test('Not enabling analytics (originally disabled)', () => {
	// Setting yaml
	var data =
		"---!com.amazonaws.mobilehub.v0.Project" + "\n" +
		"features:" + "\n" +
		"  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
		"    attributes:" + "\n" +
		"      enabled: true" + "\n" +
		"      wildcard-cors-policy: true" + "\n" +
		"name: '-2017-09-11-10-33-25'" + "\n" +
		"region: us-east-1" + "\n" +
		"uploads: []" + "\n" +
		"sharedComponents: {}" + "\n";

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)
	mockirer(inquirer, {
		enableAnalytics: false
	});

	var resultYaml =
		"---!com.amazonaws.mobilehub.v0.Project" + "\n" +
		"features:" + "\n" +
		"  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
		"    attributes:" + "\n" +
		"      enabled: true" + "\n" +
		"      wildcard-cors-policy: true" + "\n" +
		"name: '-2017-09-11-10-33-25'" + "\n" +
		"region: us-east-1" + "\n" +
		"uploads: []" + "\n" +
		"sharedComponents: {}" + "\n";

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is disabled, do you want to enable it?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

test('Disabling analytics (originally enabled)', () => {
	// Setting yaml
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

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)

	mockirer(inquirer, {
		enableAnalytics: false
	});

	var resultYaml =
		"---!com.amazonaws.mobilehub.v0.Project" + "\n" +
		"features:" + "\n" +
		"  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
		"    attributes:" + "\n" +
		"      enabled: true" + "\n" +
		"      wildcard-cors-policy: true" + "\n" +
		"name: '-2017-09-11-10-33-25'" + "\n" +
		"region: us-east-1" + "\n" +
		"uploads: []" + "\n" +
		"sharedComponents: {}" + "\n";

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is enabled, do you want to keep it enabled?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

test('Confirm default analytics (originally disabled)', () => {
	// Setting yaml
	var data =
		"---!com.amazonaws.mobilehub.v0.Project" + "\n" +
		"features:" + "\n" +
		"  user-files: !com.amazonaws.mobilehub.v0.UserFiles" + "\n" +
		"    attributes:" + "\n" +
		"      enabled: true" + "\n" +
		"      wildcard-cors-policy: true" + "\n" +
		"name: '-2017-09-11-10-33-25'" + "\n" +
		"region: us-east-1" + "\n" +
		"uploads: []" + "\n" +
		"sharedComponents: {}" + "\n";

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)

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

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is disabled, do you want to enable it?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

test('Confirm default analytics (originally enabled)', () => {
	// Setting yaml
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

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)

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

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is enabled, do you want to keep it enabled?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

test('Confirm default analytics (originally enabled)', () => {
	// Setting yaml
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

	var MOCK_FILE_INFO = {}
	MOCK_FILE_INFO[backendYmlFilePath] = data;
	fs.__setMockFiles(MOCK_FILE_INFO)

	mockirer(inquirer, {
		enableAnalytics: true
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

	let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA });
	result = yamlSchema.trimObject(result);
	let logResult = ['Currently Amazon Pinpoint analytics is enabled, do you want to keep it enabled?'];
	cleanConsoleLog();

	expect.assertions(2);
	return analytics.specify(mock_projectInfo)
		.then(currentDefiniton => {
			expect(currentDefiniton.yamlDefinition).toEqual(result);
			expect(consoleLogRegistry).toEqual(logResult);
		})
});

