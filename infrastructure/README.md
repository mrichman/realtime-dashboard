# Realtime Dashboard Infrastructure

This project contains the AWS CDK infrastructure code for the Realtime Dashboard application.

## Issue Fixed: Lambda AWS SDK Dependency

The Lambda functions were failing with the error:
```
Lambda execution failed with status 200 due to customer function error: Error: Cannot find module 'aws-sdk'
```

This was fixed by:

1. Adding a `package.json` file in the Lambda directory with the AWS SDK dependency:
```json
{
  "name": "realtime-dashboard-lambda",
  "version": "1.0.0",
  "description": "Lambda functions for realtime dashboard",
  "dependencies": {
    "aws-sdk": "^2.1531.0"
  }
}
```

2. Installing the dependencies in the Lambda directory:
```bash
cd lambda && npm install
```

3. Updating the CDK code to bundle the dependencies with the Lambda functions using the `bundling` option:
```typescript
code: lambda.Code.fromAsset('lambda', {
  bundling: {
    image: lambda.Runtime.NODEJS_22_X.bundlingImage,
    command: [
      'bash', '-c', [
        'npm install',
        'cp -r /asset-input/* /asset-output/',
      ].join(' && '),
    ],
  },
}),
```

## Deployment

To deploy this infrastructure:

```bash
npm run build
cdk deploy
```
