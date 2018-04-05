'use strict';

var inquirer = require('inquirer');
var fs = require('fs-extra');
const yamlSchema = require('../../aws-operations/mobile-yaml-schema');
const yamlOps = require('../../aws-operations/mobile-yaml-ops');
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
var pathLib = require('path');
var databaseOps = require('./database-ops');
var functionGeneration = require('./lib/function-generation');

const { spawnSync } = require('child_process');

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

function npmInstall(folder) {
  var npmInstall = spawnSync('npm', ['install'], { cwd: folder, env: process.env, stdio: ['pipe', 'pipe', 'ignore'] });
  npmInstall.on('exit', function (code) {
    console.log('npm install process exited with code ' + code.toString());
  });
}

var startQuestionary = (currentDefinition) => new Promise(
  function (resolve, reject) {
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
  function (resolve, reject) {

    var cloudLogicDefinition = {
      newApi: currentDefinition.apiDefinition,
      projectDefinition: currentDefinition,
      summary: []
    };
    resolve(cloudLogicDefinition);
  }
);

var startQuestionaryDynamoApi = (currentDefinition) => new Promise(
  function (resolve, reject) {
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
    name: 'apiName',
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
    cloudLogicDefinition.newApi.name = answers.apiName;
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
      name: 'requiredSignin',
      message: 'Restrict API access to signed-in users',
      default: cloudLogicDefinition.newApi.signInRequired
    }
    return inquirer.prompt(signInRequiredQuestion).then(answers => {
      cloudLogicDefinition.newApi.signInRequired = answers.requiredSignin;
      return cloudLogicDefinition;
    });
  }
}

var validatePathName = (name, cloudLogicDefinition) => {
  var err = null;

  if (name.length === 0 || name.substring(name.length - 1) === '/') {
    return 'Each sub-path must begin with a letter or number.';
  }

  // Set / as a first character of path name
  if (name.substring(0, 1) !== '/') {
    return 'Path must begin with / e.g. /items';
  }
  if (/[^a-zA-Z0-9\-\/]/.test(name)) {
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
      name: 'pathName',
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
      name: 'functionName',
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
        if (/[^a-zA-Z0-9]/.test(name)) {
          return 'You can use the following characters: a-z A-Z 0-9';
        }
        return 'Please enter a valid function name';
      }
    },
    {
      type: 'confirm',
      name: 'addAnotherPath',
      message: 'Add another HTTP path',
      default: false
    }
  ];
  return inquirer.prompt(pathQuestions).then(answers => {
    var path = {
      name: answers.functionName,
      codeFilename: 'uploads/' + answers.functionName + '.zip',
      handler: 'lambda.handler',
      enableCORS: true,
      runtime: 'nodejs6.10',
      environment: {}
    };
    cloudLogicDefinition.newApi.paths[answers.pathName] = path;
    cloudLogicDefinition.newApi.paths[answers.pathName + '/{proxy+}'] = path;
    if (answers.addAnotherPath) {
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
    cloudLogicFolder = pathLib.join(_projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
    var functionFolder = pathLib.join(cloudLogicFolder, path.name) + '/';

    if (!fs.existsSync(functionFolder)) {
      fs.mkdirSync(functionFolder);
      console.log('Adding lambda function code on: \n' + functionFolder);

      functionGeneration.createLambdaFunctionFolder(lambdaPackageFolder, functionFolder, pathKey);

      console.log('To test the api from the command line (after awsmobile push) use this commands');
      console.log('awsmobile cloud-api invoke', cloudLogicDefinition.newApi.name, '<method> <path> [init]');
    }
  });
  // Update yaml with api configuration
  let yaml = createYamlStructure(cloudLogicDefinition.projectDefinition);

  let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
  yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);

  // printing all info about the api
  cloudLogicDefinition.summary.map(text => {
    console.log(text);
  })
  cloudLogicDefinition.yamlDefinition = yaml;
  return cloudLogicDefinition;
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
  return new Promise(function (resolve, reject) {
    const table_name = cloudLogicDefinition.projectDefinition.table_name;

    const tableNotValid = checktableNotValid(cloudLogicDefinition.projectDefinition.nosql.tables[table_name]);
    if (tableNotValid) {
      reject(tableNotValid);
    }
    cloudLogicDefinition.projectDefinition.cloudlogic.apis[cloudLogicDefinition.newApi.name] =
      cloudLogicDefinition.newApi;

    const hasUserId = !cloudLogicDefinition.projectDefinition.nosql.tables[table_name].write;
    // Create folder for each lambda function
    Object.keys(cloudLogicDefinition.newApi.paths).map(pathKey => {
      cloudLogicFolder = pathLib.join(_projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
      let path = cloudLogicDefinition.newApi.paths[pathKey];
      var functionFolder = pathLib.join(cloudLogicFolder, path.name) + '/';

      if (!fs.existsSync(functionFolder)) {
        fs.mkdirSync(functionFolder);
        console.log('Adding lambda function code on: \n' + functionFolder);

        functionGeneration.createLambdaFunctionCrudApi(lambdaDynamoPackageFolder, functionFolder, cloudLogicDefinition, path, table_name, hasUserId);

        console.log('To test the api from the command line (after awsmobile push) use this commands');
        console.log('awsmobile cloud-api invoke', cloudLogicDefinition.newApi.name, '<method> <path> [init]');
      }
    });
    // Update yaml with api configuration
    let yaml = createYamlStructure(cloudLogicDefinition.projectDefinition);
    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
    yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);

    // printing all info about the api
    cloudLogicDefinition.summary.map(text => {
      console.log(text);
    })
    cloudLogicDefinition.yamlDefinition = yaml;
    resolve(cloudLogicDefinition);
  });
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
      paths[pathKey] = new yamlSchema.dressObject({
        ...path,
        'backend-class': 'Function'
      });
    });

    apis[api.name] = new yamlSchema.dressObject({
      attributes,
      paths,
      'backend-class': 'API'
      }
    );
  });
  // In case the feature was not enabled
  projectDefinition['yamlDefinition']['features']['cloudlogic'] = new yamlSchema.dressObject({
    components: apis,
    'backend-class': 'CloudLogic'
  });

  if (Object.keys(projectDefinition['yamlDefinition']['features']['cloudlogic']['components']).length === 0) {
    delete projectDefinition['yamlDefinition']['features']['cloudlogic'];
  }
  return projectDefinition['yamlDefinition'];
}

var createApiJsonStructure = (yamlDefinition) => {
  var jsonApiStructure = {};
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
  return new Promise(function (resolve, reject) {
    startQuestionary(currentDefinition)
      .then(askApiName)
      .then(askRequiredSignIn)
      .then(askPaths)
      .then(addApi)
      .then(resolve)
      .catch(reject);
  });
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
      name: 'apiKey',
      message: 'Select API to be deleted',
      choices: apiList
    },
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: 'Are you sure you want to delete the API',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers.confirmDelete) {
      console.log('No API deleted');
    } else {
      delete currentDefinition.cloudlogic.apis[answers.apiKey];

      let yaml = createYamlStructure(currentDefinition);

      let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
      yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);
      currentDefinition.yamlDefinition = yaml;
      return currentDefinition;
    }
  });
}

function deletePath(cloudLogicDefinition) {
  var pathList = Array.from(Object.keys(cloudLogicDefinition.newApi.paths));
  var deleteQuestion = [
    {
      type: 'list',
      name: 'pathKey',
      message: 'Select Path to be deleted',
      choices: pathList
    },
    {
      type: 'confirm',
      name: 'confirmPathDelete',
      message: 'Are you sure you want to delete the Path',
      default: false
    }];

  return inquirer.prompt(deleteQuestion).then(answers => {
    if (!answers['confirmPathDelete']) {
      Promise.reject('No Path deleted');
    } else {
      delete cloudLogicDefinition.newApi.paths[answers['pathKey']];
      return (cloudLogicDefinition);
    }

  });
}

function editApi(currentDefinition) {
  return new Promise(function (resolve, reject) {
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
        name: 'apiKeyEdit',
        message: 'Select API to be edited',
        choices: apiList
      },
      {
        type: 'list',
        name: 'editOptions',
        message: 'Select from one of the choices below.',
        choices: optionsChoices
      }
    ];

    return inquirer.prompt(editQuestion).then(answers => {
      currentDefinition.apiDefinition = currentDefinition.cloudlogic.apis[answers.apiKeyEdit];
      if (answers['editOptions'] === 'signed-in') {
        resolve(editSignInRestriction(currentDefinition));
      } else if (answers['editOptions'] === 'add-path') {
        resolve(addPathExistingApi(currentDefinition));
      } else if (answers['editOptions'] === 'remove-path') {
        resolve(deletePathExistingApi(currentDefinition));
      }
    });
  });
}

function deletePathExistingApi(currentDefinition) {
  return new Promise(function (resolve, reject) {
    startEditing(currentDefinition)
      .then(deletePath)
      .then(addApi)
      .then(resolve);
  });
}

function editSignInRestriction(currentDefinition) {
  return new Promise(function (resolve, reject) {
    startEditing(currentDefinition)
      .then(askRequiredSignIn)
      .then(addApi)
      .then(resolve);
  });
}

function addPathExistingApi(currentDefinition) {
  return new Promise(function (resolve, reject) {
    startEditing(currentDefinition)
      .then(askPaths)
      .then(addApi)
      .then(resolve);
  });
}


function dynamoApi(currentDefinition) {
  return new Promise(function (resolve, reject) {
    var tableList = Array.from(Object.keys(currentDefinition.nosql.tables));

    var dynamoApiQuestion = [
      {
        type: 'list',
        name: 'dynamoKey',
        message: 'Select Amazon DynamoDB table to connect to a CRUD API',
        choices: tableList
      }];

    return inquirer.prompt(dynamoApiQuestion).then(answers => {
      var prefixApiName = answers.dynamoKey;

      if (currentDefinition.cloudlogic.apis[prefixApiName + 'CRUD']) {
        console.log('Api already exists: ' + prefixApiName + 'CRUD');
        return;
      }

      var apiDefinition = {
        name: prefixApiName + 'CRUD',
        signInRequired: false,
        paths: {}
      }
      var lambdaFunctionName = prefixApiName.replace(/\-/g, '');
      lambdaFunctionName = lambdaFunctionName.replace(/\./g, '');
      lambdaFunctionName = lambdaFunctionName.replace(/\_/g, '');

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
      currentDefinition.table_name = answers.dynamoKey;
      resolve(dynamoApi2(currentDefinition));
    });
  });
}
function dynamoApi2(currentDefinition) {
  return new Promise(function (resolve, reject) {
    startQuestionaryDynamoApi(currentDefinition)
      .then(askRequiredSignIn)
      .then(addDynamoApi)
      .then(resolve);
  });
}

function main() {
  return new Promise(function (resolve, reject) {
    var currentDefinition = {
      cloudlogic: { apis: {} },
      yamlDefinition: {},
      nosql: {}
    }

    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
    let yamlDefinition = yamlOps.readYamlFileSync(backendProjectYamlFilePath);

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
      name: 'apiOptions',
      message: 'Select from one of the choices below.',
      choices: optionsChoices
    };

    console.log("\n\n" + "This feature will create an API using Amazon API Gateway and AWS Lambda. You can optionally have the lambda function perform CRUD operations against your Amazon DynamoDB table." + "\n\n");
    return inquirer.prompt(optionsQuestion).then(answers => {
      if (answers.apiOptions === 'add') {
        resolve(createApi(currentDefinition));
      } else if (answers.apiOptions === 'del') {
        resolve(deleteApi(currentDefinition));
      } else if (answers.apiOptions === 'edit') {
        resolve(editApi(currentDefinition));
      } else if (answers.apiOptions === 'dynamo') {
        resolve(dynamoApi(currentDefinition));
      }
    });
  });

}

exports.specify = function (projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  

  return new Promise(function (resolve, reject) {
    main()
      .then(resolve)
      .catch(reject);
  })
}

exports.onFeatureTurnOn = function (projectInfo, cloudProjectSpec) {
  _projectInfo = projectInfo
  cloudLogicFolder = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
  let pathKey = '/items';
  var functionFolder = pathLib.join(cloudLogicFolder, 'sampleLambda') + '/';

  if (!fs.existsSync(functionFolder)) {
    fs.mkdirSync(functionFolder);
    console.log('Adding lambda function code on \n' + functionFolder + '\n');

    functionGeneration.createLambdaFunctionFolder(lambdaPackageFolder, functionFolder, pathKey);

    console.log('\nTo test the api from the command line (after awsmobile push) use this commands');
    console.log('awsmobile cloud-api invoke', 'sampleCloudApi', '<method> /items [init]\n\n');
  }
}

exports.onFeatureTurnOff = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.invoke = function (projectInfo, args) {
  const invokeApi = require('./cloud-api/invoke');
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  cloudLogicFolder = pathLib.join(projectInfo.ProjectPath, 'awsmobilejs/backend/cloud-api')
  invokeApi.invoke(projectInfo, args);
}
