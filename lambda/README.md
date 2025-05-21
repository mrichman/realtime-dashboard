# Realtime Dashboard Lambda Functions

This directory contains TypeScript Lambda functions for the realtime dashboard application.

## Functions

- `connect.ts` - Handles WebSocket connections
- `disconnect.ts` - Handles WebSocket disconnections
- `message.ts` - Processes messages from WebSocket clients
- `kinesisProducer.ts` - Generates random metric data and sends it to Kinesis
- `kinesisConsumer.ts` - Processes Kinesis records and forwards them to WebSocket clients

## Development

### Prerequisites

- Node.js 18+
- TypeScript

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

This will compile the TypeScript files to JavaScript in the `dist` directory.

### Deploy

The Lambda functions are deployed as part of the CDK stack in the `infrastructure` directory.

## Environment Variables

- `CONNECTIONS_TABLE` - DynamoDB table name for storing WebSocket connections
- `STREAM_NAME` - Kinesis stream name
- `WEBSOCKET_ENDPOINT` - WebSocket API endpoint
