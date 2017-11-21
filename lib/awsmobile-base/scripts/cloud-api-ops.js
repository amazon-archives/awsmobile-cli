'use strict';

var inquirer = require('inquirer');
var fs = require('fs');
var mhYamlLib = require('./lib/mh-yaml-lib.js');
var pathLib = require('path');
var databaseOps = require('./database-ops');

const { spawnSync } = require('child_process');

const invokeApi = require('./cloud-api/invoke');

var cloudLogicFolder = '';
var lambdaPackageFolder = getCloudLambdaPackagePath();
const lambdaDynamoPackageFolder = getCloudLambdaDynamoPackagePath();
// lambda function name size restriction
const sizeNameLimit = 20;

// save project info
var _projectInfo = {}

function getCloudLambdaPackagePath() {
  return pathLib.normalize(pathLib.join(__dirname, '../backend-templates/cloud-api/lambda-package'));
}

function getCloudLambdaDynamoPackagePath() {
  return pathLib.normalize(pathLib.join(__dirname, '../backend-templates/cloud-api/dynamo-api'));
}

function npmInstall(folder){
  var npmInstall = spawnSync('npm', ['install'], {cwd: folder, env: process.env, stdio: ['pipe', 'pipe', 'ignore']});
  npmInstall.on('exit', function(code) {
    console.log('npm install process exited with code ' + code.toString());
  });
}

var startQuestionary = (currentDefinition) => new Promise(
  function(resolve, reject) {
    var apiDefinition = {
      name: '',
      signInRequired: false,
      paths: {}
    };

    var cloudLogicDefinition = {
      newApi: apiDefinition,
      projectDefinition: currentDefinition,
      summary: []
    };

    console.log('Welcome to CloudLogic wizard');
    console.log('You will be asked a series of questions to create your API');

    resolve(cloudLogicDefinition);
  }
);

var startEditing = (currentDefinition) => new Promise(
  function(resolve, reject) {

    var cloudLogicDefinition = {
      newApi: currentDefinition.apiDefinition,
      projectDefinition: currentDefinition,
      summary: []
    };
    resolve(cloudLogicDefinition);
  }
);

var startQuestionaryDynamoApi = (currentDefinition) => new Promise(
  function(resolve, reject) {
    var cloudLogicDefinition = {
      newApi: currentDefinition.apiDefinition,
      projectDefinition: currentDefinition,
      summary: []
    };

    resolve(cloudLogicDefinition);
  }
);

var askApiName = (cloudLogicDefinition) => {
  var apiNameQuestion = {
      type: 'input',
      name: 'api_name',
      message: 'API name',
      validate: function (value) {
        var pass = value.length > 0;
        let yamlDef = cloudLogicDefinition.projectDefinition.yamlDefinition;

        // Check if API already exists
        if (yamlDef.features.cloudlogic && yamlDef.features.cloudlogic.components &&
            yamlDef.features.cloudlogic.components[value]) {
          return 'API ' + value + ' already exists';
        }
        if (pass) {
          return true;
        }
        return 'Please enter a valid API name';
      }
    };

    return inquirer.prompt(apiNameQuestion).then(answers => {
      cloudLogicDefinition.newApi.name = answers.api_name;
      return cloudLogicDefinition;
    });
}

var askRequiredSignIn = (cloudLogicDefinition) => {
  // If project has signin enabled ask if the api is only for signin users
  var signInEnabled = cloudLogicDefinition.projectDefinition.yamlDefinition.features['sign-in'] && 
                      cloudLogicDefinition.projectDefinition.yamlDefinition.features['sign-in']['attributes'] &&
                      cloudLogicDefinition.projectDefinition.yamlDefinition.features['sign-in']['attributes']['enabled'];
  
  if (!signInEnabled) {
    return Promise.resolve(cloudLogicDefinition);
  } else {
    var signInRequiredQuestion = {
      type: 'confirm',
      name: 'required_signin',
      message: 'Restrict API access to signed-in users',
      default: cloudLogicDefinition.newApi.signInRequired
    }
    return inquirer.prompt(signInRequiredQuestion).then(answers => {
      cloudLogicDefinition.newApi.signInRequired = answers.required_signin;
      return cloudLogicDefinition;
    });
  }
}

var validatePathName = (name, cloudLogicDefinition) => {
  var err = null;

  if (name.length === 0 || name.substring(name.length-1) === '/') {
    return 'Each sub-path must begin with a letter or number.';
  }

  // Set / as a first character of path name
  if (name.substring(0,1) !== '/') {
    return 'Path must begin with / e.g. /items';
  }
  if ( /[^a-zA-Z0-9\-\/]/.test(name) ) {
     return 'You can use the following characters: a-z A-Z 0-9 - /';
  }

  // If the are is something like /asasd//asa must be detected
  // Splitting the string with / to find empty sub-path
  let split = name.split('/');
  for (let i = 1; i < split.length; i++) {
    let val = split[i];
    if (val.length === 0) {
      return 'Each sub-path must begin with a letter or number';
    }
  }

  // Checking if there is already that path created on the API
  if (cloudLogicDefinition.newApi.paths[name]) {
    return 'Path name already exists'
  }

  // Create subpath from the beginning to find a match on existing paths
  var subpath = '';
  for (let i = 1; i < split.length - 1; i++) {
    subpath = subpath + '/' + split[i];
    if (cloudLogicDefinition.newApi.paths[subpath]) {
      return 'A different path already matches this sub-path: ' + subpath;
    }
  }

  return err;
}

var askPaths = (cloudLogicDefinition) => {
  let defaultLambdaFunctionName = cloudLogicDefinition.newApi.name;

  if (defaultLambdaFunctionName.length > sizeNameLimit) {
    defaultLambdaFunctionName = defaultLambdaFunctionName.substring(0, sizeNameLimit);
  }

  var pathQuestions = [
    {
      type: 'input',
      name: 'path_name',
      message: 'HTTP path name',
      default: '/items',
      validate: function (value) {
        var err = validatePathName(value, cloudLogicDefinition);
        if (err) {
          return err;
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'function_name',
      message: 'Lambda function name (This will be created if it does not already exists)',
      default: defaultLambdaFunctionName,
      validate: function (value) {
        var pass = value.length > 0;
        if (pass) {
          return true;
        }

        if (value.length > sizeNameLimit) {
          return 'Please enter a shorter function name (Max length ' + sizeNameLimit + ')'  
        }
        if ( /[^a-zA-Z0-9]/.test(name) ) {
          return 'You can use the following characters: a-z A-Z 0-9';
       }
        return 'Please enter a valid function name';
      }
    },
    {
      type: 'confirm',
      name: 'add_another_path',
      message: 'Add another HTTP path',
      default: false
    }
  ];
  return inquirer.prompt(pathQuestions).then(answers => {
    var path = {
      name: answers.function_name,
      codeFilename: 'uploads/' + answers.function_name + '.zip',
      handler: 'lambda.handler',
      enableCORS: true,
      runtime: 'nodejs6.10',
      environment: {}
    };
    cloudLogicDefinition.newApi.paths[answers.path_name] = path;
    cloudLogicDefinition.newApi.paths[answers.path_name + '/{proxy+}'] = path;
    if (answers.add_another_path) {
      return askPaths(cloudLogicDefinition);
    }
    return (cloudLogicDefinition);
  });
}

var addApi = (cloudLogicDefinition) => {
  cloudLogicDefinition.projectDefinition.cloudlogic.apis[cloudLogicDefinition.newApi.name] =
    cloudLogicDefinition.newApi;

  // Create folder for each lambda function
  Object.keys(cloudLogicDefinition.newApi.paths).map(pathKey => {
    let path = cloudLogicDefinition.newApi.paths[pathKey];
    var functionFolder = pathLib.join(cloudLogicFolder, path.name) + '/';

    if (!fs.existsSync(functionFolder)) {
      fs.mkdirSync(functionFolder);
      console.log('Adding lambda function code on: \n' + functionFolder);
      const filesFolder = pathLib.join(lambdaPackageFolder, 'files');
      let items = fs.readdirSync(filesFolder);
      items.forEach(file => {
        fs.writeFileSync(pathLib.join(functionFolder,file), fs.readFileSync(pathLib.join(filesFolder,file)));
      });
      var appjs = fs.readFileSync(pathLib.join(lambdaPackageFolder, 'app.vm'));
      appjs = appjs + "";
      var pathParams = pathKey + "";
      pathParams.replace(new RegExp('\/{proxy\+}', 'g'), '');
      let regPath = new RegExp('###PATH###', 'g');
      appjs = appjs.replace(regPath, pathParams);
      fs.writeFileSync(pathLib.join(functionFolder,'app.js'), appjs);
      console.log('...');
      spawnSync('npm', ['install'], {cwd: functionFolder, env: process.env, stdio: ['pipe', 'pipe', 'ignore']});
      
      deleteFolderRecursive(pathLib.join(functionFolder,'node_modules','.bin'));
      console.log('To test the api from the command line (after awsmobile push) use this commands');
      console.log('awsmobile cloud-api invoke', cloudLogicDefinition.newApi.name, '<method> <path> [init]');
    } 
  });
  // Update yaml with api configuration
  let yaml = createYamlStructure(cloudLogicDefinition.projectDefinition);
  mhYamlLib.save(_projectInfo, yaml, () => {
    console.log('Api %s saved', cloudLogicDefinition.newApi.name);;
  });

  // printing all info about the api
  cloudLogicDefinition.summary.map(text => {
    console.log(text);
  })
  return Promise.resolve(cloudLogicDefinition.projectDefinition.cloudlogic.apis);
}

const checktableNotValid = (table) => {
  // Tables with binary or binary stream are not supported yet
  let status = null;

  Object.keys(table.attributes).map(attrKey => {
    const attrType = databaseOps.getTypeCode(table.attributes[attrKey]);
    if (attrType === 'BS' || attrType === 'B') {
      status = 'Currently crud API generation is not supporting binary types, column ' + attrKey;
    }
  });
  return status;
}

var addDynamoApi = (cloudLogicDefinition) => {
  const table_name = cloudLogicDefinition.projectDefinition.table_name;

  const tableNotValid = checktableNotValid(cloudLogicDefinition.projectDefinition.nosql.tables[table_name]);
  if (tableNotValid) {
    return Promise.reject(tableNotValid);
  }
  cloudLogicDefinition.projectDefinition.cloudlogic.apis[cloudLogicDefinition.newApi.name] =
    cloudLogicDefinition.newApi;
  
  const hasUserId = !cloudLogicDefinition.projectDefinition.nosql.tables[table_name].write;
  // Create folder for each lambda function
  Object.keys(cloudLogicDefinition.newApi.paths).map(pathKey => {
    let path = cloudLogicDefinition.newApi.paths[pathKey];
    var functionFolder = pathLib.join(cloudLogicFolder, path.name) + '/';

    if (!fs.existsSync(functionFolder)) {
      fs.mkdirSync(functionFolder);
      console.log('Adding lambda function code on: \n' + functionFolder);
      const filesFolder = pathLib.join(lambdaDynamoPackageFolder, 'files');
      let items = fs.readdirSync(filesFolder);
      items.forEach(file => {
        fs.writeFileSync(pathLib.join(functionFolder,file), fs.readFileSync(pathLib.join(filesFolder,file)));
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
      var listObjectsPath = '/' + table_name ;
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
      fs.writeFileSync(pathLib.join(functionFolder,'app.js'), appjs);
      spawnSync('npm', ['install'], {cwd: functionFolder, env: process.env, stdio: ['pipe', 'pipe', 'ignore']});
      deleteFolderRecursive(pathLib.join(functionFolder,'node_modules','.bin'));
      console.log('Path to be used on API for get and remove an object should be like:\n' + objectPath + '\n');
      console.log('Path to be used on API for list objects on get method should be like:\n' + listObjectsPath + '\n');
      console.log('JSON to be used as data on put request should be like:\n' + JSON.stringify(jsonPut, null, 2));

      console.log('To test the api from the command line (after awsmobile push) use this commands');
      console.log('awsmobile cloud-api invoke', cloudLogicDefinition.newApi.name, '<method> <path> [init]');
    } 
  });
  // Update yaml with api configuration
  let yaml = createYamlStructure(cloudLogicDefinition.projectDefinition);
  mhYamlLib.save(_projectInfo, yaml, () => {
    console.log('Api %s saved', cloudLogicDefinition.newApi.name);;
  });

  // printing all info about the api
  cloudLogicDefinition.summary.map(text => {
    console.log(text);
  })
  return Promise.resolve(cloudLogicDefinition.projectDefinition.cloudlogic.apis);
}

var createYamlStructure = (projectDefinition) => {
  var apis = {};

  Object.keys(projectDefinition.cloudlogic.apis).map(apiKey => {
    let api = projectDefinition.cloudlogic.apis[apiKey]
    var attributes = {
      name: api.name,
      'requires-signin': api.signInRequired
    };

    var paths = {};
    Object.keys(api.paths).map(pathKey => {
      let path = api.paths[pathKey];
      paths[pathKey] = new mhYamlLib.MHFunction(path.name, path.codeFilename,
        path.handler, path.enableCORS,
        path.runtime, path.environment);
    });

    apis[api.name] = new mhYamlLib.Api(attributes, paths);
  });
  // In case the feature was not enabled
  projectDefinition['yamlDefinition']['features']['cloudlogic'] = new mhYamlLib.CloudLogic({
    components: apis
  });

  if (Object.keys(projectDefinition['yamlDefinition']['features']['cloudlogic']['components']).length === 0) {
    delete projectDefinition['yamlDefinition']['features']['cloudlogic'];
  }
  return projectDefinition['yamlDefinition'];
}

var createApiJsonStructure = (yamlDefinition) => {
  var jsonApiStructure  = {};
  var components = {};
  if (yamlDefinition['features'] && yamlDefinition['features']['cloudlogic'] &&
      yamlDefinition['features']['cloudlogic']['components']) {
    components = yamlDefinition['features']['cloudlogic']['components'];
  }

  Object.keys(components).map(apiKey => {
    var currentApi = {
      name: apiKey,
      signInRequired: components[apiKey]['attributes']['requires-signin'],
      paths: components[apiKey]['paths']
    }

    jsonApiStructure[apiKey] = currentApi;
  });
  return jsonApiStructure;
}

function createApi(currentDefinition) {
  startQuestionary(currentDefinition)
  .then(askApiName)
  .then(askRequiredSignIn)
  .then(askPaths)
  .then(addApi)
  .catch(console.log.bind(null, 'ERROR'));
}

function deleteApi(currentDefinition) {
  var apiList = Array.from(Object.keys(currentDefinition.cloudlogic.apis));
  if (apiList.length === 0) {
    console.log('No API left');
    return;
  }
  var deleteQuestion = [
    {
      type: 'list',
      name: 'api_key',
      message: 'Select API to be deleted',
      choices: apiList
    },
    {
      type: 'confirm',
      name: 'confirm_delete',
      message: 'Are you sure you want to delete the API',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers.confirm_delete) {
      console.log('No API deleted');
    } else {
      delete currentDefinition.cloudlogic.apis[answers.api_key];

      let yaml = createYamlStructure(currentDefinition);

      mhYamlLib.save(_projectInfo, yaml, () => {
        console.log('API %s deleted', answers.api_key);;
      });
    }
  });
}

function deletePath(cloudLogicDefinition) {
  var pathList = Array.from(Object.keys(cloudLogicDefinition.newApi.paths));
  var deleteQuestion = [
    {
      type: 'list',
      name: 'path_key',
      message: 'Select Path to be deleted',
      choices: pathList
    },
    {
      type: 'confirm',
      name: 'confirm_path_delete',
      message: 'Are you sure you want to delete the Path',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers['confirm_path_delete']) {
      Promise.reject('No Path deleted');
    } else {
      delete cloudLogicDefinition.newApi.paths[answers['path_key']];
      return (cloudLogicDefinition);
    }

  });
}

function editApi(currentDefinition) {
  var apiList = Array.from(Object.keys(currentDefinition.cloudlogic.apis));
  if (apiList.length === 0) {
    console.log('No API left');
    return;
  }

  let optionsChoices = [
    {
      name: 'Add path',
      value: 'add-path'
    },
    {
      name: 'Remove path',
      value: 'remove-path'
    }
  ];

  const signInEnabled = currentDefinition.yamlDefinition.features['sign-in'] && 
                        currentDefinition.yamlDefinition.features['sign-in']['attributes'] &&
                        currentDefinition.yamlDefinition.features['sign-in']['attributes']['enabled'];
  
  if (signInEnabled) {
    optionsChoices.push({
      name: 'Configure API access to signed-in users',
      value: 'signed-in'
    });
  }

  var editQuestion = [
    {
      type: 'list',
      name: 'api_key_edit',
      message: 'Select API to be edited',
      choices: apiList
    },
    {
      type: 'list',
      name: 'edit_options',
      message: 'Select from one of the choices below.',
      choices: optionsChoices
    }
  ];

  return inquirer.prompt(editQuestion).then(answers => {
    currentDefinition.apiDefinition = currentDefinition.cloudlogic.apis[answers.api_key_edit];
    if (answers['edit_options'] === 'signed-in') {
      return editSignInRestriction(currentDefinition);
    } else if (answers['edit_options'] === 'add-path') {
      return addPathExistingApi(currentDefinition);
    } else if (answers['edit_options'] === 'remove-path') {
      return deletePathExistingApi(currentDefinition);
    }
  });
}

function deletePathExistingApi(currentDefinition) {
  startEditing(currentDefinition)
  .then(deletePath)
  .then(addApi)
  .catch(console.log.bind(null, 'ERROR'));
}

function editSignInRestriction(currentDefinition) {
  startEditing(currentDefinition)
  .then(askRequiredSignIn)
  .then(addApi)
  .catch(console.log.bind(null, 'ERROR'));
}

function addPathExistingApi(currentDefinition) {
  startEditing(currentDefinition)
  .then(askPaths)
  .then(addApi)
  .catch(console.log.bind(null, 'ERROR'));
}


function dynamoApi(currentDefinition) {
  var tableList = Array.from(Object.keys(currentDefinition.nosql.tables));

  var dynamoApiQuestion = [
    {
      type: 'list',
      name: 'dynamo_key',
      message: 'Select Amazon DynamoDB table to connect to a CRUD API',
      choices: tableList
    }];

  return inquirer.prompt(dynamoApiQuestion).then(answers => {
    var prefixApiName = answers.dynamo_key;

    if (currentDefinition.cloudlogic.apis[prefixApiName + 'CRUD']) {
      console.log('Api already exists: ' + prefixApiName + 'CRUD' );
      return ;
    }

    var apiDefinition = {
      name: prefixApiName + 'CRUD',
      signInRequired: false,
      paths: {}
    }
    var lambdaFunctionName = prefixApiName.replace(/\-/g,'');
    lambdaFunctionName = lambdaFunctionName.replace(/\./g,'');
    lambdaFunctionName = lambdaFunctionName.replace(/\_/g,'');

    if (lambdaFunctionName.length > sizeNameLimit) {
      lambdaFunctionName = lambdaFunctionName.substring(lambdaFunctionName.length - sizeNameLimit);
    }
    apiDefinition.paths['/' + prefixApiName] = {
      name: lambdaFunctionName,
      codeFilename: 'uploads/' + lambdaFunctionName + '.zip',
      handler: 'lambda.handler',
      enableCORS: true,
      runtime: 'nodejs6.10',
      environment: {}
    }
    apiDefinition.paths['/' + prefixApiName + '/{proxy+}'] = {
      name: lambdaFunctionName,
      codeFilename: 'uploads/' + lambdaFunctionName + '.zip',
      handler: 'lambda.handler',
      enableCORS: true,
      runtime: 'nodejs6.10',
      environment: {}
    }  
     
    currentDefinition.apiDefinition = apiDefinition;
    currentDefinition.table_name = answers.dynamo_key;
    return dynamoApi2(currentDefinition);
  });
}

function dynamoApi2(currentDefinition) {
  startQuestionaryDynamoApi(currentDefinition)
  .then(askRequiredSignIn)
  .then(addDynamoApi)
  .catch(console.log.bind(null, 'ERROR'));
}

function main() {

  var currentDefinition = {
    cloudlogic: {apis: {}},
    yamlDefinition: {},
    nosql: {}
  }

  mhYamlLib.load(_projectInfo, (yamlDefinition) => {
    currentDefinition.cloudlogic.apis = createApiJsonStructure(yamlDefinition);
    currentDefinition.nosql.tables = databaseOps.createTableJsonStructure(yamlDefinition);
    currentDefinition.yamlDefinition = yamlDefinition;

    // No Api on the project always add
    /*if (Object.keys(currentDefinition.cloudlogic.apis).length === 0) {
      return createApi(currentDefinition);
    }*/

    let optionsChoices = [
      {
        name: 'Create a new API',
        value: 'add'
      }
    ];

    if (Object.keys(currentDefinition.cloudlogic.apis).length > 0) {
      optionsChoices.push({
        name: 'Remove an API from the project',
        value: 'del'
      },
      {
        name: 'Edit an API from the project',
        value: 'edit'
      });
    }
    
    if (Object.keys(currentDefinition.nosql.tables).length > 0) {
      optionsChoices.push({
        name: 'Create CRUD API for an existing Amazon DynamoDB table',
        value: 'dynamo'
      });
    }

    var optionsQuestion = {
      type: 'list',
      name: 'options',
      message: 'Select from one of the choices below.',
      choices: optionsChoices
    };

    console.log("\n\n" + "This feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table." + "\n\n");
    return inquirer.prompt(optionsQuestion).then(answers => {
      if (answers.options === 'add') {
        return createApi(currentDefinition)
      } else if (answers.options === 'del') {
        return deleteApi(currentDefinition);
      } else if (answers.options === 'edit') {
        return editApi(currentDefinition);
      } else if (answers.options === 'dynamo') {
        return dynamoApi(currentDefinition);
      }
    });
  });
}

// symbolic links dont get zip on awsmobile backend build
var deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
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

exports.specify = function(projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  cloudLogicFolder = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
  main();
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = projectInfo
  cloudLogicFolder = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
  let path = '/items';
  var functionFolder = pathLib.join(cloudLogicFolder, 'sampleLambda') + '/';

  if (!fs.existsSync(functionFolder)) {
    fs.mkdirSync(functionFolder);
    console.log('Adding lambda function code on \n' + functionFolder + '\n...');
    const filesFolder = pathLib.join(lambdaPackageFolder, 'files');
    let items = fs.readdirSync(filesFolder);
    items.forEach(file => {
      fs.writeFileSync(pathLib.join(functionFolder,file), fs.readFileSync(pathLib.join(filesFolder,file)));
    });
    var appjs = fs.readFileSync(pathLib.join(lambdaPackageFolder, 'app.vm'));
    appjs = appjs + "";
    var pathParams = path + "";
    let regPath = new RegExp('###PATH###', 'g');
    appjs = appjs.replace(regPath, pathParams);
    fs.writeFileSync(pathLib.join(functionFolder,'app.js'), appjs);
    
    spawnSync('npm', ['install'], {cwd: functionFolder, env: process.env, stdio: ['pipe', 'pipe', 'ignore']});
    deleteFolderRecursive(pathLib.join(functionFolder,'node_modules','.bin'));

    console.log('\nTo test the api from the command line (after awsmobile push) use this commands');
    console.log('awsmobile cloud-api invoke', 'SampleCloudLogicAPI', '<method> /items [init]\n\n');
  } 
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.invoke = function(projectInfo, args) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  cloudLogicFolder = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
  invokeApi.invoke(projectInfo, args);
}
