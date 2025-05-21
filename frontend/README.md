# Realtime Dashboard Frontend

This is the frontend application for the AWS Native Realtime Dashboard project. It connects to the WebSocket API to display real-time data updates.

## Features

- Real-time data visualization with <100ms latency
- Automatic WebSocket reconnection with exponential backoff
- Interactive charts using Chart.js
- Responsive design for desktop and mobile devices
- Visual indicators for connection status
- Support for different metric types and thresholds

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the WebSocket URL:

Create or update the `.env` file with your WebSocket URL from the CDK deployment:

```
REACT_APP_WEBSOCKET_URL=wss://your-api-id.execute-api.your-region.amazonaws.com/prod
```

3. Start the development server:

```bash
npm start
```

## Components

### App.js
The main application component that manages the WebSocket connection and overall layout.

### Dashboard.js
Displays the metrics and charts, organizing them by category.

### MetricCard.js
Individual metric display with support for thresholds and trend indicators.

### Chart.js
Time-series chart component using Chart.js.

### ConnectionStatus.js
Visual indicator of the WebSocket connection status.

## WebSocket Communication

The application connects to the WebSocket API and handles the following message types:

- `update`: Updates a single metric
- `batch-update`: Updates multiple metrics at once
- `clear`: Clears all dashboard data

Messages are sent in the following format:

```json
{
  "action": "message",
  "type": "update",
  "data": {
    "id": "metric-id",
    "value": 42.5,
    "label": "CPU Usage",
    "unit": "%",
    "category": "System",
    "timestamp": "2023-05-14T12:34:56.789Z",
    "trend": "up",
    "thresholds": {
      "warning": 70,
      "critical": 90
    }
  }
}
```

## Testing

You can use the "Send Test Metric" and "Generate Test Data" buttons to simulate data updates without needing a backend connection.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder that can be deployed to any static hosting service.
