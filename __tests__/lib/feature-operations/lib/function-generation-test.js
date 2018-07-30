'use strict';

jest.mock('fs-extra');

const fs = require('fs-extra')
var pathLib = require('path');
require('child_process').spawnSync = jest.fn();

const functionGeneration = require('../../../../lib/feature-operations/scripts/lib/function-generation');
fs.writeFileSync = function(filePath, content) {
    var file = {}
    file[filePath] = content;
    fs.__setMockFiles(file);
}

console.log = jest.fn();

beforeEach(() => {
    fs.__setMockFiles({}) 
})

test('creating default lambda function', () => {
    let data =
        "###PATH###" + "\n" +
        "###PATH### path" + "\n";
    
    const result  = 
        "/items/test" + "\n" +
        "/items/test path" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO['lambdafolder/app.vm'] = data;
    fs.__setMockFiles(MOCK_FILE_INFO);
    const functionFolder = 'functionfolder';
    functionGeneration.createLambdaFunctionFolder('lambdafolder', functionFolder, '/items/test');

    expect.assertions(1);

    expect(fs.readFileSync(pathLib.join(functionFolder, 'app.js'))).toBe(result);
});

test('creating default lambda function CRUD API with prefix and with table with userid', () => {
    let data =
        "###PATH###" + "\n" +
        "###PATH###" + "\n" +
        "###TABLE_NAME###" + "\n" +
        "###TABLE_NAME###" + "\n" +
        "###OBJECT_PATH###" + "\n" +
        "###OBJECT_PATH###" + "\n" +
        "###LIST_OBJECTS_PATH###" + "\n" +
        "###LIST_OBJECTS_PATH###" + "\n" +
        "###USER_ID_PRESENT###" + "\n" +
        "###USER_ID_PRESENT###" + "\n" +
        "###HAS_DYNAMIC_PREFIX###" + "\n" +
        "###HAS_DYNAMIC_PREFIX###" + "\n" +
        "###PARTITION_KEY_NAME###" + "\n" +
        "###PARTITION_KEY_NAME###" + "\n" +
        "###PARTITION_KEY_TYPE###" + "\n" +
        "###PARTITION_KEY_TYPE###" + "\n" +
        "###SORT_KEY_NAME###" + "\n" +
        "###SORT_KEY_NAME###" + "\n" +
        "###SORT_KEY_TYPE###" + "\n" +
        "###SORT_KEY_TYPE###" + "\n" +
        "###HAS_SORT_KEY###" + "\n" +
        "###HAS_SORT_KEY###" + "\n";
    
    const result  = 
        "/table" + "\n" +
        "/table" + "\n" +
        "table" + "\n" +
        "table" + "\n" + 
        "/table/object/:attribute2" + "\n" + 
        "/table/object/:attribute2" + "\n" + 
        "/table" + "\n" +
        "/table" + "\n" +
        "true" + "\n" +
        "true" + "\n" +
        "true" + "\n" +
        "true" + "\n" +
        "attribute1" + "\n" +
        "attribute1" + "\n" +
        "S" + "\n" +
        "S" + "\n" + 
        "attribute2" + "\n" +
        "attribute2" + "\n" +
        "S" + "\n" +
        "S" + "\n" + 
        "true" + "\n" + 
        "true" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO['lambdafolderCrud/app.vm'] = data;
    fs.__setMockFiles(MOCK_FILE_INFO);
    const functionFolder = 'functionfolderCrud';
    var cloudLogicDefinition = {
        projectDefinition: {
            nosql: {
                tables: {
                    table: {
                        hashKeyName: 'attribute1',
                        sortKeyName: 'attribute2',
                        hashKeyType: 'string',
                        sortKeyType: 'string',
                        hasDynamicPrefix: true
                    }
                }
            }
        }
    };
    var table_name = 'table';
    cloudLogicDefinition.projectDefinition.nosql.tables[table_name].attributes = { attribute1 : 'string', attribute2: 'string'};
    var path = "/items/test";
    var hasUserId = true;
    functionGeneration.createLambdaFunctionCrudApi('lambdafolderCrud', functionFolder, cloudLogicDefinition, path, table_name, hasUserId);

    expect.assertions(1);

    expect(fs.readFileSync(pathLib.join(functionFolder, 'app.js'))).toBe(result);
});

test('creating default lambda function CRUD API no prefix and with table without userid', () => {
    let data =
        "###PATH###" + "\n" +
        "###PATH###" + "\n" +
        "###TABLE_NAME###" + "\n" +
        "###TABLE_NAME###" + "\n" +
        "###OBJECT_PATH###" + "\n" +
        "###OBJECT_PATH###" + "\n" +
        "###LIST_OBJECTS_PATH###" + "\n" +
        "###LIST_OBJECTS_PATH###" + "\n" +
        "###USER_ID_PRESENT###" + "\n" +
        "###USER_ID_PRESENT###" + "\n" +
        "###HAS_DYNAMIC_PREFIX###" + "\n" +
        "###HAS_DYNAMIC_PREFIX###" + "\n" +
        "###PARTITION_KEY_NAME###" + "\n" +
        "###PARTITION_KEY_NAME###" + "\n" +
        "###PARTITION_KEY_TYPE###" + "\n" +
        "###PARTITION_KEY_TYPE###" + "\n" +
        "###SORT_KEY_NAME###" + "\n" +
        "###SORT_KEY_NAME###" + "\n" +
        "###SORT_KEY_TYPE###" + "\n" +
        "###SORT_KEY_TYPE###" + "\n" +
        "###HAS_SORT_KEY###" + "\n" +
        "###HAS_SORT_KEY###" + "\n";
    
    const result  = 
        "/table" + "\n" +
        "/table" + "\n" +
        "table" + "\n" +
        "table" + "\n" + 
        "/table/object/:attribute1/:attribute2" + "\n" + 
        "/table/object/:attribute1/:attribute2" + "\n" + 
        "/table/:attribute1" + "\n" +
        "/table/:attribute1" + "\n" +
        "false" + "\n" +
        "false" + "\n" +
        "false" + "\n" +
        "false" + "\n" +
        "attribute1" + "\n" +
        "attribute1" + "\n" +
        "S" + "\n" +
        "S" + "\n" + 
        "attribute2" + "\n" +
        "attribute2" + "\n" +
        "S" + "\n" +
        "S" + "\n" + 
        "true" + "\n" + 
        "true" + "\n";

    var MOCK_FILE_INFO = {}
    MOCK_FILE_INFO['lambdafolderCrud/app.vm'] = data;
    fs.__setMockFiles(MOCK_FILE_INFO);
    const functionFolder = 'functionfolderCrud';
    var cloudLogicDefinition = {
        projectDefinition: {
            nosql: {
                tables: {
                    table: {
                        hashKeyName: 'attribute1',
                        sortKeyName: 'attribute2',
                        hashKeyType: 'string',
                        sortKeyType: 'string',
                        hasDynamicPrefix: false
                    }
                }
            }
        }
    };
    var table_name = 'table';
    cloudLogicDefinition.projectDefinition.nosql.tables[table_name].attributes = { attribute1 : 'string', attribute2: 'string'};
    var path = "/items/test";
    var hasUserId = false;
    functionGeneration.createLambdaFunctionCrudApi('lambdafolderCrud', functionFolder, cloudLogicDefinition, path, table_name, hasUserId);

    expect.assertions(1);

    expect(fs.readFileSync(pathLib.join(functionFolder, 'app.js'))).toBe(result);
});