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
  const [activeEndpoint, setActiveEndpoint] = useState(null);

  const primaryUrl = 'https://rtsa.zakariakortam.com';
  const fallbackUrl = 'http://acb0be7bd92a148e1a464121365cd6a1-150769251.us-east-2.elb.amazonaws.com';

  // Test endpoint availability
  const testEndpoint = async (url) => {
    try {
      const response = await axios.get(`${url}/status`, { timeout: 5000 });
      console.log(`Endpoint ${url} is responsive:`, response.data);
      return true;
    } catch (error) {
      const isHttpsPage = window.location.protocol === 'https:';
      const isHttpEndpoint = url.startsWith('http:');
      
      if (isHttpsPage && isHttpEndpoint) {
        console.warn(
          'Mixed Content: Browser may be blocking HTTP endpoint access from HTTPS page. ' +
          'Try accessing the page with HTTP or enable mixed content in your browser.'
        );
      }
      
      console.log(`Endpoint ${url} failed:`, error.message);
      return false;
    }
  };

  // Initialize and test endpoints
  useEffect(() => {
    const checkEndpoints = async () => {
      console.log("Checking available endpoints...");
      
      // Try primary endpoint first
      if (await testEndpoint(primaryUrl)) {
        console.log("Using primary endpoint:", primaryUrl);
        setActiveEndpoint(primaryUrl);
        return;
      }

      // Fall back to direct ELB URL
      if (await testEndpoint(fallbackUrl)) {
        console.warn("Primary endpoint failed, using fallback:", fallbackUrl);
        setActiveEndpoint(fallbackUrl);
        return;
      }

      console.error("All endpoints failed");
      setActiveEndpoint(null);
    };

    checkEndpoints();
  }, []);

  const analyzeSentiment = async () => {
    if (!activeEndpoint) {
      setSentiment('Error: No available API endpoint');
      return;
    }

    console.log("Starting sentiment analysis using endpoint:", activeEndpoint);
    setLoading(true);
    
    try {
      const response = await axios.post(`${activeEndpoint}/predict`, { text }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });
      
      console.log("API Response:", response.data);
      const result = response.data.sentiment;
      setSentiment(result);
      setHistory([...history, { text, sentiment: result }]);

    } catch (error) {
      console.error('API Error Details:', {
        endpoint: activeEndpoint,
        message: error.message,
        response: error.response?.data,
      });

      // If primary endpoint fails during request, try fallback
      if (activeEndpoint === primaryUrl) {
        console.log("Attempting fallback to ELB URL...");
        try {
          const fallbackResponse = await axios.post(`${fallbackUrl}/predict`, { text }, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          });
          
          const result = fallbackResponse.data.sentiment;
          setSentiment(result);
          setHistory([...history, { text, sentiment: result }]);
          setActiveEndpoint(fallbackUrl); // Switch to fallback for future requests
          return;
        } catch (fallbackError) {
          console.error('Fallback request also failed:', fallbackError.message);
        }
      }

      setSentiment('Error: API is not responding. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
  };

  return (
    <div className="App">
      <header>
        <h1>Real-time Sentiment Analysis</h1>
        {activeEndpoint && (
          <div className="endpoint-indicator">
            Using: {activeEndpoint === primaryUrl ? 'Primary API' : 'Fallback API'}
          </div>
        )}
      </header>
      <main>
        <textarea
          placeholder="Enter text to analyze sentiment..."
          value={text}
          onChange={handleTextChange}
        />
        <br />
        <button 
          onClick={analyzeSentiment} 
          disabled={loading || !activeEndpoint}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        {sentiment && (
          <div className={`sentiment-result ${sentiment.toLowerCase().includes('error') ? 'error' : sentiment}`}>
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
