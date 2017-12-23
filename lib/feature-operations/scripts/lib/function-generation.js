"use strict";

var fs = require('fs');
var pathLib = require('path');
var databaseOps = require('../database-ops');

const { spawnSync } = require('child_process');

exports.createLambdaFunctionFolder = (lambdaPackageFolder, functionFolder, pathKey) => {
    const filesFolder = pathLib.join(lambdaPackageFolder, 'files');
    let items = fs.readdirSync(filesFolder);
    items.forEach(file => {
        fs.writeFileSync(pathLib.join(functionFolder, file), fs.readFileSync(pathLib.join(filesFolder, file)));
    });
    var appjs = fs.readFileSync(pathLib.join(lambdaPackageFolder, 'app.vm'));
    appjs = appjs + "";
    var pathParams = pathKey + "";
    pathParams.replace(new RegExp('\/{proxy\+}', 'g'), '');
    let regPath = new RegExp('###PATH###', 'g');
    appjs = appjs.replace(regPath, pathParams);
    fs.writeFileSync(pathLib.join(functionFolder, 'app.js'), appjs);
    console.log('...');
    spawnSync('npm', ['install'], { cwd: functionFolder, env: process.env, stdio: ['pipe', 'pipe', 'ignore'] });

    deleteFolderRecursive(pathLib.join(functionFolder, 'node_modules', '.bin'));
}

exports.createLambdaFunctionCrudApi = (lambdaDynamoPackageFolder, functionFolder, cloudLogicDefinition, path, table_name, hasUserId) => {
    const filesFolder = pathLib.join(lambdaDynamoPackageFolder, 'files');
    let items = fs.readdirSync(filesFolder);
    items.forEach(file => {
      fs.writeFileSync(pathLib.join(functionFolder, file), fs.readFileSync(pathLib.join(filesFolder, file)));
    });
    var appjs = fs.readFileSync(pathLib.join(lambdaDynamoPackageFolder, 'app.vm'));
    appjs = appjs + "";
    let regTableName = new RegExp('###TABLE_NAME###', 'g');
    let regObjectPath = new RegExp('###OBJECT_PATH###', 'g');
    let regListObjectsPath = new RegExp('###LIST_OBJECTS_PATH###', 'g');
    let regPath = new RegExp('###PATH###', 'g');

    let regUserIdPresent = new RegExp('###USER_ID_PRESENT###', 'g');
    let regHasDynamicPrefix = new RegExp('###HAS_DYNAMIC_PREFIX###', 'g');
    let regPartitionKeyName = new RegExp('###PARTITION_KEY_NAME###', 'g');
    let regPartitionKeyType = new RegExp('###PARTITION_KEY_TYPE###', 'g');
    let regSortKeyName = new RegExp('###SORT_KEY_NAME###', 'g');
    let regSortKeyType = new RegExp('###SORT_KEY_TYPE###', 'g');
    let regHasSortKey = new RegExp('###HAS_SORT_KEY###', 'g');


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
    if (sortKeyName.length > 0) {
      objectPath += '/:' + sortKeyName;
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

    appjs = appjs.replace(regTableName, table_name);
    appjs = appjs.replace(regPartitionKeyName, hashKeyName);
    appjs = appjs.replace(regSortKeyName, sortKeyName);
    appjs = appjs.replace(regPartitionKeyType, hashKeyType);
    appjs = appjs.replace(regSortKeyType, sortKeyType);
    appjs = appjs.replace(regHasSortKey, sortKeyName.length > 0);
    appjs = appjs.replace(regObjectPath, objectPath);
    appjs = appjs.replace(regListObjectsPath, listObjectsPath);
    appjs = appjs.replace(regPath, pathParams);
    appjs = appjs.replace(regUserIdPresent, hasUserId);
    appjs = appjs.replace(regHasDynamicPrefix, hasDynamicPrefix);

    console.log('...');
    fs.writeFileSync(pathLib.join(functionFolder, 'app.js'), appjs);
    spawnSync('npm', ['install'], { cwd: functionFolder, env: process.env, stdio: ['pipe', 'pipe', 'ignore'] });
    deleteFolderRecursive(pathLib.join(functionFolder, 'node_modules', '.bin'));

    console.log('Path to be used on API for get and remove an object should be like:\n' + objectPath + '\n');
    console.log('Path to be used on API for list objects on get method should be like:\n' + listObjectsPath + '\n');
    console.log('JSON to be used as data on put request should be like:\n' + JSON.stringify(jsonPut, null, 2));
}

// symbolic links dont get zip on awsmobile backend build
var deleteFolderRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};