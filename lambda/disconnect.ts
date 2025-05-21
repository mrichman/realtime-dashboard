import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket disconnect event:', JSON.stringify(event, null, 2));
  
  if (!event.requestContext.connectionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing connectionId' })
    };
  }

  const connectionId = event.requestContext.connectionId;
  
  try {
    // Remove the connection ID from DynamoDB
    await ddbDocClient.send(new DeleteCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: {
        connectionId: connectionId
      }
    }));
    
    console.log(`Connection ${connectionId} removed from DynamoDB`);
    
    return {
      statusCode: 200,
      body: 'Disconnected'
    };
  } catch (error) {
    console.error(`Error removing connection ${connectionId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message })
    };
  }
};
