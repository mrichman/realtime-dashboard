import React, { useState, useEffect } from 'react';
import { getConnectionState, forceReconnect } from '../utils/websocket';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  
  useEffect(() => {
    // Update connection status every second
    const interval = setInterval(() => {
      const state = getConnectionState();
      
      // Only update state if it changed to avoid unnecessary re-renders
      if (state !== connectionState) {
        setConnectionState(state);
        
        if (state === 'CONNECTED') {
          setLastUpdated(new Date());
          setReconnecting(false);
        } else if (state === 'CONNECTING') {
          setReconnecting(true);
        }
      }
    }, 500); // Check more frequently
    
    return () => clearInterval(interval);
  }, [connectionState]);
  
  const getStatusClass = (): string => {
    switch (connectionState) {
      case 'CONNECTED':
        return 'status-connected';
      case 'CONNECTING':
        return 'status-connecting';
      case 'DISCONNECTED':
      case 'CLOSING':
        return 'status-disconnected';
      default:
        return 'status-unknown';
    }
  };
  
  const handleReconnectClick = (): void => {
    setReconnecting(true);
    forceReconnect();
  };
  
  return (
    <div className="connection-status-container">
      <div className={`connection-status ${getStatusClass()}`}>
        <div className="status-indicator"></div>
        <div className="status-text">
          <span className="status-label">Status:</span> {connectionState}
          {reconnecting && connectionState !== 'CONNECTED' && (
            <span className="reconnecting-text"> (reconnecting...)</span>
          )}
        </div>
        {connectionState !== 'CONNECTED' && (
          <button 
            className="reconnect-button"
            onClick={handleReconnectClick}
            disabled={reconnecting || connectionState === 'CONNECTING'}
          >
            Reconnect
          </button>
        )}
      </div>
      {lastUpdated && (
        <div className="last-updated">
          Last connected: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
