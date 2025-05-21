import { KinesisStreamEvent, KinesisStreamRecord, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

interface Connection {
  connectionId: string;
  timestamp: string;
}

export const handler = async (event: KinesisStreamEvent, context: Context): Promise<any> => {
  console.log('Received Kinesis event:', JSON.stringify(event, null, 2));
  
  try {
    // Get all connections from DynamoDB
    const connectionsResponse = await ddbDocClient.send(new ScanCommand({
      TableName: process.env.CONNECTIONS_TABLE
    }));
    
    if (!connectionsResponse.Items || connectionsResponse.Items.length === 0) {
      console.log('No active connections found');
      return { statusCode: 200, body: 'No connections to send to' };
    }
    
    console.log(`Found ${connectionsResponse.Items.length} active connections`);
    
    // Initialize API Gateway Management API client
    const apiGwManagementClient = new ApiGatewayManagementApiClient({
      endpoint: process.env.WEBSOCKET_ENDPOINT
    });
    
    // Process each record from Kinesis
    const recordPromises = event.Records.map(async (record: KinesisStreamRecord) => {
      // Decode and parse the data from Kinesis
      const payload = Buffer.from(record.kinesis.data, 'base64').toString();
      const data = JSON.parse(payload);
      
      console.log('Processing Kinesis record:', data);
      
      // Send the data to each connected client
      const connectionPromises = (connectionsResponse.Items || []).map(async (connection) => {
        const connectionId = connection.connectionId as string;
        try {
          console.log(`Sending data to connection: ${connectionId}`);
          
          // Create command to post to the connection
          const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(data))
          });
          
          // Send the data to the WebSocket connection
          await apiGwManagementClient.send(command);
        } catch (error) {
          const typedError = error as { statusCode?: number };
          if (typedError.statusCode === 410) {
            // Connection is gone, delete from table
            console.log(`Connection ${connectionId} is stale, removing from database`);
            await ddbDocClient.send(new DeleteCommand({
              TableName: process.env.CONNECTIONS_TABLE || '',
              Key: { connectionId }
            }));
          } else {
            console.error(`Error sending message to connection ${connectionId}:`, error);
          }
        }
      });
      
      await Promise.all(connectionPromises);
    });
    
    await Promise.all(recordPromises);
    
    return { statusCode: 200, body: 'Data sent to all connections' };
  } catch (error) {
    console.error('Error processing Kinesis records:', error);
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
};
