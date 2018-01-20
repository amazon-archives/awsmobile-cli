'use strict';

jest.mock('fs-extra')

const fs = require('fs-extra')

const inquirer = require('inquirer');
const databaseOps = require('../../../lib/feature-operations/scripts/database-ops')
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

test('Creating table (current no tables)', () => {

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
        openRestricted: 'open',
        tableName: 'AWSMobileTable',
        addAttribute: false,
        attributeName: 'teamId',
        attributeType: 'string',
        partitionKey: 'teamId',
        sortKey: '(No Sort Key)',
        addIndex: false,

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: teamId" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["\nWelcome to NoSQL database wizard", "You will be asked a series of questions to help determine how to best construct your NoSQL database table.\n", "Should the data of this table be open or restricted by user?", "Open", "Restricted", "Table name", "\nYou can now add columns to the table.\n", "What would you like to name this column", "Choose the data type", "string", "number", "binary", "Would you like to add another column", "\n\nBefore you create the database, you must specify how items in your table are uniquely organized. This is done by specifying a Primary key. The primary key uniquely identifies each item in the table, so that no two items can have the same key.\nThis could be and individual column or a combination that has \"primary key\" and a \"sort key\".\nTo learn more about primary key:\nhttp://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey\n\n", "Select primary key", "teamId", "Select sort key", "(No Sort Key)", "\nYou can optionally add global secondary indexes for this table. These are useful when running queries defined by a different column than the primary key.\nTo learn more about indexes:\nhttp://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes\n", "Add index"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Creating table (with existing tables)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: id" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-Table" + "\n" +
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
        databaseOptions: 'add',
        openRestricted: 'open',
        tableName: 'AWSMobileTable',
        addAttribute: false,
        attributeName: 'teamId',
        attributeType: 'string',
        partitionKey: 'teamId',
        sortKey: '(No Sort Key)',
        addIndex: false,

    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: id" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-Table" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "            indexes: []" + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: teamId" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "\nWelcome to NoSQL database wizard", "You will be asked a series of questions to help determine how to best construct your NoSQL database table.\n", "Should the data of this table be open or restricted by user?", "Open", "Restricted", "Table name", "\nYou can now add columns to the table.\n", "What would you like to name this column", "Choose the data type", "string", "number", "binary", "Would you like to add another column", "\n\nBefore you create the database, you must specify how items in your table are uniquely organized. This is done by specifying a Primary key. The primary key uniquely identifies each item in the table, so that no two items can have the same key.\nThis could be and individual column or a combination that has \"primary key\" and a \"sort key\".\nTo learn more about primary key:\nhttp://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey\n\n", "Select primary key", "teamId", "Select sort key", "(No Sort Key)", "\nYou can optionally add global secondary indexes for this table. These are useful when running queries defined by a different column than the primary key.\nTo learn more about indexes:\nhttp://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes\n", "Add index"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});


test('Deleting table (with more than one existing table)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: id" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-Table" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
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
        databaseOptions: 'del',
        tableKey: 'AWSMobileTable',
        confirmDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: id" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-Table" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";


    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be deleted", "Table", "AWSMobileTable", "Are you sure you want to delete the table"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});


test('Deleting table (last table)', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
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
        databaseOptions: 'del',
        tableKey: 'AWSMobileTable',
        confirmDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";


    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be deleted", "AWSMobileTable", "Are you sure you want to delete the table"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Editing table, add column', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
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
        databaseOptions: 'edit',
        editTableKey: 'AWSMobileTable',
        editOptions: 'add_column',
        addAttribute: false,
        attributeName: 'teamName',
        attributeType: 'string'
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be edited", "AWSMobileTable", "Select from one of the choices below.", "Add columns", "Remove column", "Add indexes", "Remove index", "What would you like to name this column", "Choose the data type", "string", "number", "binary", "boolean", "list", "map", "null", "string set", "number set", "binary set", "Would you like to add another column"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Editing table, remove column', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        databaseOptions: 'edit',
        editTableKey: 'AWSMobileTable',
        editOptions: 'remove_column',
        attributeKey: 'teamName',
        confirmAttributeDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
        "  database: !com.amazonaws.mobilehub.v0.Database" + "\n" +
        "    components: " + "\n" +
        "      database-nosql: !com.amazonaws.mobilehub.v0.NoSQLDatabase" + "\n" +
        "        tables: " + "\n" +
        "          - !com.amazonaws.mobilehub.v0.NoSQLTable" + "\n" +
        "            attributes: {}" + "\n" +
        "            hashKeyName: teamId" + "\n" +
        "            hashKeyType: S" + "\n" +
        "            rangeKeyName: ''" + "\n" +
        "            rangeKeyType: ''" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be edited", "AWSMobileTable", "Select from one of the choices below.", "Add columns", "Remove column", "Add indexes", "Remove index", "Select Column to be deleted", "teamName", "teamId", "Are you sure you want to delete the Column"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});

test('Editing table, add index', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        databaseOptions: 'edit',
        editTableKey: 'AWSMobileTable',
        editOptions: 'add_index',
        addIndex: false,
        indexName: 'teamNameIndex',
        partitionKey: 'teamId',
        sortKey: 'teamName'
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        "            indexes:" + "\n" +
        "              - !com.amazonaws.mobilehub.v0.NoSQLIndex" + "\n" +
        "                hashKeyName: teamId" + "\n" +
        "                hashKeyType: S" + "\n" +
        "                rangeKeyName: teamName" + "\n" +
        "                rangeKeyType: S" + "\n" +
        "                indexName: teamNameIndex" + "\n" +
        "            tableName: ___DYNAMIC_PREFIX___-AWSMobileTable" + "\n" +
        "            tablePrivacy: public" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be edited", "AWSMobileTable", "Select from one of the choices below.", "Add columns", "Remove column", "Add indexes", "Remove index", "Index name", "Select partition key", "teamName", "teamId", "Select sort key", "teamName", "(No Sort Key)", "Add index"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});


test('Editing table, remove index', () => {
    // Setting yaml
    let data =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        "            indexes:" + "\n" +
        "              - !com.amazonaws.mobilehub.v0.NoSQLIndex" + "\n" +
        "                hashKeyName: teamId" + "\n" +
        "                hashKeyType: S" + "\n" +
        "                rangeKeyName: teamName" + "\n" +
        "                rangeKeyType: S" + "\n" +
        "                indexName: teamNameIndex" + "\n" +
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
        databaseOptions: 'edit',
        editTableKey: 'AWSMobileTable',
        editOptions: 'remove_index',
        indexKey: 'teamNameIndex',
        confirmIndexDelete: true
    });

    var resultYaml =
        "---!com.amazonaws.mobilehub.v0.Project" + "\n" +
        "features:" + "\n" +
        "  mobile-analytics: !com.amazonaws.mobilehub.v0.Pinpoint" + "\n" +
        "    components:" + "\n" +
        "      analytics: !com.amazonaws.mobilehub.v0.PinpointAnalytics {}" + "\n" +
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
        "            indexes: []" + "\n" +
        "name: '-2017-09-11-10-33-25'" + "\n" +
        "region: us-east-1" + "\n" +
        "uploads: []" + "\n" +
        "sharedComponents: {}" + "\n";

    let result = yaml.safeLoad(resultYaml, { schema: yamlSchema.AWS_MOBILE_YAML_SCHEMA, noCompatMode: true, scalarType: 5 });
    result = yamlSchema.trimObject(result);
    let logResult = ["Select from one of the choices below.", "Create a new table", "Remove table from the project", "Edit table from the project", "Select table to be edited", "AWSMobileTable", "Select from one of the choices below.", "Add columns", "Remove column", "Add indexes", "Remove index", "Select Index to be deleted", "teamNameIndex", "Are you sure you want to delete the Index"];
    cleanConsoleLog();

    expect.assertions(2);
    return databaseOps.specify(mock_projectInfo)
        .then(currentDefiniton => {
            expect(currentDefiniton.yamlDefinition).toEqual(result);
            expect(consoleLogRegistry).toEqual(logResult);
        })
});
