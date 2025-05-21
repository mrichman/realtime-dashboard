import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ConnectionStatus from './components/ConnectionStatus';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
  isConnected,
  setDashboardDataCallback
} from './utils/websocket';

interface Metric {
  id: string;
  value: number;
  label: string;
  unit?: string;
  category?: string;
  timestamp: string;
  trend?: 'up' | 'down' | 'stable';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

interface MessageData {
  type: string;
  data: Metric | Metric[];
  timestamp?: string;
}

interface ServerResponse {
  message: string;
  data: MessageData;
  timestamp: string;
}

// Protected component that requires authentication
const ProtectedApp: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<Record<string, Metric>>({});
  const [lastMessage, setLastMessage] = useState<Date | null>(null);
  const { username, logout } = useAuth();

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      setLastMessage(new Date());

      // Handle different message types
      if (message.type === 'update') {
        // Update a specific metric
        setDashboardData((prevData) => ({
          ...prevData,
          [message.data.id]: {
            ...message.data,
            timestamp: message.timestamp || new Date().toISOString(),
          },
        }));
      } else if (message.type === 'batch-update') {
        // Handle batch updates
        const updates: Record<string, Metric> = {};
        message.data.forEach((item: Metric) => {
          updates[item.id] = {
            ...item,
            timestamp:
              item.timestamp || message.timestamp || new Date().toISOString(),
          };
        });

        setDashboardData((prevData) => ({
          ...prevData,
          ...updates,
        }));
      } else if (message.type === 'clear') {
        // Clear all data
        setDashboardData({});
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }, []);

  // Process dashboard data from WebSocket
  const handleDashboardData = useCallback((data: ServerResponse) => {
    // Check if this is a server response with message field
    if (data.message === "Message received" && data.data) {
      const message = data.data;
      
      if (message.type === 'update') {
        // Update a specific metric
        setDashboardData((prevData) => ({
          ...prevData,
          [(message.data as Metric).id]: {
            ...(message.data as Metric),
            timestamp: message.timestamp || new Date().toISOString(),
          },
        }));
      } else if (message.type === 'batch-update') {
        // Handle batch updates
        const updates: Record<string, Metric> = {};
        (message.data as Metric[]).forEach((item: Metric) => {
          updates[item.id] = {
            ...item,
            timestamp:
              item.timestamp || message.timestamp || new Date().toISOString(),
          };
        });

        setDashboardData((prevData) => ({
          ...prevData,
          ...updates,
        }));
      } else if (message.type === 'clear') {
        // Clear all data
        setDashboardData({});
      }
      
      setLastMessage(new Date());
    }
  }, []);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const connect = async () => {
      try {
        // Set up the dashboard data callback
        setDashboardDataCallback(handleDashboardData);
        
        // Connect to WebSocket
        await connectWebSocket(
          handleWebSocketMessage,
          () => console.log('WebSocket connection established'),
          () => console.log('WebSocket connection closed')
        );
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    connect();

    // Disconnect when component unmounts
    return () => {
      disconnectWebSocket();
    };
  }, [handleWebSocketMessage, handleDashboardData]);

  // Send a test message to the WebSocket API
  const sendTestData = () => {
    if (!isConnected()) {
      alert(
        'WebSocket is not connected. Please wait for connection to be established or click reconnect.',
      );
      return;
    }

    const testData: Metric = {
      id: `metric-${Date.now()}`,
      value: Math.random() * 100,
      label: 'Test Metric',
      unit: 'units',
      category: 'Test',
      timestamp: new Date().toISOString(),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      thresholds: {
        warning: 70,
        critical: 90,
      },
    };

    sendMessage({
      action: 'message',
      type: 'update',
      data: testData,
    });
  };

  // Generate multiple test metrics
  const generateTestData = () => {
    if (!isConnected()) {
      alert(
        'WebSocket is not connected. Please wait for connection to be established or click reconnect.',
      );
      return;
    }

    const categories = ['System', 'Network', 'Database', 'Application'];
    const metrics: Metric[] = [];

    // Generate 5 random metrics
    for (let i = 0; i < 5; i++) {
      const value = Math.random() * 100;
      metrics.push({
        id: `metric-${Date.now()}-${i}`,
        value: value,
        label: `Test Metric ${i + 1}`,
        unit: i % 2 === 0 ? '%' : 'ms',
        category: categories[i % categories.length],
        timestamp: new Date().toISOString(),
        trend: value > 50 ? 'up' : 'down',
        thresholds: {
          warning: 70,
          critical: 90,
        },
      });
    }

    sendMessage({
      action: 'message',
      type: 'batch-update',
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <h1>Realtime Dashboard</h1>
          <div className="user-info">
            <span>Logged in as: {username}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>
        <ConnectionStatus />

        <div className="controls">
          <button className="control-button" onClick={sendTestData}>
            Send Test Metric
          </button>

          <button className="control-button" onClick={generateTestData}>
            Generate Test Data
          </button>

          <button
            className="control-button danger"
            onClick={() => setDashboardData({})}
          >
            Clear Dashboard
          </button>
        </div>

        {lastMessage && (
          <div className="last-message">
            Last update: {lastMessage.toLocaleTimeString()}
          </div>
        )}
      </header>

      <main className="App-main">
        <Dashboard data={dashboardData} />
      </main>

      <footer className="App-footer">
        <p>Realtime Dashboard powered by AWS Kinesis Data Streams</p>
      </footer>
    </div>
  );
};

// Main App component with authentication
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <ProtectedApp /> : <Login />;
};

// Wrap the app with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
