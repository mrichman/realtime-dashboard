import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import './Chart.css';

// Register all Chart.js components directly in this file
ChartJS.register(...registerables);

interface DataPoint {
  timestamp?: string | Date;
  value?: number;
}

interface Series {
  id?: string;
  label?: string;
  data: DataPoint[];
  color?: string;
}

interface ChartProps {
  data: Series[] | Series | any;
}

const DashboardChart: React.FC<ChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  
  useEffect(() => {
    // Always destroy the previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    
    // Ensure we have valid data and a canvas element
    if (!chartRef.current || !data) return;
    
    try {
      // Create a simple dataset structure that works with category scale
      let labels: string[] = [];
      let values: number[] = [];
      let chartData: any = {};
      
      // Handle different data formats
      if (Array.isArray(data)) {
        // Format 1: Array of series
        if (data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
          const datasets = data.map((series: Series, index: number) => {
            return {
              label: series.label || `Series ${index + 1}`,
              data: series.data.map((point: DataPoint) => point.value || 0),
              borderColor: getColor(index),
              backgroundColor: getColor(index, 0.2),
              borderWidth: 2,
              tension: 0.4
            };
          });
          
          // Use the timestamps from the first series for labels
          if (data[0].data && data[0].data.length > 0) {
            labels = data[0].data.map((point: DataPoint) => {
              if (point.timestamp) {
                return typeof point.timestamp === 'string' ? 
                  new Date(point.timestamp).toLocaleTimeString() : 
                  (point.timestamp as Date).toLocaleTimeString();
              }
              return '';
            });
          }
          
          chartData = {
            labels: labels,
            datasets: datasets
          };
        } else {
          // Format 2: Array of data points
          labels = data.map((point: DataPoint, index: number) => {
            if (point.timestamp) {
              return typeof point.timestamp === 'string' ? 
                new Date(point.timestamp).toLocaleTimeString() : 
                (point.timestamp as Date).toLocaleTimeString();
            }
            return `Point ${index + 1}`;
          });
          
          values = data.map((point: DataPoint) => point.value || 0);
          
          chartData = {
            labels: labels,
            datasets: [{
              label: 'Value',
              data: values,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              tension: 0.4
            }]
          };
        }
      } else if (typeof data === 'object') {
        // Format 3: Single metric object
        if (data.datasets && Array.isArray(data.datasets)) {
          // Already in Chart.js format
          chartData = data;
        } else if (data.value !== undefined) {
          // Single data point
          chartData = {
            labels: ['Current'],
            datasets: [{
              label: data.label || 'Value',
              data: [data.value],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2
            }]
          };
        } else {
          // Empty chart
          chartData = {
            labels: [],
            datasets: [{
              label: 'No Data',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2
            }]
          };
        }
      } else {
        // Fallback for any other data format
        chartData = {
          labels: ['No Data'],
          datasets: [{
            label: 'No Data',
            data: [0],
            borderColor: 'rgb(200, 200, 200)',
            backgroundColor: 'rgba(200, 200, 200, 0.2)',
            borderWidth: 2
          }]
        };
      }
      
      // Create chart with explicit interaction options
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: 'category', // Use category scale instead of time scale
                title: {
                  display: true,
                  text: 'Time'
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Value'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false
              }
            },
            // Explicitly define interaction options
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            },
            // Disable animations for better performance
            animation: false,
            // Disable hover events if they're causing issues
            events: ['click'] // Remove 'mousemove', 'mouseout', etc. if needed
          }
        });
      }
    } catch (error) {
      console.error('Error creating chart:', error);
    }
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);
  
  // Generate colors for chart series
  const getColor = (index: number, alpha = 1): string => {
    const colors = [
      `rgba(75, 192, 192, ${alpha})`,  // Teal
      `rgba(255, 99, 132, ${alpha})`,  // Red
      `rgba(54, 162, 235, ${alpha})`,  // Blue
      `rgba(255, 206, 86, ${alpha})`,  // Yellow
      `rgba(153, 102, 255, ${alpha})`, // Purple
      `rgba(255, 159, 64, ${alpha})`,  // Orange
      `rgba(46, 204, 113, ${alpha})`,  // Green
      `rgba(236, 112, 99, ${alpha})`,  // Light red
      `rgba(93, 173, 226, ${alpha})`,  // Light blue
      `rgba(245, 176, 65, ${alpha})`   // Light orange
    ];
    return colors[index % colors.length];
  };
  
  return (
    <div className="chart-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default DashboardChart;
