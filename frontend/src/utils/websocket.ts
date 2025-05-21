type MessageCallback = (event: MessageEvent) => void;
type EventCallback = (event: Event) => void;
type DashboardDataCallback = (data: any) => void;

let websocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 2000;
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;
let messageCallback: MessageCallback | null = null;
let openCallback: EventCallback | null = null;
let closeCallback: EventCallback | null = null;
let reconnectTimer: number | null = null;
let dashboardDataCallback: DashboardDataCallback | null = null;

/**
 * Set callback for dashboard data processing
 * @param {Function} callback - Function to process dashboard data
 */
export const setDashboardDataCallback = (callback: DashboardDataCallback): void => {
  dashboardDataCallback = callback;
};

/**
 * Connect to the WebSocket API
 * @param {Function} onMessage - Callback for incoming messages
 * @param {Function} onOpen - Callback when connection is established
 * @param {Function} onClose - Callback when connection is closed
 * @returns {Promise} - Resolves when connection is established
 */
export const connectWebSocket = (
  onMessage?: MessageCallback,
  onOpen?: EventCallback,
  onClose?: EventCallback
): Promise<WebSocket> => {
  // Store callbacks for reconnection
  if (onMessage) messageCallback = onMessage;
  if (onOpen) openCallback = onOpen;
  if (onClose) closeCallback = onClose;
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return Promise.resolve(websocket);
  }
  
  if (websocket && (websocket.readyState === WebSocket.CONNECTING || 
                    websocket.readyState === WebSocket.CLOSING)) {
    console.log(`WebSocket is in ${getConnectionState()} state, waiting...`);
    return Promise.resolve(websocket);
  }
  
  if (websocket) {
    try {
      websocket.close();
    } catch (e) {
      console.warn('Error closing existing websocket:', e);
    }
  }
  
  return new Promise((resolve, reject) => {
    try {
      if (!WEBSOCKET_URL) {
        reject(new Error('WebSocket URL is not defined'));
        return;
      }
      
      console.log(`Connecting to WebSocket: ${WEBSOCKET_URL}`);
      websocket = new WebSocket(WEBSOCKET_URL);
      
      websocket.onopen = (event) => {
        console.log('WebSocket connected successfully');
        reconnectAttempts = 0;
        if (openCallback) openCallback(event);
        resolve(websocket as WebSocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          if (messageCallback) messageCallback(event);
          
          // Process dashboard data if callback is set
          if (dashboardDataCallback && typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              dashboardDataCallback(data);
            } catch (error) {
              console.error('Error processing dashboard data:', error);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      websocket.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        if (closeCallback) closeCallback(event);
        
        // Clear any existing reconnect timer
        if (reconnectTimer) {
          window.clearTimeout(reconnectTimer);
        }
        
        // Always attempt to reconnect, regardless of close code
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts - 1), 30000);
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
          
          reconnectTimer = window.setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.error('Maximum reconnection attempts reached');
          // Reset attempts after a longer delay and try again
          reconnectTimer = window.setTimeout(() => {
            reconnectAttempts = 0;
            connectWebSocket();
          }, 60000);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't reject here, let the onclose handler deal with reconnection
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      reject(error);
      
      // Try to reconnect even if initial connection fails
      reconnectTimer = window.setTimeout(() => {
        connectWebSocket();
      }, RECONNECT_INTERVAL);
    }
  });
};

/**
 * Disconnect from the WebSocket API
 */
export const disconnectWebSocket = (): void => {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (websocket) {
    console.log('Manually disconnecting WebSocket');
    try {
      websocket.close(1000, 'User initiated disconnect');
    } catch (e) {
      console.warn('Error during manual disconnect:', e);
    }
    websocket = null;
  }
};

/**
 * Send a message through the WebSocket connection
 * @param {Object} message - Message to send
 * @returns {Boolean} - True if message was sent successfully
 */
export const sendMessage = (message: any): boolean => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    const messageString = JSON.stringify(message);
    console.log('Sending WebSocket message:', messageString);
    websocket.send(messageString);
    return true;
  }
  
  console.warn('Cannot send message, WebSocket is not connected');
  // Try to reconnect if not connected
  if (!websocket || websocket.readyState !== WebSocket.CONNECTING) {
    connectWebSocket();
  }
  return false;
};

/**
 * Check if the WebSocket is currently connected
 * @returns {Boolean} - True if connected
 */
export const isConnected = (): boolean => {
  return websocket !== null && websocket.readyState === WebSocket.OPEN;
};

/**
 * Get the current connection state
 * @returns {String} - Connection state description
 */
export const getConnectionState = (): string => {
  if (!websocket) return 'DISCONNECTED';
  
  switch (websocket.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'CONNECTED';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'DISCONNECTED';
    default:
      return 'UNKNOWN';
  }
};

/**
 * Force a reconnection attempt
 */
export const forceReconnect = (): void => {
  reconnectAttempts = 0;
  if (websocket) {
    try {
      websocket.close();
    } catch (e) {
      console.warn('Error closing websocket during force reconnect:', e);
    }
  }
  connectWebSocket();
};
