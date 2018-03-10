DynamodbDataSourceConfig {
    /**
     * The table name.
     */
    tableName: String;
    /**
     * The AWS region.
     */
    awsRegion: String;
    /**
     * Set to TRUE to use Amazon Cognito credentials with this data source.
     */
    useCallerCredentials?: Boolean;
  }

  CreateDataSourceRequest {
    apiId: String;
    name: ResourceName;
    description?: 
    type: DataSourceType;
    serviceRoleArn?
    dynamodbConfig?
    lambdaConfig?
    elasticsearchConfig?
  }