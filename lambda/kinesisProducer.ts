import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import { Context, ScheduledEvent } from 'aws-lambda';

// Configuration
interface Metric {
  id: string;
  label: string;
  min: number;
  max: number;
  unit: string;
}

const METRICS: Metric[] = [
  { id: 'cpu', label: 'CPU Usage', min: 0, max: 100, unit: '%' },
  { id: 'memory', label: 'Memory Usage', min: 0, max: 16, unit: 'GB' },
  { id: 'network', label: 'Network Traffic', min: 0, max: 1000, unit: 'Mbps' },
  { id: 'users', label: 'Active Users', min: 10, max: 1000, unit: 'users' }
];

// Initialize the Kinesis client
const kinesisClient = new KinesisClient({});

// Generate random value within range
function getRandomValue(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export const handler = async (event: ScheduledEvent, context: Context): Promise<any> => {
  try {
    // Generate data for a random metric
    const metric = METRICS[Math.floor(Math.random() * METRICS.length)];
    const data = {
      id: metric.id,
      label: metric.label,
      value: getRandomValue(metric.min, metric.max),
      unit: metric.unit,
      timestamp: new Date().toISOString()
    };
    
    // Create a command to put a record into Kinesis
    const command = new PutRecordCommand({
      StreamName: process.env.STREAM_NAME,
      Data: Buffer.from(JSON.stringify(data)),
      PartitionKey: metric.id // Use metric ID as partition key
    });
    
    // Send the record to Kinesis
    const response = await kinesisClient.send(command);
    
    console.log(`Message sent to Kinesis stream ${process.env.STREAM_NAME}:`, data);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data sent to Kinesis',
        shardId: response.ShardId,
        sequenceNumber: response.SequenceNumber,
        data: data
      })
    };
  } catch (error) {
    console.error('Error in Kinesis producer:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error sending data to Kinesis',
        error: (error as Error).message
      })
    };
  }
};
