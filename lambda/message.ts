import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

interface MessageBody {
  message?: string;
  [key: string]: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket message event:', JSON.stringify(event, null, 2));
  
  if (!event.requestContext.connectionId || !event.requestContext.domainName || !event.requestContext.stage) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required request context' })
    };
  }

  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  
  // Initialize API Gateway Management API client
  const apiGwManagementClient = new ApiGatewayManagementApiClient({
    endpoint: `https://${domain}/${stage}`
  });
  
  try {
    // Parse the message body
    let body: MessageBody;
    try {
      body = event.body ? JSON.parse(event.body) : { message: '' };
    } catch (e) {
      body = { message: event.body || '' };
    }
    
    // Echo the message back to the client
    const response = {
      message: 'Message received',
      data: body,
      timestamp: new Date().toISOString()
    };
    
    // Create command to post to the connection
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(response))
    });
    
    // Send the response back to the WebSocket connection
    await apiGwManagementClient.send(command);
    
    return {
      statusCode: 200,
      body: 'Message processed'
    };
  } catch (error) {
    console.error(`Error processing message from connection ${connectionId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message })
    };
  }
};
