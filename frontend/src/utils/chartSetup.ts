import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

// Register all Chart.js components
Chart.register(...registerables);

// Set default locale for date adapter
// @ts-ignore - Type mismatch between date-fns locale and Chart.js expected type
Chart.defaults.locale = enUS;

// Set default font for all text elements
Chart.defaults.font.family = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
Chart.defaults.font.size = 12;

// Disable animations for better performance
Chart.defaults.animation = false;

// Set default colors
Chart.defaults.backgroundColor = 'rgba(75, 192, 192, 0.2)';
Chart.defaults.borderColor = 'rgba(75, 192, 192, 1)';

// Set default interaction mode
// @ts-ignore - Type mismatch in Chart.js typings
Chart.defaults.interaction = {
  mode: 'nearest',
  intersect: false,
  axis: 'x'
};

// Set default events to only click (to avoid hover issues)
Chart.defaults.events = ['click'];

export default Chart;
