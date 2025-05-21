import React from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  timestamp?: string;
  trend?: 'up' | 'down' | 'stable';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, timestamp, trend, thresholds }) => {
  // Format the value based on type
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      return val.toFixed(2);
    }
    return val || 'N/A';
  };
  
  // Determine status based on thresholds
  const getStatus = (): string => {
    if (!thresholds || typeof value !== 'number') return 'normal';
    
    if (thresholds.critical && value >= thresholds.critical) {
      return 'critical';
    }
    if (thresholds.warning && value >= thresholds.warning) {
      return 'warning';
    }
    return 'normal';
  };
  
  // Get trend icon
  const getTrendIcon = (): React.ReactNode => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <span className="trend-icon trend-up">↑</span>;
      case 'down':
        return <span className="trend-icon trend-down">↓</span>;
      case 'stable':
        return <span className="trend-icon trend-stable">→</span>;
      default:
        return null;
    }
  };
  
  const status = getStatus();
  
  return (
    <div className={`metric-card status-${status}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        {getTrendIcon()}
      </div>
      
      <div className="metric-value">
        {formatValue(value)}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      
      {timestamp && (
        <div className="metric-timestamp">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
