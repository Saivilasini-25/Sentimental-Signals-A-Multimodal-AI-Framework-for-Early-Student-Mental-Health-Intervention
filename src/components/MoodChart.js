import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function MoodChart({ history }) {
  if (!history || history.length === 0) return null;

  const labels = history.map(h => h.time).reverse();
  const scores = history.map(h => (h.label === 'POSITIVE' ? h.score : -h.score)).reverse();

  const data = {
    labels,
    datasets: [
      {
        label: 'Mood Trend (positive vs negative)',
        data: scores,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102,126,234,0.2)',
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        suggestedMin: -1,
        suggestedMax: 1
      }
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Mood Trend</h3>
      <Line data={data} options={options} />
    </div>
  );
}

export default MoodChart;
