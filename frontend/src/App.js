// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SentimentChart from './components/SentimentChart';
import StatusMonitor from './components/StatusMonitor';
import './App.css';

function App() {
  console.log("App component rendering"); // Debug log

  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(null);

  const primaryUrl = 'https://rtsa.zakariakortam.com';
  const fallbackUrl = 'http://acb0be7bd92a148e1a464121365cd6a1-150769251.us-east-2.elb.amazonaws.com';

  // Debug loading state changes
  useEffect(() => {
    console.log("Loading state changed:", loading);
  }, [loading]);

  const testEndpoint = async (url) => {
    try {
      console.log(`Testing endpoint: ${url}`); // Debug log
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

  // Separate useEffect for initial loading state reset
  useEffect(() => {
    console.log("Initial loading state reset");
    setLoading(false);
  }, []);

  // Separate useEffect for endpoint checking
  useEffect(() => {
    const checkEndpoints = async () => {
      console.log("Starting endpoint check");
      
      try {
        if (await testEndpoint(primaryUrl)) {
          setActiveEndpoint(primaryUrl);
          return;
        }

        if (await testEndpoint(fallbackUrl)) {
          setActiveEndpoint(fallbackUrl);
          return;
        }

        setActiveEndpoint(null);
      } catch (error) {
        console.error("Error checking endpoints:", error);
        setActiveEndpoint(null);
      }
    };

    checkEndpoints();
  }, []);

  const analyzeSentiment = async () => {
    if (!activeEndpoint) {
      setSentiment('Error: No available API endpoint');
      return;
    }

    console.log("Starting analysis, setting loading to true");
    setLoading(true);
    
    try {
      const response = await axios.post(`${activeEndpoint}/predict`, { text }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });
      
      const result = response.data.sentiment;
      setSentiment(result);
      setHistory([...history, { text, sentiment: result }]);

    } catch (error) {
      console.error('API Error:', error);

      if (activeEndpoint === primaryUrl) {
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
          setActiveEndpoint(fallbackUrl);
          return;
        } catch (fallbackError) {
          console.error('Fallback request failed:', fallbackError);
        }
      }

      setSentiment('Error: API is not responding. Please try again later.');
    } finally {
      console.log("Analysis complete, setting loading to false");
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
  };

  const showMixedContentWarning = !activeEndpoint && window.location.protocol === 'https:';

  return (
    <div className="App">
      <header>
        <h1>Real-time Sentiment Analysis</h1>
        {activeEndpoint && (
          <div className="endpoint-indicator">
            Using: {activeEndpoint === primaryUrl ? 'Primary API' : 'Fallback API'}
          </div>
        )}
        {showMixedContentWarning && (
          <div className="warning-message">
            Unable to connect to API. If using Chrome, click the 🔒 icon in the address bar, 
            select "Site settings", and allow "Insecure content".
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
