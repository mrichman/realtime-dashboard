import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket connect event:', JSON.stringify(event, null, 2));
  
  if (!event.requestContext.connectionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing connectionId' })
    };
  }

  const connectionId = event.requestContext.connectionId;
  
  try {
    // Store the connection ID in DynamoDB
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId: connectionId,
        timestamp: new Date().toISOString()
      }
    }));
    
    console.log(`Connection ${connectionId} stored in DynamoDB`);
    
    return {
      statusCode: 200,
      body: 'Connected'
    };
  } catch (error) {
    console.error(`Error storing connection ${connectionId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message })
    };
  }
};
