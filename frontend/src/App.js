import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Unknown');

  // Use the API URL from environment variables or default to localhost (adjust as needed)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:80';

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/predict`, { text });
      setSentiment(response.data.sentiment);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      setSentiment('Error');
    }
    setLoading(false);
  };

  const checkStatus = async () => {
    // This is a placeholder for monitoring status.
    // If your backend exposes a /status endpoint, you can call it here.
    try {
      const response = await axios.get(`${apiUrl}/`);
      if (response.data && response.data.message) {
        setStatus('All systems operational');
      } else {
        setStatus('Status unknown');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('Error');
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Sentiment Analysis</h1>
      </header>
      <main>
        <textarea
          placeholder="Enter text to analyze sentiment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <br />
        <button onClick={analyzeSentiment} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        {sentiment && (
          <div>
            <h2>Sentiment: {sentiment}</h2>
          </div>
        )}
      </main>
      <section className="status-section">
        <h2>System Monitoring</h2>
        <button onClick={checkStatus}>Check System Status</button>
        <p>{status}</p>
      </section>
    </div>
  );
}

export default App;
