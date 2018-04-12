'use strict';

var inquirer = require('inquirer');
var fs = require('fs');
var yamlSchema = require('../../aws-operations/mobile-yaml-schema');
var yamlOps = require('../../aws-operations/mobile-yaml-ops');
const pathManager = require('../../utils/awsmobilejs-path-manager.js')
var pathLib = require('path');

// save project info
var _projectInfo = {};

var startQuestionary = (projectInfo) => new Promise(
  function (resolve, reject) {
    var currentDefinition = {
      'sign-in': new yamlSchema.dressObject({
        attributes: {
          enabled: false,
          'optional-sign-in': false
        },
        components: {},
        'backend-class': 'SignIn'
      })
    };

    // Read current analytics configuration
    let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
    let yamlDefinition = yamlOps.readYamlFileSync(backendProjectYamlFilePath);

    if (yamlDefinition['features']['sign-in']) {
      if (yamlDefinition['features']['sign-in']['attributes']) {
        currentDefinition['sign-in']['attributes'] =
          yamlDefinition['features']['sign-in']['attributes'];
      }
      if (yamlDefinition['features']['sign-in']['components']) {
        currentDefinition['sign-in']['components'] =
          yamlDefinition['features']['sign-in']['components'];
      }
    }
    currentDefinition.yamlDefinition = yamlDefinition;
    resolve(currentDefinition);
  }
);

var saveSettings = (currentDefinition) => {

  if (!currentDefinition['sign-in']['attributes']['enabled']) {
    delete currentDefinition.yamlDefinition['features']['sign-in'];
  } else {
    currentDefinition.yamlDefinition['features']['sign-in'] =
      currentDefinition['sign-in'];
  }
  let yaml = currentDefinition.yamlDefinition;
  let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
  yamlOps.writeYamlFileSync(yaml, backendProjectYamlFilePath);

  return Promise.resolve(currentDefinition);
}

var requireSignIn = (currentDefinition) => {
  var defaultSelection = 'optional';
  if (!currentDefinition['sign-in']['attributes']['optional-sign-in']) {
    defaultSelection = 'required';
  }

  var requireQuestion = {
    type: 'list',
    name: 'optionsRequireSignIn',
    message: 'Are users required to sign in to your app?',
    default: defaultSelection,
    choices: [
      {
        name: 'Optional',
        value: 'optional'
      },
      {
        name: 'Required',
        value: 'required'
      }
    ]
  };

  return inquirer.prompt(requireQuestion).then(answers => {
    switch (answers.optionsRequireSignIn) {
      case 'optional': currentDefinition['sign-in']['attributes']['optional-sign-in'] = true;
        break;
      case 'required': currentDefinition['sign-in']['attributes']['optional-sign-in'] = false;
        break;
    }
    return saveSettings(currentDefinition);
  });
}

var startDefaultSettings = (currentDefinition) => new Promise(
  function (resolve, reject) {
    currentDefinition['sign-in']['components']['sign-in-user-pools'] =
      new yamlSchema.dressObject({
        attributes: {
          'alias-attributes': ['email', 'phone_number'],
          'mfa-configuration': 'ON',
          'name': 'userpool',
          'password-policy': new yamlSchema.dressObject({
            'min-length': 8,
            'require-lower-case': true,
            'require-numbers': true,
            'require-symbols': true,
            'require-upper-case': true,
            'backend-class': 'ConvertibleMap'
          })
        },
        'backend-class': 'UserPoolsIdentityProvider',
      });
    currentDefinition['sign-in']['attributes']['enabled'] = true;
    currentDefinition['sign-in']['attributes']['optional-sign-in'] = true;
    resolve(currentDefinition);
  }
);

var enableDefault = (currentDefinition) => {
  return new Promise(function (resolve, reject) {
    startDefaultSettings(currentDefinition)
      .then(saveSettings)
      .then(resolve)
      .catch(reject);
  });
}

var advanceSettings = (currentDefinition) => {
  var methodOptions = [];

  // Add cognito user pools
  if (currentDefinition['sign-in']['components']['sign-in-user-pools']) {
    methodOptions.push({
      name: 'Cognito UserPools (currently enabled)',
      value: 'cognito'
    });
  } else {
    methodOptions.push({
      name: 'Cognito UserPools (currently disabled)',
      value: 'cognito'
    });
  }

  // Add facebook login
  if (currentDefinition['sign-in']['components']['sign-in-facebook']) {
    methodOptions.push({
      name: 'Facebook sign-in (currently enabled)',
      value: 'facebook'
    });
  } else {
    methodOptions.push({
      name: 'Facebook sign-in (currently disabled)',
      value: 'facebook'
    });
  }

  // Add Google login
  if (currentDefinition['sign-in']['components']['sign-in-google']) {
    methodOptions.push({
      name: 'Google sign-in (currently enabled)',
      value: 'google'
    });
  } else {
    methodOptions.push({
      name: 'Google sign-in (currently disabled)',
      value: 'google'
    });
  }

  var selectSignInQuestion = {
    type: 'list',
    name: 'selectSignInOptions',
    message: 'Which sign-in method you want to configure',
    choices: methodOptions
  };

  return inquirer.prompt(selectSignInQuestion).then(answers => {
    switch (answers.selectSignInOptions) {
      case 'cognito': return cognitoSignIn(currentDefinition);
      case 'facebook': return facebookSignIn(currentDefinition);
      case 'google': return googleSignIn(currentDefinition);
    }
  });
};

var checkCloudLogic = (currentDefinition) => {
  // Check if cloudlogic feature exists
  var requiresSignin = false;
  if (currentDefinition.yamlDefinition['features'] &&
    currentDefinition.yamlDefinition['features']['cloudlogic'] &&
    currentDefinition.yamlDefinition['features']['cloudlogic']['components']) {

    // Check all apis in case requires-signin
    let apis = currentDefinition.yamlDefinition['features']['cloudlogic']['components'];

    Object.keys(apis).map(api => {
      if (apis[api]['attributes'] && apis[api]['attributes']['requires-signin']) {
        requiresSignin = true;
      }
    });
  }
  return requiresSignin;
};

var disableSignInRestrictionOnApi = (currentDefinition) => {
  // Check if cloudlogic feature exists
  if (!currentDefinition.yamlDefinition['features'] ||
    !currentDefinition.yamlDefinition['features']['cloudlogic'] ||
    !currentDefinition.yamlDefinition['features']['cloudlogic']['components']) {
    return currentDefinition;
  } else {
    // All apis will not requires-signin
    let apis = currentDefinition.yamlDefinition['features']['cloudlogic']['components'];
    Object.keys(apis).map(api => {
      if (apis[api]['attributes'] && apis[api]['attributes']['requires-signin']) {
        apis[api]['attributes']['requires-signin'] = false;
      }
    });
  }
};

var disable = (currentDefinition) => {
  var disableQuestion = {
    type: 'confirm',
    name: 'sureDisable',
    message: 'Are you sure you want to disable Sign-In',
    default: false
  };
  return inquirer.prompt(disableQuestion).then(answer => {
    if (!answer.sureDisable) {
      return Promise.resolve(currentDefinition);
    } else {
      let cloudLogicSignInRestricted = checkCloudLogic(currentDefinition);

      currentDefinition['sign-in']['attributes']['enabled'] = false;
      if (!cloudLogicSignInRestricted) {
        return saveSettings(currentDefinition);
      } else {
        var disableRestrictedApiQuestion = {
          type: 'confirm',
          name: 'sureDisableRestrictedApi',
          message: 'There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?',
          default: false
        };
        return inquirer.prompt(disableRestrictedApiQuestion).then(restrictionAnswer => {
          if (restrictionAnswer.sureDisableRestrictedApi) {
            disableSignInRestrictionOnApi(currentDefinition);
            return saveSettings(currentDefinition);
          } else {
            return Promise.resolve(currentDefinition);
          }
        });
      }
    }
  });
};

var cognitoSignIn = (currentDefinition) => {
  if (currentDefinition['sign-in']['components']['sign-in-user-pools']) {
    var cognitoQuestion = {
      type: 'list',
      name: 'cognitoSignInOptions',
      message: 'Cognito UserPools enabled, what do you want to do next',
      choices: [
        {
          name: 'Disable Cognito UserPools',
          value: 'disable'
        }
      ],
      default: 'disable'
    };

    return inquirer.prompt(cognitoQuestion).then(answers => {
      switch (answers.cognitoSignInOptions) {
        case 'disable': return disableCognito(currentDefinition);
      }
    });
  } else {
    return cognitoSettings(currentDefinition);
  }
};

var disableCognito = (currentDefinition) => {
  var disableQuestion = {
    type: 'confirm',
    name: 'disableCognito',
    message: 'Are you sure you want to disable Cognito UserPools',
    default: false
  };
  return inquirer.prompt(disableQuestion).then(answer => {
    if (!answer.disableCognito) {
      return Promise.resolve(currentDefinition);
    } else {
      let cloudLogicSignInRestricted = checkCloudLogic(currentDefinition) &&
        oneSignInRemaining(currentDefinition);

      if (!cloudLogicSignInRestricted) {
        if (oneSignInRemaining(currentDefinition)) {
          currentDefinition['sign-in']['attributes']['enabled'] = false;
        }
        delete currentDefinition['sign-in']['components']['sign-in-user-pools'];
        return saveSettings(currentDefinition);
      } else {
        var disableRestrictedApiQuestion = {
          type: 'confirm',
          name: 'disableRestrictedApiQuestion',
          message: 'There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?',
          default: false
        };
        return inquirer.prompt(disableRestrictedApiQuestion).then(restrictionAnswer => {
          if (restrictionAnswer.disableRestrictedApiQuestion) {
            delete currentDefinition['sign-in']['components']['sign-in-user-pools'];
            currentDefinition['sign-in']['attributes']['enabled'] = false;
            disableSignInRestrictionOnApi(currentDefinition);
            return saveSettings(currentDefinition);
          } else {
            return Promise.resolve(currentDefinition);
          }
        });
      }
    }
  });
};

var startCognitoQuestionary = (currentDefinition) => new Promise(
  function (resolve, reject) {
    currentDefinition['sign-in']['components']['sign-in-user-pools'] =
      new yamlSchema.dressObject({
        attributes: {
        'alias-attributes': ['email', 'phone_number'],
        'mfa-configuration': 'ON',
        'name': 'userpool',
        'password-policy': new yamlSchema.dressObject({
          'min-length': 8,
          'require-lower-case': true,
          'require-numbers': true,
          'require-symbols': true,
          'require-upper-case': true,
          'backend-class': 'ConvertibleMap'
        })
      },
      'backend-class': 'UserPoolsIdentityProvider'
    });
    currentDefinition['sign-in']['attributes']['enabled'] = true;
    resolve(currentDefinition);
  }
);

var cognitoSettings = (currentDefinition) => {
  return new Promise(function (resolve, reject) {
    startCognitoQuestionary(currentDefinition)
      .then(usersLoginQuestionary)
      .then(mfaConfiguration)
      .then(passwordPolicy)
      .then(saveSettings)
      .then(resolve)
      .catch(reject);
  })
};

var usersLoginQuestionary = (currentDefinition) => {
  var userpoolsQuestion = {
    type: 'checkbox',
    name: 'selectionUserLogin',
    message: 'How are users going to login',
    choices: [
      {
        name: 'Email',
        value: 'email'
      },
      {
        name: 'Username',
        value: 'preferred_username'
      },
      {
        name: 'Phone number (required for multifactor authentication)',
        value: 'phone_number'
      }
    ],
    default: ['email']
  };

  return inquirer.prompt(userpoolsQuestion).then(answers => {
    if (answers.selectionUserLogin.length === 0) {
      console.error('You must specify at least one type');
      return usersLoginQuestionary(currentDefinition);
    } else {
      currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['alias-attributes'] = answers.selectionUserLogin;
      return Promise.resolve(currentDefinition);
    }
  });

};

var mfaConfiguration = (currentDefinition) => {
  var phoneRequired = false;
  currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['alias-attributes'].forEach(type => {
    if (type === 'phone_number') {
      phoneRequired = true;
    }
  });
  if (!phoneRequired) {
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['mfa-configuration'] = "OFF";
    return currentDefinition;
  } else {
    var mfaQuestion = {
      type: 'list',
      name: 'optionsMfa',
      message: 'MFA authentication',
      choices: [
        {
          name: 'disabled',
          value: 'OFF'
        },
        {
          name: 'optional',
          value: 'OPTIONAL'
        },
        {
          name: 'required',
          value: 'ON'
        }
      ],
      default: 'OFF'
    };

    return inquirer.prompt(mfaQuestion).then(answer => {
      currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['mfa-configuration'] = answer.optionsMfa;
      return Promise.resolve(currentDefinition);
    });
  }
};

var passwordPolicy = (currentDefinition) => {
  var passwordQuestions = [
    {
      type: 'input',
      name: 'password_length',
      message: 'Password minimum length (number of characters)',
      default: 8,
      validate: function (value) {
        var length = Number(value);
        if (isNaN(length) || length < 0 || !Number.isInteger(length)) {
          return 'Invalid length';
        }
        return true;
      }
    },
    {
      type: 'checkbox',
      name: 'selectionPassword',
      message: 'Password character requirements',
      choices: [
        {
          name: 'uppercase',
          value: 'require-upper-case'
        },
        {
          name: 'lowercase',
          value: 'require-lower-case'
        },
        {
          name: 'numbers',
          value: 'require-numbers'
        },
        {
          name: 'special characters',
          value: 'require-symbols'
        }
      ],
      default: ['require-upper-case', 'require-lower-case', 'require-numbers']
    }
  ];

  return inquirer.prompt(passwordQuestions).then(answers => {
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy']['min-length'] = Number(answers.password_length);
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy']['require-numbers'] = false;
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy']['require-lower-case'] = false;
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy']['require-upper-case'] = false;
    currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy']['require-symbols'] = false;
    answers.selectionPassword.forEach(requirement => {
      currentDefinition['sign-in']['components']['sign-in-user-pools']['attributes']['password-policy'][requirement] = true;
    });
    return Promise.resolve(currentDefinition);
  });

};

var facebookSignIn = (currentDefinition) => {
  var facebookQuestion = {
    type: 'list',
    name: 'facebookSignInOptions',
    message: 'Facebook sign-in enabled, what do you want to do next',
    choices: [
      {
        name: 'Edit facebook sign-in settings',
        value: 'settings'
      },
      {
        name: 'Disable facebook sign-in',
        value: 'disable'
      }
    ]
  };

  if (currentDefinition['sign-in']['components']['sign-in-facebook']) {
    return inquirer.prompt(facebookQuestion).then(answers => {
      switch (answers.facebookSignInOptions) {
        case 'settings': return facebookSettings(currentDefinition);
        case 'disable': return disableFacebook(currentDefinition);
      }
    });
  } else {
    return facebookSettings(currentDefinition);
  }
}

var googleSignIn = (currentDefinition) => {
  var googleQuestion = {
    type: 'list',
    name: 'googleSignInOptions',
    message: 'Google sign-in enabled, what do you want to do next',
    choices: [
      {
        name: 'Edit google sign-in settings',
        value: 'settings'
      },
      {
        name: 'Disable google sign-in',
        value: 'disable'
      }
    ]
  };

  if (currentDefinition['sign-in']['components']['sign-in-google']) {
    return inquirer.prompt(googleQuestion).then(answers => {
      switch (answers.googleSignInOptions) {
        case 'settings': return googleSettings(currentDefinition);
        case 'disable': return disableGoogle(currentDefinition);
      }
    });
  } else {
    return googleSettings(currentDefinition);
  }
};

var googleSettings = (currentDefinition) => {
  var googleQuestion = [
    {
      type: 'input',
      name: 'googleWebapp',
      message: 'Google Web App Client ID',
      validate: function (value) {
        if (value.length === 0) {
          return 'You must enter a valid Google Web App Client ID';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'androidClientId',
      message: 'Google Android Client ID',
      validate: function (value) {
        if (value.length === 0) {
          return 'You must enter a valid Google Android Client ID';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'iosClientId',
      message: 'Google iOS Client ID',
      validate: function (value) {
        if (value.length === 0) {
          return 'You must enter a valid Google iOS Client ID';
        }
        return true;
      }
    },];

  return inquirer.prompt(googleQuestion).then(answer => {
    currentDefinition['sign-in']['components']['sign-in-google'] =
      new yamlSchema.dressObject({
        attributes: {
        'open-id-connect-audience-webapp': answer.googleWebapp,
        'open-id-connect-audience-ios': answer.iosClientId,
        'open-id-connect-audience-android': answer.androidClientId,
        'open-id-provider-url': 'https://accounts.google.com',
      },
      'backend-class': 'OpenIDConnectIdentityProvider'
    });
    currentDefinition['sign-in']['attributes']['enabled'] = true;
    return saveSettings(currentDefinition);
  });
};

var disableGoogle = (currentDefinition) => {
  var disableQuestion = {
    type: 'confirm',
    name: 'disableGoogle',
    message: 'Are you sure you want to disable Google login',
    default: false
  };
  return inquirer.prompt(disableQuestion).then(answer => {
    if (!answer.disableGoogle) {
      return Promise.resolve(currentDefinition);
    } else {
      let cloudLogicSignInRestricted = checkCloudLogic(currentDefinition) &&
        oneSignInRemaining(currentDefinition);

      if (!cloudLogicSignInRestricted) {
        if (oneSignInRemaining(currentDefinition)) {
          currentDefinition['sign-in']['attributes']['enabled'] = false;
        }
        delete currentDefinition['sign-in']['components']['sign-in-google'];
        return saveSettings(currentDefinition);
      } else {
        var disableRestrictedApiQuestion = {
          type: 'confirm',
          name: 'disableRestrictedApiQuestion',
          message: 'There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?',
          default: false
        };
        return inquirer.prompt(disableRestrictedApiQuestion).then(restrictionAnswer => {
          if (restrictionAnswer.disableRestrictedApiQuestion) {
            delete currentDefinition['sign-in']['components']['sign-in-google'];
            currentDefinition['sign-in']['attributes']['enabled'] = false;
            disableSignInRestrictionOnApi(currentDefinition);
            return saveSettings(currentDefinition);
          } else {
            return Promise.resolve(currentDefinition);
          }
        });
      }
    }
  });
};

var facebookSettings = (currentDefinition) => {
  var facebookQuestion = {
    type: 'input',
    name: 'facebookAppId',
    message: 'Facebook App ID',
    validate: function (value) {
      if (value.length === 0) {
        return 'You must enter a Facebook App ID';
      }
      return true;
    }
  };

  return inquirer.prompt(facebookQuestion).then(answer => {
    currentDefinition['sign-in']['components']['sign-in-facebook'] =
      new yamlSchema.dressObject({
        attributes: {
        'provider-id': answer.facebookAppId,
        'provider-name': 'facebook'
      },
      'backend-class': 'StandardIdentityProvider'});
    currentDefinition['sign-in']['attributes']['enabled'] = true;
    return saveSettings(currentDefinition);
  });
};

var oneSignInRemaining = (currentDefinition) => {
  return Object.keys(currentDefinition['sign-in']['components']).length == 1;
};

var disableFacebook = (currentDefinition) => {
  var disableQuestion = {
    type: 'confirm',
    name: 'disableFacebook',
    message: 'Are you sure you want to disable Facebook login',
    default: false
  };
  return inquirer.prompt(disableQuestion).then(answer => {
    if (!answer.disableFacebook) {
      return Promise.resolve(currentDefinition);
    } else {
      let cloudLogicSignInRestricted = checkCloudLogic(currentDefinition) &&
        oneSignInRemaining(currentDefinition);

      if (!cloudLogicSignInRestricted) {
        if (oneSignInRemaining(currentDefinition)) {
          currentDefinition['sign-in']['attributes']['enabled'] = false;
        }
        delete currentDefinition['sign-in']['components']['sign-in-facebook'];
        return saveSettings(currentDefinition);
      } else {
        var disableRestrictedApiQuestion = {
          type: 'confirm',
          name: 'disableRestrictedApiQuestion',
          message: 'There are API with restriction to sign-in users, if you agree this will remove that restriction. Continue?',
          default: false
        };
        return inquirer.prompt(disableRestrictedApiQuestion).then(restrictionAnswer => {
          if (restrictionAnswer.disableRestrictedApiQuestion) {
            delete currentDefinition['sign-in']['components']['sign-in-facebook'];
            currentDefinition['sign-in']['attributes']['enabled'] = false;
            disableSignInRestrictionOnApi(currentDefinition);
            return saveSettings(currentDefinition);
          } else {
            return Promise.resolve(currentDefinition);
          }
        });
      }
    }
  });
};

function main(currentDefinition) {

  var disableQuestion = {
    type: 'list',
    name: 'mainOptions',
    message: 'Sign-in is currently disabled, what do you want to do next',
    choices: [
      {
        name: 'Enable sign-in with default settings',
        value: 'enable'
      },
      {
        name: 'Go to advance settings',
        value: 'advance'
      }
    ]
  };
  var optionsQuestion = {};

  if (currentDefinition['sign-in']['attributes']['enabled']) {
    var authChoices = [
      {
        name: 'Configure Sign-in to be optional (Currently set to required)',
        value: 'require'
      },
      {
        name: 'Go to advance settings',
        value: 'advance'
      },
      {
        name: 'Disable sign-in',
        value: 'disable'
      }];
    if (currentDefinition['sign-in']['attributes']['optional-sign-in']) {
      authChoices[0]['name'] = 'Configure Sign-in to be required (Currently set to optional)';
    }
    var enableQuestion = {
      type: 'list',
      name: 'mainOptions',
      message: 'Sign-in is currently enabled, what do you want to do next',
      choices: authChoices
    };
    optionsQuestion = enableQuestion;
  } else {
    optionsQuestion = disableQuestion;
  }
  return inquirer.prompt(optionsQuestion).then(answers => {
    switch (answers.mainOptions) {
      case 'require': return requireSignIn(currentDefinition);
      case 'advance': return advanceSettings(currentDefinition);
      case 'enable': return enableDefault(currentDefinition);
      case 'disable': return disable(currentDefinition);
    }
  });

}

exports.specify = function (projectInfo) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  return new Promise(function (resolve, reject) {
    startQuestionary(projectInfo)
      .then(main)
      .then(currentDefinition => {
        resolve(currentDefinition);
      })
      .catch(reject);
  })
}

exports.onFeatureTurnOn = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  var currentDefinition = {};
}

exports.onFeatureTurnOff = function (projectInfo, cloudProjectSpec) {
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
  var currentDefinition = {
    'sign-in': new yamlSchema.dressObject({
      attributes: {
        enabled: false,
        'optional-sign-in': false
      },
      components: {},
      'backend-class': 'SignIn'
    })
  };

  // Read current analytics configuration
  let backendProjectYamlFilePath = pathManager.getBackendSpecProjectYmlFilePath(_projectInfo.ProjectPath);
  let yamlDefinition = yamlOps.readYamlFileSync(backendProjectYamlFilePath);

  if (yamlDefinition['features']['sign-in']) {
    if (yamlDefinition['features']['sign-in']['attributes']) {
      currentDefinition['sign-in']['attributes'] =
        yamlDefinition['features']['sign-in']['attributes'];
    }
    if (yamlDefinition['features']['sign-in']['components']) {
      currentDefinition['sign-in']['components'] =
        yamlDefinition['features']['sign-in']['components'];
    }
  }
  currentDefinition.yamlDefinition = yamlDefinition;
  disableSignInRestrictionOnApi(currentDefinition);
  saveSettings(currentDefinition);

}
