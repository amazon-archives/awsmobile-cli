# awsmobile-CLI

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

yarn install -g awsmobile-cli
```

## Configuration

* [Sign up for the AWS Free Tier](https://aws.amazon.com/free/) to learn and prototype at little or no cost.

* [Activate AWS Mobile Hub](https://console.aws.amazon.com/mobilehub/home?region=us-east-1#/activaterole/) to let AWS Mobile use your AWS credentials  to create and manage your AWS services.

* Install [Node.js](https://nodejs.org/en/download/) with NPM.

* Configure the CLI with your AWS credentials. To setup permissions for the toolchain used by the CLI, run:

```
awsmobile configure
```

If prompted for credentials, follow the steps provided by the CLI. For more information, see provide IAM credentials to AWS Mobile CLI.

## Getting Started

To create a new Mobile Hub project and pull the project configuration into your app, run the following command on your terminal.

```
cd <your-app>
awsmobile init
```

Runing this command enables your Mobile Hub project with two default features: (1) Analytics, for receiving the analytics sent from your app and (2) Hosting and Streaming for easily hosting your app in the cloud. The command also adds the [AWS Amplify](https://github.com/aws/aws-amplify#aws-amplify) JavaScript library to your app so you can easily integrate Analytics, as well as other features provided by AWS. These features can easily be enabled using the awsmobile cli commands below.

## Commands Summary

The current set of commands supported by the awsmobile CLI are

| Command              | Description |
| --- | --- |
| awsmobile init | Initializes a new Mobile Hub project, checks for IAM keys, and pulls the aws-exports.js file |
| awsmobile configure | Shows existing keys and allows them to be changed if already set. If keys aren’t set, deep links the user to the IAM console to create keys and then prompts for the access key and secret key. This command helps edit configuration settings for the aws account or the project |
| awsmobile pull | Retrives the latest details of the backend Mobile Hub project, such as the access infromation file aws-exports.js |
| awsmobile push | Updates the backend Mobile Hub project with the latest local developments |
| awsmobile publish | Executes awsmobile push, then builds and publishes client-side applicatioin to S3 and Cloud Front |
| awsmobile run | Executes awsmobile push, then executes the project's start command to test run the client-side application |
| awsmobile console | Opens the web console of the backend Mobile Hub project |
| awsmobile features | Shows available Mobile Hub project features, and allows them to be enabled/disabled |
| awsmobile \<feature\> enable  [--prompt] | Enables the feature with the defaults configuration, and --prompt for initial configuration settings |
| awsmobile \<feature\> disable | Disables the feature |
| awsmobile \<feature\> configure | Configures the definition of the objects in the feature |
| awsmobile cloud-api invoke \<apiname\> \<method\> \<path\> [init] | Invokes the API for testing locally. This helps quickly test unsigned APIs in your local environment |
| awsmobile delete | Deletes the Mobile hub project |
| awsmobile hlep [cmd] | Displays help for [cmd] |



Supported Features:
1. user-signin (Cognito)
2. user-files (AWS S3)
3. cloud-api (CloudLogic)
4. database (Dynamo DB)
5. analytics (Pinpoint)
6. hosting (S3 and CloudFront Distribution)



## Usage

Go to the [AWS Mobile Docs](http://docs.aws.amazon.com/aws-mobile/latest/developerguide/javascript-getting-started.html) to learn more about the usage of the awsmobile-cli and some sample codes to get your app up and running.  
