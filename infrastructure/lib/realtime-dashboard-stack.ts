import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class RealtimeDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // DynamoDB table to store connections
    const connectionsTable = new dynamodb.Table(this, 'Connections', {
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Kinesis Data Stream
    const dataStream = new kinesis.Stream(this, 'DashboardDataStream', {
      streamName: 'dashboard-updates',
      shardCount: 1,
      retentionPeriod: cdk.Duration.hours(24),
    });

    // WebSocket API
    const webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: 'RealtimeDashboardApi',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // Lambda functions for WebSocket handling
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'dist/connect.handler',
      code: lambda.Code.fromAsset('../lambda', {
        bundling: {
          local: {
            tryBundle(outputDir: string) {
              require('child_process').execSync(
                `cp -r ${path.join(__dirname, '../../lambda')}/* ${outputDir}/`,
              );
              return true;
            },
          },
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          command: [
            'bash',
            '-c',
            ['npm install', 'cp -r /asset-input/* /asset-output/'].join(' && '),
          ],
        },
      }),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'dist/disconnect.handler',
      code: lambda.Code.fromAsset('../lambda', {
        bundling: {
          local: {
            tryBundle(outputDir: string) {
              require('child_process').execSync(
                `cp -r ${path.join(__dirname, '../../lambda')}/* ${outputDir}/`,
              );
              return true;
            },
          },
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          command: [
            'bash',
            '-c',
            ['npm install', 'cp -r /asset-input/* /asset-output/'].join(' && '),
          ],
        },
      }),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'dist/message.handler',
      code: lambda.Code.fromAsset('../lambda', {
        bundling: {
          local: {
            tryBundle(outputDir: string) {
              require('child_process').execSync(
                `cp -r ${path.join(__dirname, '../../lambda')}/* ${outputDir}/`,
              );
              return true;
            },
          },
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          command: [
            'bash',
            '-c',
            ['npm install', 'cp -r /asset-input/* /asset-output/'].join(' && '),
          ],
        },
      }),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    // Kinesis Data Producer Lambda
    const kinesisProducerHandler = new lambda.Function(
      this,
      'KinesisProducerHandler',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'dist/kinesisProducer.handler',
        code: lambda.Code.fromAsset('../lambda', {
          bundling: {
            local: {
              tryBundle(outputDir: string) {
                require('child_process').execSync(
                  `cp -r ${path.join(
                    __dirname,
                    '../../lambda',
                  )}/* ${outputDir}/`,
                );
                return true;
              },
            },
            image: lambda.Runtime.NODEJS_22_X.bundlingImage,
            command: [
              'bash',
              '-c',
              ['npm install', 'cp -r /asset-input/* /asset-output/'].join(
                ' && ',
              ),
            ],
          },
        }),
        environment: {
          STREAM_NAME: dataStream.streamName,
        },
        timeout: cdk.Duration.minutes(1),
        memorySize: 256,
      },
    );

    // Kinesis Consumer Lambda function
    const kinesisConsumerHandler = new lambda.Function(
      this,
      'KinesisConsumerHandler',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'dist/kinesisConsumer.handler',
        code: lambda.Code.fromAsset('../lambda', {
          bundling: {
            local: {
              tryBundle(outputDir: string) {
                require('child_process').execSync(
                  `cp -r ${path.join(
                    __dirname,
                    '../../lambda',
                  )}/* ${outputDir}/`,
                );
                return true;
              },
            },
            image: lambda.Runtime.NODEJS_22_X.bundlingImage,
            command: [
              'bash',
              '-c',
              ['npm install', 'cp -r /asset-input/* /asset-output/'].join(
                ' && ',
              ),
            ],
          },
        }),
        environment: {
          CONNECTIONS_TABLE: connectionsTable.tableName,
          WEBSOCKET_ENDPOINT: `${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/prod`,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
      },
    );

    // Add Kinesis as an event source for the consumer Lambda
    kinesisConsumerHandler.addEventSource(
      new lambdaEventSources.KinesisEventSource(dataStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(1),
      }),
    );

    // Create an EventBridge rule to trigger the producer Lambda every minute
    const rule = new events.Rule(this, 'ProducerScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
    });

    rule.addTarget(new targets.LambdaFunction(kinesisProducerHandler));

    // Grant permissions
    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(messageHandler);
    connectionsTable.grantReadWriteData(kinesisConsumerHandler);

    // Grant permissions to the Kinesis producer and consumer
    dataStream.grantWrite(kinesisProducerHandler);
    dataStream.grantRead(kinesisConsumerHandler);

    // Grant Lambda permissions to execute API Gateway management API
    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/prod/POST/@connections/*`,
      ],
    });

    kinesisConsumerHandler.addToRolePolicy(policy);
    messageHandler.addToRolePolicy(policy);

    // Create WebSocket routes
    const connectIntegration = new apigatewayv2.CfnIntegration(
      this,
      'ConnectIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${connectHandler.functionArn}/invocations`,
      },
    );

    const disconnectIntegration = new apigatewayv2.CfnIntegration(
      this,
      'DisconnectIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${disconnectHandler.functionArn}/invocations`,
      },
    );

    const messageIntegration = new apigatewayv2.CfnIntegration(
      this,
      'MessageIntegration',
      {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${messageHandler.functionArn}/invocations`,
      },
    );

    const connectRoute = new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: `integrations/${connectIntegration.ref}`,
    });

    const disconnectRoute = new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$disconnect',
      authorizationType: 'NONE',
      target: `integrations/${disconnectIntegration.ref}`,
    });

    const messageRoute = new apigatewayv2.CfnRoute(this, 'MessageRoute', {
      apiId: webSocketApi.ref,
      routeKey: 'message',
      authorizationType: 'NONE',
      target: `integrations/${messageIntegration.ref}`,
    });

    // Add a default route as well
    const defaultRoute = new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$default',
      authorizationType: 'NONE',
      target: `integrations/${messageIntegration.ref}`,
    });

    // Create a role for API Gateway to write logs to CloudWatch
    const apiGatewayLoggingRole = new iam.Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Role for API Gateway to write logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
      ],
    });

    // Add permissions to the role to write logs to CloudWatch
    apiGatewayLoggingRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:PutLogEvents',
          'logs:GetLogEvents',
          'logs:FilterLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/apigateway/*`,
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/apigateway/${webSocketApi.ref}/*`,
        ],
      }),
    );

    // Create the log group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'WebSocketApiLogs', {
      logGroupName: `/aws/apigateway/${webSocketApi.ref}/prod`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Deploy the API
    const deployment = new apigatewayv2.CfnDeployment(this, 'Deployment', {
      apiId: webSocketApi.ref,
    });

    // Make sure deployment happens after routes are created
    deployment.addDependency(connectRoute);
    deployment.addDependency(disconnectRoute);
    deployment.addDependency(messageRoute);
    deployment.addDependency(defaultRoute);

    const stage = new apigatewayv2.CfnStage(this, 'Stage', {
      apiId: webSocketApi.ref,
      stageName: 'prod',
      deploymentId: deployment.ref,
      // Add CloudWatch logs configuration
      defaultRouteSettings: {
        dataTraceEnabled: true,
        loggingLevel: 'INFO',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 100,
      },
      accessLogSettings: {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          caller: '$context.identity.caller',
          user: '$context.identity.user',
          requestTime: '$context.requestTime',
          eventType: '$context.eventType',
          routeKey: '$context.routeKey',
          status: '$context.status',
          connectionId: '$context.connectionId',
          responseLength: '$context.responseLength',
          integrationErrorMessage: '$context.integrationErrorMessage',
          errorMessage: '$context.error.message',
        }),
      },
    });

    // Grant permissions for API Gateway to invoke Lambda functions
    // Use more specific permissions for the WebSocket API stage
    connectHandler.addPermission('ApiGatewayInvokeConnect', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/${stage.stageName}/$connect`,
    });

    disconnectHandler.addPermission('ApiGatewayInvokeDisconnect', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/${stage.stageName}/$disconnect`,
    });

    messageHandler.addPermission('ApiGatewayInvokeMessage', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/${stage.stageName}/message`,
    });

    messageHandler.addPermission('ApiGatewayInvokeDefault', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/${stage.stageName}/$default`,
    });

    // Add a more permissive fallback permission if needed
    connectHandler.addPermission('ApiGatewayInvokeConnectWildcard', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/$connect`,
    });

    // Associate the API Gateway logging role with the WebSocket API
    const accountId = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayLoggingRole.roleArn,
    });

    // Make sure the account settings are updated before the API is deployed
    stage.node.addDependency(accountId);

    // Output the WebSocket URL and Kinesis Stream name
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: `wss://${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/${stage.stageName}`,
    });

    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: dataStream.streamName,
      description: 'Kinesis Data Stream Name',
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: dataStream.streamArn,
      description: 'Kinesis Data Stream ARN',
    });
  }
}
