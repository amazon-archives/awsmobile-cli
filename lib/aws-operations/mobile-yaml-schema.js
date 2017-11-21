/* 
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
const jsyaml = require('js-yaml')
const _= require('lodash')

const typeProperty = 'backend-class'

////////////////////////////////////////////
////////////////////////////////////////////
function Convertible(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Convertible'
}
let ConvertibleYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.Convertible', {
    kind: 'mapping',
    construct: data => new Convertible(data),
    instanceOf: Convertible
})

function ConvertibleComponent(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ConvertibleComponent'
}
let ConvertibleComponentYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.ConvertibleComponent', {
    kind: 'mapping',
    construct: data => new ConvertibleComponent(data),
    instanceOf: ConvertibleComponent
})

function ConvertibleFeature(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ConvertibleFeature'
}
let ConvertibleFeatureYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.ConvertibleFeature', {
    kind: 'mapping',
    construct: data => new ConvertibleFeature(data),
    instanceOf: ConvertibleFeature
})

function ConvertibleMap(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ConvertibleMap'
}
let ConvertibleMapYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.ConvertibleMap', {
    kind: 'mapping',
    construct: data => new ConvertibleMap(data),
    instanceOf: ConvertibleMap
})

function ConvertibleProject(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ConvertibleProject'
}
let ConvertibleProjectYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.ConvertibleProject', {
    kind: 'mapping',
    construct: data => new ConvertibleProject(data),
    instanceOf: ConvertibleProject
})

function FeatureFactory(data) {
    Object.assign(this, data)
    this[typeProperty] = 'FeatureFactory'
}
let FeatureFactoryYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.FeatureFactory', {
    kind: 'mapping',
    construct: data => new FeatureFactory(data),
    instanceOf: FeatureFactory
})

function FileUploader(data) {
    Object.assign(this, data)
    this[typeProperty] = 'FileUploader'
}
let FileUploaderYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.FileUploader', {
    kind: 'mapping',
    construct: data => new FileUploader(data),
    instanceOf: FileUploader
})

function SharedComponentFactory(data) {
    Object.assign(this, data)
    this[typeProperty] = 'SharedComponentFactory'
}
let SharedComponentFactoryYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.SharedComponentFactory', {
    kind: 'mapping',
    construct: data => new SharedComponentFactory(data),
    instanceOf: SharedComponentFactory
})
 
//////////////////// v0 
function API(data) {
    Object.assign(this, data)
    this[typeProperty] = 'API'
}
let APIYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.API', {
    kind: 'mapping',
    construct: data => new API(data),
    instanceOf: API
})

function Bot(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Bot'
}
let BotYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Bot', {
    kind: 'mapping',
    construct: data => new Bot(data),
    instanceOf: Bot
})

function Bots(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Bots'
}
let BotsYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Bots', {
    kind: 'mapping',
    construct: data => new Bots(data),
    instanceOf: Bots
})

function Bucket(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Bucket'
}
let BucketYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Bucket', {
    kind: 'mapping',
    construct: data => new Bucket(data),
    instanceOf: Bucket
})

function CloudLogic(data) {
    Object.assign(this, data)
    this[typeProperty] = 'CloudLogic'
}
let CloudLogicYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.CloudLogic', {
    kind: 'mapping',
    construct: data => new CloudLogic(data),
    instanceOf: CloudLogic
})

function Component(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Component'
}
let ComponentYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Component', {
    kind: 'mapping',
    construct: data => new Component(data),
    instanceOf: Component
})

function ContentDelivery(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ContentDelivery'
}
let ContentDeliveryYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.ContentDelivery', {
    kind: 'mapping',
    construct: data => new ContentDelivery(data),
    instanceOf: ContentDelivery
})

function Database(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Database'
}
let DatabaseYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Database', {
    kind: 'mapping',
    construct: data => new Database(data),
    instanceOf: Database
})

function Feature(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Feature'
}
let FeatureYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Feature', {
    kind: 'mapping',
    construct: data => new Feature(data),
    instanceOf: Feature
})

function Function(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Function'
}
let FunctionYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Function', {
    kind: 'mapping',
    construct: data => new Function(data),
    instanceOf: Function
})

function Handler(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Handler'
}
let HandlerYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Handler', {
    kind: 'mapping',
    construct: data => new Handler(data),
    instanceOf: Handler
})

function NoSQLDatabase(data) {
    Object.assign(this, data)
    this[typeProperty] = 'NoSQLDatabase'
}
let NoSQLDatabaseYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.NoSQLDatabase', {
    kind: 'mapping',
    construct: data => new NoSQLDatabase(data),
    instanceOf: NoSQLDatabase
})

function NoSQLIndex(data) {
    Object.assign(this, data)
    this[typeProperty] = 'NoSQLIndex'
}
let NoSQLIndexYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.NoSQLIndex', {
    kind: 'mapping',
    construct: data => new NoSQLIndex(data),
    instanceOf: NoSQLIndex
})

function NoSQLTable(data) {
    Object.assign(this, data)
    this[typeProperty] = 'NoSQLTable'
}
let NoSQLTableYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.NoSQLTable', {
    kind: 'mapping',
    construct: data => new NoSQLTable(data),
    instanceOf: NoSQLTable
})

function ObfuscatedComponent(data) {
    Object.assign(this, data)
    this[typeProperty] = 'ObfuscatedComponent'
}
let ObfuscatedComponentYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.ObfuscatedComponent', {
    kind: 'mapping',
    construct: data => new ObfuscatedComponent(data),
    instanceOf: ObfuscatedComponent
})

function OpenIDConnectIdentityProvider(data) {
    Object.assign(this, data)
    this[typeProperty] = 'OpenIDConnectIdentityProvider'
}
let OpenIDConnectIdentityProviderYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.OpenIDConnectIdentityProvider', {
    kind: 'mapping',
    construct: data => new OpenIDConnectIdentityProvider(data),
    instanceOf: OpenIDConnectIdentityProvider
})

function Pinpoint(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Pinpoint'
}
let PinpointYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Pinpoint', {
    kind: 'mapping',
    construct: data => new Pinpoint(data),
    instanceOf: Pinpoint
})

function PinpointAnalytics(data) {
    Object.assign(this, data)
    this[typeProperty] = 'PinpointAnalytics'
}
let PinpointAnalyticsYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.PinpointAnalytics', {
    kind: 'mapping',
    construct: data => new PinpointAnalytics(data),
    instanceOf: PinpointAnalytics
})

function PinpointMessaging(data) {
    Object.assign(this, data)
    this[typeProperty] = 'PinpointMessaging'
}
let PinpointMessagingYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.PinpointMessaging', {
    kind: 'mapping',
    construct: data => new PinpointMessaging(data),
    instanceOf: PinpointMessaging
})

function Project(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Project'
}
let ProjectYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Project', {
    kind: 'mapping',
    construct: data => new Project(data),
    instanceOf: Project
})

function PushNotifications(data) {
    Object.assign(this, data)
    this[typeProperty] = 'PushNotifications'
}
let PushNotificationsYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.PushNotifications', {
    kind: 'mapping',
    construct: data => new PushNotifications(data),
    instanceOf: PushNotifications
})

function PushPlatform(data) {
    Object.assign(this, data)
    this[typeProperty] = 'PushPlatform'
}
let PushPlatformYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.PushPlatform', {
    kind: 'mapping',
    construct: data => new PushPlatform(data),
    instanceOf: PushPlatform
})

function PushTopic(data) {
    Object.assign(this, data)
    this[typeProperty] = 'PushTopic'
}
let PushTopicYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.PushTopic', {
    kind: 'mapping',
    construct: data => new PushTopic(data),
    instanceOf: PushTopic
})

function SaaSConnectorAPI(data) {
    Object.assign(this, data)
    this[typeProperty] = 'SaaSConnectorAPI'
}
let SaaSConnectorAPIYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.SaaSConnectorAPI', {
    kind: 'mapping',
    construct: data => new SaaSConnectorAPI(data),
    instanceOf: SaaSConnectorAPI
})

function SAMLIdentityProvider(data) {
    Object.assign(this, data)
    this[typeProperty] = 'SAMLIdentityProvider'
}
let SAMLIdentityProviderYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.SAMLIdentityProvider', {
    kind: 'mapping',
    construct: data => new SAMLIdentityProvider(data),
    instanceOf: SAMLIdentityProvider
})

function SignIn(data) {
    Object.assign(this, data)
    this[typeProperty] = 'SignIn'
}
let SignInYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.SignIn', {
    kind: 'mapping',
    construct: data => new SignIn(data),
    instanceOf: SignIn
})

function StandardIdentityProvider(data) {
    Object.assign(this, data)
    this[typeProperty] = 'StandardIdentityProvider'
}
let StandardIdentityProviderYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.StandardIdentityProvider', {
    kind: 'mapping',
    construct: data => new StandardIdentityProvider(data),
    instanceOf: StandardIdentityProvider
})

function Upload(data) {
    Object.assign(this, data)
    this[typeProperty] = 'Upload'
}
let UploadYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.Upload', {
    kind: 'mapping',
    construct: data => new Upload(data),
    instanceOf: Upload
})

function UserFiles(data) {
    Object.assign(this, data)
    this[typeProperty] = 'UserFiles'
}
let UserFilesYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.UserFiles', {
    kind: 'mapping',
    construct: data => new UserFiles(data),
    instanceOf: UserFiles
})

function UserPoolsIdentityProvider(data) {
    Object.assign(this, data)
    this[typeProperty] = 'UserPoolsIdentityProvider'
}
let UserPoolsIdentityProviderYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.UserPoolsIdentityProvider', {
    kind: 'mapping',
    construct: data => new UserPoolsIdentityProvider(data),
    instanceOf: UserPoolsIdentityProvider
})

function UserSettings(data) {
    Object.assign(this, data)
    this[typeProperty] = 'UserSettings'
}
let UserSettingsYamlType = new jsyaml.Type('!com.amazonaws.mobilehub.v0.UserSettings', {
    kind: 'mapping',
    construct: data => new UserSettings(data),
    instanceOf: UserSettings
})

////////////////////////////////////////////
////////////////////////////////////////////
let AWS_MOBILE_YAML_SCHEMA = jsyaml.Schema.create([ 
    ConvertibleYamlType,
    ConvertibleComponentYamlType,
    ConvertibleFeatureYamlType,
    ConvertibleMapYamlType,
    ConvertibleProjectYamlType,
    FeatureFactoryYamlType,
    FileUploaderYamlType,
    SharedComponentFactoryYamlType,
    APIYamlType,
    BotYamlType,
    BotsYamlType,
    BucketYamlType,
    CloudLogicYamlType,
    ComponentYamlType,
    ContentDeliveryYamlType,
    DatabaseYamlType,
    FeatureYamlType,
    FunctionYamlType,
    HandlerYamlType,
    NoSQLDatabaseYamlType,
    NoSQLIndexYamlType,
    NoSQLTableYamlType,
    ObfuscatedComponentYamlType,
    OpenIDConnectIdentityProviderYamlType,	
    PinpointYamlType,
    PinpointAnalyticsYamlType,
    PinpointMessagingYamlType,
    ProjectYamlType,
    PushNotificationsYamlType,
    PushPlatformYamlType,
    PushTopicYamlType,
    SaaSConnectorAPIYamlType,
    SAMLIdentityProviderYamlType,
    SignInYamlType,
    StandardIdentityProviderYamlType,
    UploadYamlType,
    UserFilesYamlType,
    UserPoolsIdentityProviderYamlType,
    UserSettingsYamlType
 ])

////////////////////////////////////////////
////////////////////////////////////////////
function reConstruct(typeName, obj){
    let result
    switch(typeName){
        case 'Convertible': result = new Convertible(obj); break;
        case 'ConvertibleComponent': result = new ConvertibleComponent(obj); break;
        case 'ConvertibleFeature': result = new ConvertibleFeature(obj); break;
        case 'ConvertibleMap': result = new ConvertibleMap(obj); break;
        case 'ConvertibleProject': result = new ConvertibleProject(obj); break;
        case 'FeatureFactory': result = new FeatureFactory(obj); break;
        case 'FileUploader': result = new FileUploader(obj); break;
        case 'SharedComponentFactory': result = new SharedComponentFactory(obj); break;
        case 'API': result = new API(obj); break;
        case 'Bot': result = new Bot(obj); break;
        case 'Bots': result = new Bots(obj); break;
        case 'Bucket': result = new Bucket(obj); break;
        case 'CloudLogic': result = new CloudLogic(obj); break;
        case 'Component': result = new Component(obj); break;
        case 'ContentDelivery': result = new ContentDelivery(obj); break;
        case 'Database': result = new Database(obj); break;
        case 'Feature': result = new Feature(obj); break;
        case 'Function': result = new Function(obj); break;
        case 'Handler': result = new Handler(obj); break;
        case 'NoSQLDatabase': result = new NoSQLDatabase(obj); break;
        case 'NoSQLIndex': result = new NoSQLIndex(obj); break;
        case 'NoSQLTable': result = new NoSQLTable(obj); break;
        case 'ObfuscatedComponent': result = new ObfuscatedComponent(obj); break;
        case 'OpenIDConnectIdentityProvider': result = new OpenIDConnectIdentityProvider(obj); break;
        case 'Pinpoint': result = new Pinpoint(obj); break;
        case 'PinpointAnalytics': result = new PinpointAnalytics(obj); break;
        case 'PinpointMessaging': result = new PinpointMessaging(obj); break;
        case 'Project': result = new Project(obj); break;
        case 'PushNotifications': result = new PushNotifications(obj); break;
        case 'PushPlatform': result = new PushPlatform(obj); break;
        case 'PushTopic': result = new PushTopic(obj); break;
        case 'SaaSConnectorAPI': result = new SaaSConnectorAPI(obj); break;
        case 'SAMLIdentityProvider': result = new SAMLIdentityProvider(obj); break;
        case 'SignIn': result = new SignIn(obj); break;
        case 'StandardIdentityProvider': result = new StandardIdentityProvider(obj); break;
        case 'Upload': result = new Upload(obj); break;
        case 'UserFiles': result = new UserFiles(obj); break;
        case 'UserPoolsIdentityProvider': result = new UserPoolsIdentityProvider(obj); break;
        case 'UserSettings': result = new UserSettings(obj); break;
    }
    return result
}

////////////////////////////////////////////
////////////////////////////////////////////
function dressObject(obj){
    return recursiveDressObject(obj)
}

function recursiveDressObject(obj){
    _.keys(obj).forEach(function(key){
        let propertyType = typeof obj[key]
        if(typeof obj[key] === 'object'){
            obj[key] = recursiveDressObject(obj[key])
        }
    })
    if(obj[typeProperty]){
        obj = reConstruct(obj[typeProperty], obj)
    }
    return obj
}

function trimObject(obj){
    return recursiveTrimObject(obj)
}

function recursiveTrimObject(obj){
    _.keys(obj).forEach(function(key){
        if(typeof obj[key] === 'object'){
            obj[key] = recursiveTrimObject(obj[key])
        }
    })
    if(obj[typeProperty]){
        delete obj[typeProperty]
    }
    return obj
}

module.exports = {
    AWS_MOBILE_YAML_SCHEMA,
    dressObject,
    trimObject
}





















































































































