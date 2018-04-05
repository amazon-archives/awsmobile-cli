"use strict";

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
      'content-delivery': {
        enabled: false
      }
    };

    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
    let yamlDefinition = yamlOps.readYamlFileSync(backendProjectYamlFilePath);

    if (yamlDefinition['features']['content-delivery']) {
      currentDefinition['content-delivery']['enabled'] = true;
    }
    currentDefinition.yamlDefinition = yamlDefinition;
    resolve(currentDefinition);
      
  }
);

var askEnableHosting = (currentDefinition) => {

  let defaultMessage = 'Currently Hosting is disabled, do you want to host your web app including a global CDN?';
  if (currentDefinition['content-delivery'].enabled) {
    defaultMessage = 'Currently Hosting is enabled, do you want to keep it enabled?'
  }

  var enableQuestion = {
    type: 'confirm',
    name: 'enable',
    message: defaultMessage,
    default: true
  }

  return inquirer.prompt(enableQuestion).then(answers => {
    currentDefinition['content-delivery']['enabled'] = answers.enable;
    return currentDefinition;
  });
}

var saveSettings = (currentDefinition) => {

  if (!currentDefinition['content-delivery']['enabled']) {
    delete currentDefinition.yamlDefinition['features']['content-delivery'];
  } else {
    currentDefinition.yamlDefinition['features']['content-delivery'] =
      new yamlSchema.dressObject({
        attributes: {
          enabled: true,
          visibility: 'public-global'
        },
        'backend-class': 'ContentDelivery',
        components: {
          release: new yamlSchema.dressObject({'backend-class': 'Bucket' })
        }
      });
  }
  let yaml = currentDefinition.yamlDefinition;
  let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
  yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);

  return Promise.resolve(currentDefinition);
}

function main() {
  startQuestionary()
  .then(askEnableHosting)
  .then(saveSettings)
  .catch(console.log.bind(null, 'ERROR'));
}

exports.specify = function(projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  return new Promise(function(resolve,reject) {
    startQuestionary()
    .then(askEnableHosting)
    .then(saveSettings)
    .then(resolve)
    .catch(reject);
  });
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}