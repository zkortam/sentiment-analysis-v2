// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SentimentChart from './components/SentimentChart';
import StatusMonitor from './components/StatusMonitor';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:80';

  useEffect(() => {
    console.log("Current API URL:", apiUrl);
    // Test API connection
    fetch(`${apiUrl}/status`)
        .then(res => res.json())
        .then(data => console.log("API Status:", data))
        .catch(err => {
            console.error("API Connection Error Details:", {
                message: err.message,
                stack: err.stack
            });
        });
  }, [apiUrl]);

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      console.log("Making API request to:", `${apiUrl}/predict`);
      console.log("Request payload:", { text });
      
      const response = await axios.post(`${apiUrl}/predict`, { text }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      console.log("API Response:", response);
      const result = response.data.sentiment;
      setSentiment(result);
      setHistory([...history, { text, sentiment: result }]);
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      setSentiment('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);  // Ensure loading is set to false even if there's an error
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Real-time Sentiment Analysis</h1>
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
          <div className={`sentiment-result ${sentiment}`}>
            <h2>Sentiment: {sentiment.toUpperCase()}</h2>
          </div>
        )}
        <SentimentChart history={history} />
      </main>
      <StatusMonitor />
    </div>
  );
}

export default App;
