import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import MetricCard from './MetricCard';
import Chart from './Chart';

interface Metric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  category?: string;
  timestamp: string;
  trend?: 'up' | 'down' | 'stable';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  color?: string;
}

interface DataPoint {
  value: number;
  timestamp: string;
}

interface ChartSeries {
  id: string;
  label: string;
  data: DataPoint[];
  color?: string;
}

interface DashboardProps {
  data: Record<string, Metric>;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [historicalData, setHistoricalData] = useState<
    Record<string, DataPoint[]>
  >({});

  // Process incoming data and maintain historical data for charts
  useEffect(() => {
    const currentMetrics = Object.values(data);
    setMetrics(currentMetrics);

    // Update historical data for charting
    const newHistoricalData = { ...historicalData };

    currentMetrics.forEach((metric) => {
      if (!metric.id) return;

      if (!newHistoricalData[metric.id]) {
        newHistoricalData[metric.id] = [];
      }

      // Add new data point
      newHistoricalData[metric.id].push({
        value: metric.value,
        timestamp: metric.timestamp,
      });

      // Keep only the last 100 data points for each metric
      if (newHistoricalData[metric.id].length > 100) {
        newHistoricalData[metric.id] = newHistoricalData[metric.id].slice(-100);
      }
    });

    setHistoricalData(newHistoricalData);
    // eslint-disable-next-line
  }, [data]);

  // Group metrics by category for better organization
  const groupedMetrics: Record<string, Metric[]> = metrics.reduce(
    (groups: Record<string, Metric[]>, metric) => {
      const category = metric.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(metric);
      return groups;
    },
    {},
  );

  // Prepare data for charts
  const chartData: ChartSeries[] = Object.entries(historicalData).map(
    ([id, dataPoints]) => {
      const metric = metrics.find((m) => m.id === id);
      return {
        id,
        label: metric ? metric.label : id,
        data: dataPoints,
        color: metric?.color,
      };
    },
  );

  return (
    <div className="dashboard">
      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <div key={category} className="dashboard-section">
          <h2 className="section-title">{category}</h2>
          <div className="metrics-container">
            {categoryMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.label}
                value={metric.value}
                unit={metric.unit}
                timestamp={metric.timestamp}
                trend={metric.trend}
                thresholds={metric.thresholds}
              />
            ))}
          </div>
        </div>
      ))}

      {chartData.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Trends</h2>
          <div className="charts-container">
            <Chart data={chartData} />
          </div>
        </div>
      )}

      {metrics.length === 0 && (
        <div className="no-data-message">
          <p>No data available. Waiting for updates...</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
