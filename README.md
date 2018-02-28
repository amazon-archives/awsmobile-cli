# awsmobile-CLI

<a href="https://nodei.co/npm/awsmobile-cli/">
  <img src="https://nodei.co/npm/awsmobile-cli.svg?downloads=true&downloadRank=true&stars=true">
</a>

<p>
  <a href="https://travis-ci.org/aws/awsmobile-cli">
    <img src="https://travis-ci.org/aws/awsmobile-cli.svg?branch=master" alt="build:started">
  </a>

  <a href="https://codecov.io/gh/aws/awsmobile-cli">
    <img src="https://codecov.io/gh/aws/awsmobile-cli/branch/master/graph/badge.svg" />
  </a>
</p>

The awsmobile-CLI, built on top of AWS Mobile Hub, provides a command line interface for frontend JavaScript developers to seamlessly enable and configure AWS services into their apps. With minimal configuration, you can start using all of the functionality provided by the AWS Mobile Hub from your favorite terminal program.

* [Installation](#installation)
* [Configuration](#configuration)
* [Getting Started](#getting-started)
* [Commands Summary](#commands-summary)
* [Usage](#usage)


## Installation

The easiest way to install is using npm or yarn

```
npm install -g awsmobile-cli

or

yarn global add awsmobile-cli
```

## Configuration

* [Sign up for the AWS Free Tier](https://aws.amazon.com/free/) to learn and prototype at little or no cost.

* [Enable AWS Mobile Hub Service Role](https://console.aws.amazon.com/mobilehub/home?region=us-east-1#/activaterole/) to let AWS Mobile use your AWS credentials  to create and manage your AWS services.

* Configure the CLI with your AWS credentials. To setup permissions for the toolchain used by the CLI, run:

```
awsmobile configure
```

Check [here](#awsmobile-configure) for more details about configuration

## Getting Started

To create a new Mobile Hub project and pull the project configuration into your app, run the following command on your terminal.

```
cd <your-app>
awsmobile init
```

Running this command enables your Mobile Hub project with two default features: (1) Analytics, for receiving the analytics sent from your app and (2) Hosting and Streaming for easily hosting your app in the cloud. The command also adds the [AWS Amplify](https://github.com/aws/aws-amplify#aws-amplify) JavaScript library to your app so you can easily integrate Analytics, as well as other features provided by AWS. These features can easily be enabled using the awsmobile cli commands below.

## Commands Summary

The current set of commands supported by the awsmobile CLI are

| Command              | Description |
| --- | --- |
| awsmobile start | Starts an awsmobilejs project using one of our starter templates, sets up the backend mobile hub project in the cloud and pulls the aws-exports.js file |
| awsmobile init | Initializes the current project with awsmobilejs features, sets up the backend mobile hub project in the cloud and pulls the aws-exports.js file |
| awsmobile configure [aws] | Configures the aws access credentials and aws region for awsmobile-cli |
| awsmobile configure project | Configures the attributes of your project for awsmobile-cli |
| awsmobile pull | Retrieves the latest details of the backend Mobile Hub project, such as the access information file aws-exports.js |
| awsmobile push | Updates the backend Mobile Hub project with the latest local developments |
| awsmobile publish | Executes awsmobile push, then builds and publishes client-side application to S3 and Cloud Front |
| awsmobile run | Executes awsmobile push, then executes the project's start command to test run the client-side application |
| awsmobile console | Opens the web console of the backend Mobile Hub project |
| awsmobile features | Shows available Mobile Hub project features, and allows them to be enabled/disabled |
| awsmobile \<feature\> enable  [--prompt] | Enables the feature with the defaults configuration, and --prompt for initial configuration settings |
| awsmobile \<feature\> disable | Disables the feature |
| awsmobile \<feature\> configure | Configures the definition of the objects in the feature |
| awsmobile cloud-api invoke \<apiname\> \<method\> \<path\> [init] | Invokes the API for testing locally. This helps quickly test unsigned APIs in your local environment |
| awsmobile delete | Deletes the Mobile hub project |
| awsmobile help [cmd] | Displays help for [cmd] |


Supported Features:
1. user-signin (Cognito)
2. user-files (AWS S3)
3. cloud-api (CloudLogic)
4. database (Dynamo DB)
5. analytics (Pinpoint)
6. hosting (S3 and CloudFront Distribution)

## awsmobile configure

```
awsmobile configure
```

#### There are two levels in the aws credential and region configurations for the awsmobile-cli
- general
- per project

When you run `awsmobile configure` outside of a valid awsmobilejs project, it sets the general configuration. The general configuration is applied when you run 'awsmobile init` or `awsmobile start` command. And its values are copied as the initial per project configuration for the newly initialized project

When you run `awsmobile configure` inside a valid awsmobilejs project, it sets the configuration for this project only. It does NOT change the general configuration or the configuration of other projects.

## Usage

Go to the [AWS Mobile Docs](http://docs.aws.amazon.com/aws-mobile/latest/developerguide/web-getting-started.html) to learn more about the usage of the awsmobile-cli and some sample codes to get your app up and running.  
