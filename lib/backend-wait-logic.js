/*
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
*/
"use strict";
const chalk = require('chalk')
const ora = require('ora')

const awsExceptionHandler = require('./aws-operations/aws-exception-handler.js')
const awsClient = require('./aws-operations/aws-client.js')
const opsProject = require('./backend-operations/ops-project.js')
const opsCloudApi = require('./backend-operations/ops-cloud-api.js')

const maxCloudApiWaitLoop = 100 //each wait is 5 seconds

function wait(backendDetails, awsDetails, callback){

    let mobile = awsClient.Mobile(awsDetails)
    let param = {
        projectId: backendDetails.projectId,
        syncFromResources: true
    }
    describeUntilNormal(mobile, param, awsDetails, callback, true)
}

function describeUntilNormal(mobile, param, awsDetails, callback, waitForStacks) {
    mobile.describeProject(param, function(err,data){
      if(err){
        // Describe call failed
        console.log(chalk.red('wait interrupted'))
        awsExceptionHandler.handleMobileException(err)
        callback({code: 0}, backendDetails)
      }else{
        // Describe call success
        let backendDetails = data.details
        if(!opsProject.isInNormalState(backendDetails)){
          // Project not yet in normal state. Wait for it...
          setTimeout(function(){
              describeUntilNormal(mobile, param, awsDetails, callback)
          }, 5000)
        }else{
          // Project in normal state.
          if (waitForStacks) {
            let stacks =
              backendDetails.resources.filter(resource => resource.type === "AWS::CloudFormation::Stack")
            let cloudFormation = awsClient.CloudFormation(awsDetails)
            console.log("\nchecking cloudformation stacks...")
            waitForCloudFormationStacks(cloudFormation, stacks, awsDetails, backendDetails, callback)
          } else {
            callback(null, backendDetails)
          }
        }
      }
    })
}

function waitForCloudFormationStacks(cloudFormation, stacks, awsDetails, backendDetails, callback) {
  if (stacks.length <= 0){
    // Re-sync one last time
    let mobile = awsClient.Mobile(awsDetails)
    let param = {
        projectId: backendDetails.projectId,
        syncFromResources: true
    }

    describeUntilNormal(mobile, param, awsDetails, callback, false)
    return
  }

  let stack = stacks.shift()

  // Do 'Development' stack last
  if ('Development' === stack.name && stacks.length > 0) {
    let developmentStack = stack
    stack = stacks.shift()
    stacks.push(developmentStack)
  }

  let params = {
    StackName: stack.arn ? stack.arn : stack.name
  }

  cloudFormation.describeStacks(params, function(err, data) {
    if (err) {
      console.log(chalk.red('failed to fetch state of CloudFormation stack ' + stack.name))
      awsExceptionHandler.handleMobileException(err)
      callback({code: 0}, backendDetails)
    } else {
      let status = data.Stacks[0].StackStatus;

      let stackStatusMessage = "stack \'" + stack.name + "\' = " + status + "\n"

      if (!stack.lastStatusMessage || stack.lastStatusMessage !== stackStatusMessage) {
        console.log(stackStatusMessage);
        stack.lastStatusMessage = stackStatusMessage;
      }

      let stateGroup = opsCloudApi.getStateGroup(status)
      //status group:
      //-2: unrecognized status
      //-1: not yet deployed
      // 0: in-progress
      // 1: terminal_complate
      // 2: terminal_failed
      if(stateGroup < -1){
          console.log(chalk.red('wait interrupted') + ' unrecognized status code: ' + status)
          callback({code: -2}, backendDetails)
          return
      }else if(stateGroup == -1){
        // Next stack...
        waitForCloudFormationStacks(cloudFormation, stacks, awsDetails, backendDetails, callback)
      }else if( stateGroup == 0){
        // Stack in-progress, display events...
        readStackEvents(cloudFormation, stacks, stack, null, awsDetails, backendDetails, callback)
      }else if (stateGroup == 1){
        // Next stack...
        waitForCloudFormationStacks(cloudFormation, stacks, awsDetails, backendDetails, callback)
      }else{
        // Stack failed
        callback({code: 2}, backendDetails)
      }
    }
  })
}

function readStackEvents(cloudFormation, stacks, stack, token, awsDetails, backendDetails, callback) {

  let params = {
    NextToken: token,
    StackName: stack.arn ? stack.arn : stack.name
  }

  cloudFormation.describeStackEvents(params, function(err, data) {
    if (err) {
      console.log(chalk.red('failed to fetch state of CloudFormation stack ' + stack.name))
      awsExceptionHandler.handleMobileException(err)
      callback({code: 0}, backendDetails)
    } else {
      data.StackEvents.reverse();
      data.StackEvents.forEach(event => {
        let eventText = event.Timestamp +
          "\n" +
          event.LogicalResourceId +
          " (" +
          event.ResourceType +
          ")\n" +
          "Status : " +
          event.ResourceStatus

        if (event.ResourceStatusReason) {
          eventText = eventText + "\nReason : " + event.ResourceStatusReason;
        }

        eventText = eventText + "\n";

        if (!stack.shown) {
          stack.shown = [];
        }

        if (!stack.shown[eventText]) {
          console.log(eventText);
          stack.shown[eventText] = 1;
        }
      })

      // Don't need to fetch next token unless want entire history of events.
      // Newest events are always first in results.

      setTimeout(function(){
        // Re-examine same stack...
        stacks.unshift(stack);
        waitForCloudFormationStacks(cloudFormation, stacks, awsDetails, backendDetails, callback)
      }, 2000)
    }
  })
}

module.exports = {
    wait
}
