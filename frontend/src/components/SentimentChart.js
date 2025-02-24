// frontend/src/components/SentimentChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function SentimentChart({ history }) {
  const chartData = history.map((entry, index) => ({
    name: `Test ${index + 1}`,
    sentiment: entry.sentiment === 'positive' ? 1 : 0,
  }));

  return (
    <div className="chart-container">
      <h3>Sentiment History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1]} tickFormatter={(tick) => tick === 1 ? 'Positive' : 'Negative'} />
          <Tooltip formatter={(value) => value === 1 ? 'Positive' : 'Negative'} />
          <Line type="monotone" dataKey="sentiment" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SentimentChart;
