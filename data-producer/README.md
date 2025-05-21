# Kinesis Data Producer for Realtime Dashboard

This Go application generates random metric data and sends it to an AWS Kinesis Data Stream for the realtime dashboard application.

## Features

- Generates random metrics data (CPU, Memory, Network, Users)
- Sends data to AWS Kinesis Data Stream at configurable intervals
- Configurable via environment variables or .env file
- Low latency (<100ms between data points)

## Requirements

- Go 1.16 or higher
- AWS credentials configured (via environment variables, shared credentials file, or IAM role)
- AWS Kinesis Data Stream

## Configuration

Configuration is done via environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `STREAM_NAME` | Name of the Kinesis Data Stream | `dashboard-updates` |
| `AWS_REGION` | AWS Region | `us-east-1` |
| `INTERVAL_MS` | Interval between data points in milliseconds (minimum 1ms) | `100` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | - |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | - |

## Building

You can use the provided Makefile to build and run the application:

```bash
# Build the application
make build

# Build and run the application
make run

# Build for multiple platforms
make build-all

# Clean build artifacts
make clean

# Show all available targets
make help
```

## Running

```bash
# Using environment variables
STREAM_NAME=my-stream AWS_REGION=us-west-2 ./data-producer

# Or using .env file
./data-producer
```

## Docker

Build the Docker image:

```bash
docker build -t realtime-dashboard/data-producer .
```

Run the container:

```bash
docker run -e STREAM_NAME=my-stream -e AWS_REGION=us-west-2 realtime-dashboard/data-producer
```
