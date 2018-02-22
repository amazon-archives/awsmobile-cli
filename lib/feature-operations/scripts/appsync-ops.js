"use strict";

const inquirer = require('inquirer');
const fs = require('fs');
const yamlSchema = require('../../aws-operations/mobile-yaml-schema');
const yamlOps = require('../../aws-operations/mobile-yaml-ops');
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
// save project info from 
var _projectInfo = {};

exports.specify = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.onFeatureTurnOn = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.onFeatureTurnOff = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
}