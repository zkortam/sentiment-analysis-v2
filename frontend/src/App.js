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
    // Log environment and configuration
    console.log({
      environment: process.env.NODE_ENV,
      apiUrl: apiUrl,
      currentTime: new Date().toISOString(),
    });

    // Test API connection on component mount
    const checkApiStatus = async () => {
      try {
        console.log("Checking API status at:", `${apiUrl}/status`);
        const response = await axios.get(`${apiUrl}/status`);
        console.log("API Status Response:", response.data);
        return response.data;
      } catch (error) {
        console.error("API Status Check Failed:", {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: `${apiUrl}/status`
        });
        return null;
      }
    };

    checkApiStatus();

    // Log component mount
    console.log("App component mounted with initial state:", {
      text,
      sentiment,
      historyLength: history.length,
      loading
    });

    return () => {
      console.log("App component unmounting");
    };
  }, [apiUrl]);

  // Log state changes
  useEffect(() => {
    console.log("State updated:", {
      currentText: text,
      currentSentiment: sentiment,
      historyLength: history.length,
      isLoading: loading
    });
  }, [text, sentiment, history, loading]);

  const analyzeSentiment = async () => {
    console.log("Starting sentiment analysis for text:", text);
    setLoading(true);
    
    try {
      console.log("Making API request to:", `${apiUrl}/predict`);
      console.log("Request payload:", { text });
      console.log("Request headers:", {
        'Content-Type': 'application/json'
      });

      const startTime = performance.now();
      
      const response = await axios.post(`${apiUrl}/predict`, { text }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      const endTime = performance.now();
      console.log(`API request completed in ${endTime - startTime}ms`);
      
      console.log("API Response:", {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      const result = response.data.sentiment;
      console.log("Parsed sentiment result:", result);

      setSentiment(result);
      
      // Log history update
      const newHistory = [...history, { text, sentiment: result }];
      console.log("Updating history:", {
        previousLength: history.length,
        newLength: newHistory.length,
        latestEntry: { text, sentiment: result }
      });
      
      setHistory(newHistory);

    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data,
        }
      });

      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - API endpoint may be down or unreachable');
        setSentiment('Error: API is not responding. Please try again later.');
      } else {
        setSentiment('Error: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
      console.log("Analysis completed, loading state reset to false");
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    console.log("Text input changed:", {
      previousLength: text.length,
      newLength: newText.length,
      changed: text !== newText
    });
    setText(newText);
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
          onChange={handleTextChange}
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
