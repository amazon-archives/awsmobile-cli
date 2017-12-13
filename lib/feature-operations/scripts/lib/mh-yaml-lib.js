"use strict";

var fs = require('fs');
var yaml = require('js-yaml');
var path = require('path');

var yamlFile = '';// = getYamlFilePath();

// // Backend yaml file location
// function getYamlFilePath() {
//   let cloudFolder = path.normalize(path.join(__dirname, '../../../backend'));
//   return path.join(cloudFolder, 'mobile-hub-project.yml');
// }

// MobileHub Database type
function Database(database) {
  this.components = database.components;
}

// MobileHub DatabaseNoSQL type
function DatabaseNoSQL(nosql) {
  this.tables = nosql.tables;
}

// MobileHub NoSQLTable type
function NoSQLTable(attributes, hashKeyName, hashKeyType, rangeKeyName,
  rangeKeyType, tableName, tablePrivacy, indexes) {
  this.attributes = attributes;
  this.hashKeyName = hashKeyName;
  this.hashKeyType = hashKeyType;
  this.rangeKeyName = rangeKeyName;
  this.rangeKeyType = rangeKeyType;
  this.tableName = tableName;
  this.tablePrivacy = tablePrivacy;
  this.indexes = indexes;
}

// MobileHub NoSQLIndex type
function NoSQLIndex(hashKeyName, hashKeyType, rangeKeyName, rangeKeyType, indexName) {
  this.hashKeyName = hashKeyName;
  this.hashKeyType = hashKeyType;
  this.rangeKeyName = rangeKeyName;
  this.rangeKeyType = rangeKeyType;
  this.indexName = indexName;
}

// MobileHub UserFiles
function UserFiles(attributes) {
  this.attributes = attributes;
}

// MobileHub UserSettings
function UserSettings(attributes) {
  this.attributes = attributes;
}

// MobileHub CloudLogic
function CloudLogic(cloud) {
  this.components = cloud.components;
}

// MobileHub API
function Api(attributes, paths) {
  this.attributes = attributes;
  this.paths = paths;
}

// MobileHub Function
function MHFunction(name, codeFilename, handler, enableCORS, runtime, environment) {
  this.name = name;
  this.codeFilename = codeFilename;
  this.handler = handler;
  this.enableCORS = enableCORS;
  this.runtime = runtime;
  this.environment = environment;

  if (this.codeFilename === undefined) {
    delete this.codeFilename;
  }

  if (this.enableCORS === undefined) {
    delete this.enableCORS;
  }

  if (this.runtime === undefined) {
    delete this.runtime;
  }

  if (this.handler === undefined) {
    delete this.handler;
  }
}

// MobileHub Bots
function Bots(bots) {
  this.components = bots.components;
}

// MobileHub Bot
function Bot(attributes) {
  this.attributes = attributes;
}

// MobileHub Pinpoint
function Pinpoint(pinpoint) {
  this.components = pinpoint.components;
}

// MobileHub PinpointAnalytics
function PinpointAnalytics() {
}

// MobileHub PinpointMessaging
function PinpointMessaging(attributes) {
  this.attributes = attributes;
}

// MobileHub SignIn
function SignIn(signin) {
  this.attributes = signin.attributes;
  this.components = signin.components;
}

// MobileHub StandardIdentityProvider
function StandardIdentityProvider(attributes) {
  this.attributes = attributes;
}

// MobileHub OpenIDConnectIdentityProvider
function OpenIDConnectIdentityProvider(attributes) {
  this.attributes = attributes;
}

// MobileHub UserPoolsIdentityProvider
function UserPoolsIdentityProvider(attributes) {
  this.attributes = attributes;
}

// MobileHub ConvertibleMap
function ConvertibleMap(map) {
  Object.keys(map).map(key => {
    this[key] = map[key];
  });
}

// MobileHub ContentDelivery (Hosting and Streaming)
function ContentDelivery(content) {
  this.attributes = content.attributes;
  this.components = content.components;
}

// MobileHub Bucket
function Bucket() {
}

// MobileHub Upload
function Upload(fileName, targetS3Bucket) {
  this.fileName = fileName;
  this.targetS3Bucket = targetS3Bucket;
}

// MobileHub PushPlatform
function PushPlatform(attributes) {
  this.attributes = attributes;
}

// MobileHub Project type
function Project(features, name, region, uploads, sharedComponents) {
  this.features = features;
  this.name = name;
  this.region = region;
  this.uploads = uploads;
  this.sharedComponents = sharedComponents;
}

// Yaml types

var PushPlatformType = new yaml.Type('!com.amazonaws.mobilehub.v0.PushPlatform', {
  kind: 'mapping',
  construct: function (data) {
    return new PushPlatform(data.attributes);
  },
  instanceOf: PushPlatform
});

var UploadType = new yaml.Type('!com.amazonaws.mobilehub.v0.Upload', {
  kind: 'mapping',
  construct: function (data) {
    return new Upload(data.fileName, data.targetS3Bucket);
  },
  instanceOf: Upload
});

var ContentDeliveryType = new yaml.Type('!com.amazonaws.mobilehub.v0.ContentDelivery', {
  kind: 'mapping',
  construct: function (data) {
    return new ContentDelivery(data);
  },
  instanceOf: ContentDelivery
});

var BucketType = new yaml.Type('!com.amazonaws.mobilehub.v0.Bucket', {
  kind: 'mapping',
  construct: function (data) {
    return new Bucket();
  },
  instanceOf: Bucket
})

var ConvertibleMapType = new yaml.Type('!com.amazonaws.mobilehub.ConvertibleMap', {
  kind: 'mapping',
  construct: function (data) {
    return new ConvertibleMap(data);
  },
  instanceOf: ConvertibleMap
});

var UserPoolsIdentityProviderType = new yaml.Type('!com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider', {
  kind: 'mapping',
  construct: function (data) {
    return new UserPoolsIdentityProvider(data.attributes);
  },
  instanceOf: UserPoolsIdentityProvider
});

var OpenIDConnectIdentityProviderType = new yaml.Type('!com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider', {
  kind: 'mapping',
  construct: function (data) {
    return new OpenIDConnectIdentityProvider(data.attributes);
  },
  instanceOf: OpenIDConnectIdentityProvider
});

var StandardIdentityProviderType = new yaml.Type('!com.amazonaws.mobilehub.v0.StandardIdentityProvider', {
  kind: 'mapping',
  construct: function (data) {
    return new StandardIdentityProvider(data.attributes);
  },
  instanceOf: StandardIdentityProvider
});

var SignInType = new yaml.Type('!com.amazonaws.mobilehub.v0.SignIn', {
  kind: 'mapping',
  construct: function (data) {
    if (!data.attributes) {
      data.attributes = {};
    }
    if (!data.components) {
      data.components = {};
    }
    return new SignIn(data);
  },
  instanceOf: SignIn
});

var PinpointType = new yaml.Type('!com.amazonaws.mobilehub.v0.Pinpoint', {
  kind: 'mapping',
  construct: function (data) {
    return new Pinpoint(data);
  },
  instanceOf: Pinpoint
});

var PinpointAnalyticsType = new yaml.Type('!com.amazonaws.mobilehub.v0.PinpointAnalytics', {
  kind: 'mapping',
  construct: function (data) {
    return new PinpointAnalytics();
  },
  instanceOf: PinpointAnalytics
});

var PinpointMessagingType = new yaml.Type('!com.amazonaws.mobilehub.v0.PinpointMessaging', {
  kind: 'mapping',
  construct: function (data) {
    return new PinpointMessaging(data.attributes);
  },
  instanceOf: PinpointMessaging
});

var BotsType = new yaml.Type('!com.amazonaws.mobilehub.v0.Bots', {
  kind: 'mapping',
  construct: function (data) {
    return new Bots(data);
  },
  instanceOf: Bots
});

var BotType = new yaml.Type('!com.amazonaws.mobilehub.v0.Bot', {
  kind: 'mapping',
  construct: function (data) {
    return new Bot(data.attributes);
  },
  instanceOf: Bot
});

var UserSettingsType = new yaml.Type('!com.amazonaws.mobilehub.v0.UserSettings', {
  kind: 'mapping',
  construct: function (data) {
    return new UserSettings(data.attributes);
  },
  instanceOf: UserSettings
});

var UserFilesType = new yaml.Type('!com.amazonaws.mobilehub.v0.UserFiles', {
  kind: 'mapping',
  construct: function (data) {
    return new UserFiles(data.attributes);
  },
  instanceOf: UserFiles
});

var DatabaseType = new yaml.Type('!com.amazonaws.mobilehub.v0.Database', {
  kind: 'mapping',
  construct: function (data) {
    return new Database(data);
  },
  instanceOf: Database
});

var DatabaseNoSQLType = new yaml.Type('!com.amazonaws.mobilehub.v0.NoSQLDatabase', {
  kind: 'mapping',
  construct: function (data) {
    return new DatabaseNoSQL(data);
  },
  instanceOf: DatabaseNoSQL
});

var NoSQLTableType = new yaml.Type('!com.amazonaws.mobilehub.v0.NoSQLTable', {
  kind: 'mapping',
  construct: function (data) {
    return new NoSQLTable(data.attributes, data.hashKeyName, data.hashKeyType,
      data.rangeKeyName, data.rangeKeyType, data.tableName, data.tablePrivacy,
      data.indexes || []);
  },
  instanceOf: NoSQLTable
});

var NoSQLIndexType = new yaml.Type('!com.amazonaws.mobilehub.v0.NoSQLIndex', {
  kind: 'mapping',
  construct: function (data) {
    return new NoSQLIndex(data.hashKeyName, data.hashKeyType, data.rangeKeyName, data.rangeKeyType, data.indexName);
  },
  instanceOf: NoSQLIndex
});

var CloudLogicType = new yaml.Type('!com.amazonaws.mobilehub.v0.CloudLogic', {
  kind: 'mapping',
  construct: function (data) {
    return new CloudLogic(data);
  },
  instanceOf: CloudLogic
});

var ApiType = new yaml.Type('!com.amazonaws.mobilehub.v0.API', {
  kind: 'mapping',
  construct: function (data) {
    return new Api(data.attributes, data.paths);
  },
  instanceOf: Api
});

var FunctionType = new yaml.Type('!com.amazonaws.mobilehub.v0.Function', {
  kind: 'mapping',
  construct: function (data) {
    data.environment = data.environment || {};
    return new MHFunction(data.name, data.codeFilename, data.handler,
      data.enableCORS, data.runtime, data.environment);
  },
  instanceOf: MHFunction
});

var ProjectType = new yaml.Type('!com.amazonaws.mobilehub.v0.Project', {
  kind: 'mapping',
  construct: function (data) {
    return new Project(data.features, data.name || '', data.region || '',
      data.uploads || [], data.sharedComponents || {});
  },
  instanceOf: Project
});

var YML_SCHEMA = yaml.Schema.create([ProjectType, DatabaseType, UserSettingsType,
  DatabaseNoSQLType, NoSQLTableType, NoSQLIndexType, UserFilesType,
  CloudLogicType, ApiType, FunctionType, BotType, BotsType, PinpointMessagingType,
  PinpointAnalyticsType, PinpointType, SignInType, StandardIdentityProviderType,
  OpenIDConnectIdentityProviderType, UserPoolsIdentityProviderType,
  ConvertibleMapType, ContentDeliveryType, BucketType, UploadType,
  PushPlatformType]);

var createYamlText = (yamlDefinition) => {
  // Replace !<> characters
  var yamlText = yaml.dump(yamlDefinition, {
    schema: YML_SCHEMA,
    noCompatMode: true,
    scalarType: 5,
    lineWidth: 9999999,
    noRefs: true,
    skipInvalid: true
  });
  let regExpDb = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Database>', 'g');
  let regExpNoSql = new RegExp('\!<\!com.amazonaws.mobilehub.v0.NoSQLDatabase>', 'g');
  let regExpTable = new RegExp('\!<\!com.amazonaws.mobilehub.v0.NoSQLTable>', 'g');
  let regExpIndex = new RegExp('\!<\!com.amazonaws.mobilehub.v0.NoSQLIndex>', 'g');
  let regExpUserFiles = new RegExp('\!<\!com.amazonaws.mobilehub.v0.UserFiles>', 'g');
  let regExpUserSettings = new RegExp('\!<\!com.amazonaws.mobilehub.v0.UserSettings>', 'g');
  let regExpProject = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Project>', 'g');
  let regExpCloudLogic = new RegExp('\!<\!com.amazonaws.mobilehub.v0.CloudLogic>', 'g');
  let regExpAPI = new RegExp('\!<\!com.amazonaws.mobilehub.v0.API>', 'g');
  let regExpFunction = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Function>', 'g');
  let regExpBots = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Bots>', 'g');
  let regExpBot = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Bot>', 'g');
  let regExpPinpoint = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Pinpoint>', 'g');
  let regExpPinpointAnalytics = new RegExp('\!<\!com.amazonaws.mobilehub.v0.PinpointAnalytics>', 'g');
  let regExpPinpointMessaging = new RegExp('\!<\!com.amazonaws.mobilehub.v0.PinpointMessaging>', 'g');
  let regExpSignIn = new RegExp('\!<\!com.amazonaws.mobilehub.v0.SignIn>', 'g');
  let regExpStandard = new RegExp('\!<\!com.amazonaws.mobilehub.v0.StandardIdentityProvider>', 'g');
  let regExpOpenId = new RegExp('\!<\!com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider>', 'g');
  let regExpUserPools = new RegExp('\!<\!com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider>', 'g');
  let regExpConvertible = new RegExp('\!<\!com.amazonaws.mobilehub.ConvertibleMap>', 'g');
  let regExpContent = new RegExp('\!<\!com.amazonaws.mobilehub.v0.ContentDelivery>', 'g');
  let regExpBucket = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Bucket>', 'g');
  let regExpUpload = new RegExp('\!<\!com.amazonaws.mobilehub.v0.Upload>', 'g');
  let regExpPush = new RegExp('\!<\!com.amazonaws.mobilehub.v0.PushPlatform>', 'g');

  yamlText = yamlText.replace(regExpDb, '!com.amazonaws.mobilehub.v0.Database');
  yamlText = yamlText.replace(regExpNoSql, '!com.amazonaws.mobilehub.v0.NoSQLDatabase');
  yamlText = yamlText.replace(regExpTable, '!com.amazonaws.mobilehub.v0.NoSQLTable');
  yamlText = yamlText.replace(regExpIndex, '!com.amazonaws.mobilehub.v0.NoSQLIndex');
  yamlText = yamlText.replace(regExpUserFiles, '!com.amazonaws.mobilehub.v0.UserFiles');
  yamlText = yamlText.replace(regExpUserSettings, '!com.amazonaws.mobilehub.v0.UserSettings');
  yamlText = yamlText.replace(regExpProject, '!com.amazonaws.mobilehub.v0.Project');
  yamlText = yamlText.replace(regExpCloudLogic, '!com.amazonaws.mobilehub.v0.CloudLogic');
  yamlText = yamlText.replace(regExpAPI, '!com.amazonaws.mobilehub.v0.API');
  yamlText = yamlText.replace(regExpFunction, '!com.amazonaws.mobilehub.v0.Function');
  yamlText = yamlText.replace(regExpBots, '!com.amazonaws.mobilehub.v0.Bots');
  yamlText = yamlText.replace(regExpBot, '!com.amazonaws.mobilehub.v0.Bot');
  yamlText = yamlText.replace(regExpPinpoint, '!com.amazonaws.mobilehub.v0.Pinpoint');
  yamlText = yamlText.replace(regExpPinpointAnalytics, '!com.amazonaws.mobilehub.v0.PinpointAnalytics');
  yamlText = yamlText.replace(regExpPinpointMessaging, '!com.amazonaws.mobilehub.v0.PinpointMessaging');
  yamlText = yamlText.replace(regExpSignIn, '!com.amazonaws.mobilehub.v0.SignIn');
  yamlText = yamlText.replace(regExpStandard, '!com.amazonaws.mobilehub.v0.StandardIdentityProvider');
  yamlText = yamlText.replace(regExpOpenId, '!com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider');
  yamlText = yamlText.replace(regExpUserPools, '!com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider');
  yamlText = yamlText.replace(regExpConvertible, '!com.amazonaws.mobilehub.ConvertibleMap');
  yamlText = yamlText.replace(regExpContent, '!com.amazonaws.mobilehub.v0.ContentDelivery');
  yamlText = yamlText.replace(regExpBucket, '!com.amazonaws.mobilehub.v0.Bucket');
  yamlText = yamlText.replace(regExpUpload, '!com.amazonaws.mobilehub.v0.Upload');
  yamlText = yamlText.replace(regExpPush, '!com.amazonaws.mobilehub.v0.PushPlatform');

  yamlText = '---' + yamlText; // --- required by mobilehub

  return yamlText;
}

var yamlLoad = (callback) => {
  var data = fs.readFileSync(yamlFile, 'utf-8');
  let yamlDefinition = yaml.safeLoad(data, { schema: YML_SCHEMA, noCompatMode: true, scalarType: 5 });
  callback(yamlDefinition);
};

var yamlSave = (yaml, callback) => {
  let yamlText = createYamlText(yaml);
  fs.writeFileSync(yamlFile, yamlText);
  callback();
};

module.exports = {
  yamlFile,
  save: function (projectInfo, yaml, callback) {
    yamlFile = path.join(projectInfo.ProjectPath, 'awsmobilejs/backend/mobile-hub-project.yml')
    yamlSave(yaml, callback)
  },
  load: function (projectInfo, callback) {
    yamlFile = path.join(projectInfo.ProjectPath, 'awsmobilejs/backend/mobile-hub-project.yml')
    yamlLoad(callback);
  },
  createText: function (projectInfo, yamlDefinition) {
    yamlFile = path.join(projectInfo.ProjectPath, 'awsmobilejs/backend/mobile-hub-project.yml')
    createYamlText(yamlDefinition);
  },
  Database,
  DatabaseNoSQL,
  NoSQLTable,
  NoSQLIndex,
  UserFiles,
  UserSettings,
  CloudLogic,
  Api,
  MHFunction,
  Pinpoint,
  PinpointAnalytics,
  ContentDelivery,
  Bucket,
  SignIn,
  StandardIdentityProvider,
  OpenIDConnectIdentityProvider,
  UserPoolsIdentityProvider,
  ConvertibleMap,
  Bot,
  Bots,
  YML_SCHEMA
};
