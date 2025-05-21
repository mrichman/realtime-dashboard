#!/usr/bin/env ts-node

// Usage:
// STREAM_NAME=dashboard-updates AWS_REGION=us-east-1 ts-node kinesisDataProducer.ts

// Import AWS SDK v3 modules
import {
  KinesisClient,
  PutRecordCommand,
  type PutRecordCommandOutput,
} from '@aws-sdk/client-kinesis';
import * as dotenv from 'dotenv';

// Define interfaces for type safety
interface Metric {
  id: string;
  label: string;
  min: number;
  max: number;
  unit: string;
}

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: string;
  timestamp: string;
}

// Configuration
const STREAM_NAME: string = process.env.STREAM_NAME || 'dashboard-updates';
const INTERVAL_MS: number = 100; // 100ms for <100ms latency requirement
const METRICS: Metric[] = [
  { id: 'cpu', label: 'CPU Usage', min: 0, max: 100, unit: '%' },
  { id: 'memory', label: 'Memory Usage', min: 0, max: 16, unit: 'GB' },
  { id: 'network', label: 'Network Traffic', min: 0, max: 1000, unit: 'Mbps' },
  { id: 'users', label: 'Active Users', min: 10, max: 1000, unit: 'users' },
];

// Initialize the Kinesis client with region
const region: string = process.env.AWS_REGION || 'us-east-1';
const kinesisClient: KinesisClient = new KinesisClient({ region });

// Generate random value within range
function getRandomValue(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Start sending data
async function startDataProducer(): Promise<void> {
  console.log('Starting Kinesis data producer...');

  // Send data at regular intervals
  setInterval(async () => {
    try {
      // Generate data for a random metric
      const metric: Metric =
        METRICS[Math.floor(Math.random() * METRICS.length)];
      const data: MetricData = {
        id: metric.id,
        label: metric.label,
        value: getRandomValue(metric.min, metric.max),
        unit: metric.unit,
        timestamp: new Date().toISOString(),
      };

      // Create a command to put a record into Kinesis
      const command = new PutRecordCommand({
        StreamName: STREAM_NAME,
        Data: Buffer.from(JSON.stringify(data)),
        PartitionKey: metric.id, // Use metric ID as partition key
      });

      // Send the record to Kinesis
      const response: PutRecordCommandOutput = await kinesisClient.send(
        command,
      );

      console.log(`Message sent to Kinesis stream ${STREAM_NAME}:`, data);
      console.log(
        `Shard ID: ${response.ShardId}, Sequence Number: ${response.SequenceNumber}`,
      );
    } catch (error) {
      console.error('Error in data producer:', error);
    }
  }, INTERVAL_MS);
}

// Set environment variables from command line arguments or .env file
dotenv.config();

// Check required environment variables
if (!process.env.STREAM_NAME) {
  console.warn(
    'STREAM_NAME environment variable not set, using default: dashboard-updates',
  );
}

// Start the producer
startDataProducer().catch((error: Error) => {
  console.error('Failed to start data producer:', error);
  process.exit(1);
});
