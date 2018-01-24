var inquirer = require('inquirer');
var fs = require('fs');
var yamlSchema = require('../../aws-operations/mobile-yaml-schema');
var yamlOps = require('../../aws-operations/mobile-yaml-ops');
const pathManager = require('../../utils/awsmobilejs-path-manager.js')

// save project info
var _projectInfo = {};

var startQuestionary = () => new Promise(
  function(resolve, reject) {
    var currentDefinition = {
      'user-files': {
        enabled: false
      }
    };

    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
    let yamlDefinition = yamlOps.readYamlFileSync(backendProjectYamlFilePath);
    
      if (yamlDefinition['features']['user-files']) {
        currentDefinition['user-files']['enabled'] = true;
      }
      currentDefinition.yamlDefinition = yamlDefinition;
      currentDefinition.projectInfo = _projectInfo;
      resolve(currentDefinition);
    
  });

var askEnableUserFiles = (currentDefinition) => {

  let defaultMessage = 'This feature is for storing user files in the cloud, would you like to enable it?';
  if (currentDefinition['user-files'].enabled) {
    defaultMessage = 'User files storage is enabled, do you want to keep it enabled?'
  }
  
  var enableQuestion = {
    type: 'confirm',
    name: 'enableUserData',
    message: defaultMessage,
    default: true
  }

  return inquirer.prompt(enableQuestion).then(answers => {
    currentDefinition['user-files']['enabled'] = answers.enableUserData;
    return currentDefinition;
  });
}

var saveSettings = (currentDefinition) => {

  if (currentDefinition['user-files']['enabled']) {
    currentDefinition.yamlDefinition['features']['user-files'] = new yamlSchema.dressObject({attributes: {enabled: true, 'wildcard-cors-policy': true}, 'backend-class': 'UserFiles'});
  } else {
    delete currentDefinition.yamlDefinition['features']['user-files'];
    delete currentDefinition.yamlDefinition['features']['user-profiles'];
  }
  let yaml = currentDefinition.yamlDefinition;
  let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
  yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);

  return Promise.resolve(currentDefinition);
}

exports.specify = (projectInfo) => {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  return new Promise(function(resolve,reject) { 
      startQuestionary()
      .then(askEnableUserFiles)
      .then(saveSettings)
      .then(resolve)
      .catch(reject);
  })
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}