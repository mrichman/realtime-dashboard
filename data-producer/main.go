package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/joho/godotenv"
)

// Metric defines the structure for metric configuration
type Metric struct {
	ID    string  `json:"id"`
	Label string  `json:"label"`
	Min   float64 `json:"min"`
	Max   float64 `json:"max"`
	Unit  string  `json:"unit"`
}

// MetricData defines the structure for metric data sent to Kinesis
type MetricData struct {
	ID        string  `json:"id"`
	Label     string  `json:"label"`
	Value     float64 `json:"value"`
	Unit      string  `json:"unit"`
	Timestamp string  `json:"timestamp"`
}

// Configuration constants
const (
	defaultStreamName = "dashboard-updates"
	defaultRegion     = "us-east-1"
	defaultIntervalMs = 100
	minIntervalMs     = 1 // Minimum allowed interval to prevent panic
)

var metrics = []Metric{
	{ID: "cpu", Label: "CPU Usage", Min: 0, Max: 100, Unit: "%"},
	{ID: "memory", Label: "Memory Usage", Min: 0, Max: 16, Unit: "GB"},
	{ID: "network", Label: "Network Traffic", Min: 0, Max: 1000, Unit: "Mbps"},
	{ID: "users", Label: "Active Users", Min: 10, Max: 1000, Unit: "users"},
}

func main() {
	// Load environment variables from .env file if it exists
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Get configuration from environment variables
	streamName := getEnv("STREAM_NAME", defaultStreamName)
	region := getEnv("AWS_REGION", defaultRegion)
	intervalMs := getEnvAsInt("INTERVAL_MS", defaultIntervalMs)

	// Validate interval to prevent panic with non-positive ticker duration
	if intervalMs <= 0 {
		log.Printf("Warning: INTERVAL_MS must be positive, using default: %d", defaultIntervalMs)
		intervalMs = defaultIntervalMs
	} else if intervalMs < minIntervalMs {
		log.Printf("Warning: INTERVAL_MS=%d is too small, using minimum value: %d", intervalMs, minIntervalMs)
		intervalMs = minIntervalMs
	}

	log.Printf("Starting Kinesis data producer for stream: %s in region: %s with interval: %dms", streamName, region, intervalMs)

	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		log.Fatalf("Failed to load AWS configuration: %v", err)
	}

	// Create Kinesis client
	kinesisClient := kinesis.NewFromConfig(cfg)

	// Start sending data at regular intervals
	ticker := time.NewTicker(time.Duration(intervalMs) * time.Millisecond)
	defer ticker.Stop()

	log.Println("Data producer started. Press Ctrl+C to stop.")

	for range ticker.C {
		err := sendMetricData(kinesisClient, streamName)
		if err != nil {
			log.Printf("Error sending data: %v", err)
		}
	}
}

// sendMetricData generates and sends random metric data to Kinesis
func sendMetricData(client *kinesis.Client, streamName string) error {
	// Select a random metric
	metric := metrics[rand.Intn(len(metrics))]

	// Generate random value within range
	value := metric.Min + rand.Float64()*(metric.Max-metric.Min)

	// Create metric data
	data := MetricData{
		ID:        metric.ID,
		Label:     metric.Label,
		Value:     value,
		Unit:      metric.Unit,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	// Convert data to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Create Kinesis record
	record := &kinesis.PutRecordInput{
		StreamName:   aws.String(streamName),
		Data:         jsonData,
		PartitionKey: aws.String(metric.ID),
	}

	// Send record to Kinesis
	result, err := client.PutRecord(context.TODO(), record)
	if err != nil {
		return fmt.Errorf("failed to put record to Kinesis: %w", err)
	}

	log.Printf("Message sent to Kinesis stream %s: %+v", streamName, data)
	log.Printf("Shard ID: %s, Sequence Number: %s", *result.ShardId, *result.SequenceNumber)

	return nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt gets an environment variable as an integer or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("Warning: Invalid value for %s, using default: %d", key, defaultValue)
		return defaultValue
	}

	return value
}
