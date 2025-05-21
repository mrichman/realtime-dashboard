# AWS Native Realtime Dashboard

A realtime web application that receives and displays dashboard data with <100ms latency using Amazon Kinesis Data Streams as the data source and React.js for the frontend.

## Disclaimer

This solution is provided "as is" without warranties of any kind, either express or implied. Amazon Web Services (AWS) and its affiliates make no representations or warranties regarding the accuracy, reliability, or performance of this solution.

By using this solution, you acknowledge and agree that AWS shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses resulting from the use or inability to use this solution.

The cost estimates provided are approximations only and actual costs may vary based on your specific usage patterns, AWS region, and other factors. You are solely responsible for monitoring and managing your AWS costs.

This solution is not an official AWS product and is not covered by AWS Support. For assistance with this solution, please refer to community resources or engage AWS Professional Services.

## Features

- Realtime data updates with <100ms latency
- Interactive dashboard with metrics and charts
- Automatic reconnection if connection is lost
- Secure access with HTTP Basic Authentication
- Scalable architecture that can handle thousands of concurrent users
- Fully automated infrastructure deployment
- WebSocket API with proper route configuration for bidirectional communication
- Robust error handling and reconnection logic

## Requirements

- Node.js 14+
- AWS CLI configured with appropriate permissions
- AWS CDK installed globally (`npm install -g aws-cdk`)

## Architecture

- **Amazon Kinesis Data Streams**: Managed service for real-time data streaming
- **API Gateway WebSockets**: Provides bidirectional communication with clients
- **AWS Lambda**: Processes data from Kinesis and broadcasts to connected clients
- **Amazon DynamoDB**: Stores WebSocket connection information
- **React.js**: Frontend framework for building the dashboard UI
- **AWS CDK**: Infrastructure as code for automated deployment

## Project Structure

```text
realtime-dashboard/
├── infrastructure/         # CDK infrastructure code
│   ├── lib/                # Main CDK stack definition
│   ├── bin/                # CDK app entry point
│   └── lambda/             # Lambda function code for WebSocket handlers
├── scripts/                # Utility scripts
└── frontend/               # React frontend
    ├── src/                # Frontend source code
    │   ├── components/     # React components
    │   ├── context/        # React context providers
    │   └── utils/          # Utility functions
    └── public/             # Static assets
```

## WebSocket API Routes

The API Gateway WebSocket API includes the following routes:

- **$connect**: Handles new client connections and stores connection IDs in DynamoDB
- **$disconnect**: Handles client disconnections and removes connection IDs from DynamoDB
- **message**: Processes messages from clients
- **$default**: Handles messages that don't match other routes

## Authentication

The dashboard is protected with HTTP Basic Authentication:

- Default credentials:
  - Username: admin
  - Password: password
- Authentication state is persisted in localStorage
- Logout functionality is provided in the UI

## Deployment Instructions

### 1. Deploy AWS Infrastructure

```bash
cd infrastructure
npm install
npm run build
cdk deploy
```

After deployment, note the outputs:

- WebSocketURL
- KinesisStreamName
- KinesisStreamArn

### 2. Set up the Frontend

```bash
cd frontend
npm install

# Update .env with your WebSocket URL
echo "REACT_APP_WEBSOCKET_URL=<WebSocketURL>" > .env

npm start
```

### 3. Run the Data Producer (for testing)

```bash
cd scripts
npm install

# Create .env file with your AWS credentials and Kinesis stream name
cp .env.example .env
# Edit .env with your values

node kinesisDataProducer.js
```

## Troubleshooting

If you encounter deployment issues:

1. Ensure all Lambda functions have the necessary permissions
2. Verify that WebSocket API routes are properly configured
3. Check CloudWatch logs for any Lambda function errors
4. Verify IAM permissions for Kinesis access
5. Check browser console for WebSocket connection errors

## Security Considerations

- HTTP Basic Authentication protects the dashboard from unauthorized access
- All Lambda functions run with least-privilege IAM roles
- API Gateway WebSocket connections use secure WebSocket (wss://) protocol
- Authentication state is stored in browser localStorage

## Recent Updates

- Added HTTP Basic Authentication for dashboard access
- Fixed Chart.js integration issues for better data visualization
- Improved WebSocket reconnection logic for better reliability
- Enhanced error handling throughout the application
- Optimized Lambda functions for better performance

## Cost Considerations

This solution uses several AWS services that incur costs. Below are the primary cost components:

### Amazon Kinesis Data Streams

- **Pricing Model**: Pay for provisioned capacity
- **Shard Hours**: $0.015 per shard hour
- **PUT Payload Units**: $0.014 per million units
- **Extended Data Retention**: Additional charges for retention beyond 24 hours
- **Cost Factors**: Number of shards, data volume, retention period

### AWS Lambda

- **Pricing Model**: Pay-per-request and compute duration
- **Optimization**: Using ARM64 architecture reduces costs by ~20%
- **Estimated Cost**: $0.20 per million invocations + $0.0000133 per GB-second
- **Cost Factors**: Number of connections, message frequency, function duration

### Amazon API Gateway (WebSockets)

- **Connection Pricing**: $0.25 per million connection minutes
- **Message Pricing**: $1.00 per million messages
- **Cost Factors**: Number of concurrent connections, message volume

### Amazon DynamoDB

- **Pricing Model**: On-demand capacity mode (pay-per-request)
- **Estimated Cost**: $1.25 per million write requests, $0.25 per million read requests
- **Cost Factors**: Number of connections, connection churn rate

### Cost Optimization Tips

1. Implement connection idle timeouts to reduce WebSocket connection costs
2. Use DynamoDB TTL to automatically remove stale connections
3. Monitor usage with AWS Cost Explorer and set up budget alerts
4. Consider implementing message batching for high-volume scenarios

For a detailed cost estimate based on your specific usage patterns, use the [AWS Pricing Calculator](https://calculator.aws).
