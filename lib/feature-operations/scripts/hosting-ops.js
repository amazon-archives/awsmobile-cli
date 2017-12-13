"use strict";

var inquirer = require('inquirer');
var fs = require('fs');
var mhYamlLib = require('./lib/mh-yaml-lib.js');

// save project info
var _projectInfo = {};

var startQuestionary = () => new Promise(
  function(resolve, reject) {
    var currentDefinition = {
      'content-delivery': {
        enabled: false
      }
    };

    mhYamlLib.load(_projectInfo, (yamlDefinition) => {
      //console.log(JSON.stringify(yamlDefinition, null, 2));
      if (yamlDefinition['features']['content-delivery']) {
        currentDefinition['content-delivery']['enabled'] = true;
      }
      currentDefinition.yamlDefinition = yamlDefinition;
    });
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
      new mhYamlLib.ContentDelivery({
        attributes: {
          enable: true,
          visibility: 'public-global'
        },
        components: {
          release: new mhYamlLib.Bucket()
        }
      });
  }
  let yaml = currentDefinition.yamlDefinition;
  mhYamlLib.save(_projectInfo, yaml, () => {
    console.log('Done');;
  });
  return Promise.resolve(currentDefinition['content-delivery']);
}

function main() {
  startQuestionary()
  .then(askEnableHosting)
  .then(saveSettings)
  .catch(console.log.bind(null, 'ERROR'));
}

exports.specify = function(projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  main();
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}