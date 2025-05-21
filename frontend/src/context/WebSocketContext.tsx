import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  messages: any[];
  sendMessage: (message: string | object) => boolean;
  resetConnection: () => void;
  connectionAttempts: number;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [messages, setMessages] = useState<any[]>([]);
  
  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL;
    if (!wsUrl) {
      console.error('WebSocket URL not defined in environment variables');
      return;
    }
    
    console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
    };
    
    ws.onclose = (event: CloseEvent) => {
      console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
      setIsConnected(false);
      
      // Attempt to reconnect after a delay with exponential backoff
      const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempt), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempt + 1})`);
      
      setTimeout(() => {
        setReconnectAttempt(prev => prev + 1);
      }, delay);
    };
    
    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      // Don't set disconnected here, let onclose handle it
    };
    
    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.log('Raw message data:', event.data);
      }
    };
    
    setSocket(ws);
    
    // Cleanup function
    return () => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [reconnectAttempt]);
  
  // Connect on initial render and when reconnectAttempt changes
  useEffect(() => {
    const cleanup = connectWebSocket();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [reconnectAttempt, connectWebSocket]);
  
  // Send message function
  const sendMessage = useCallback((message: string | object): boolean => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageStr);
      console.log('Message sent:', message);
      return true;
    }
    console.warn('Cannot send message, WebSocket is not connected');
    return false;
  }, [socket]);
  
  // Reset connection function
  const resetConnection = useCallback((): void => {
    console.log('Manually resetting WebSocket connection');
    if (socket) {
      socket.close();
    }
    setReconnectAttempt(prev => prev + 1);
  }, [socket]);
  
  return (
    <WebSocketContext.Provider value={{ 
      isConnected, 
      messages, 
      sendMessage, 
      resetConnection,
      connectionAttempts: reconnectAttempt
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
