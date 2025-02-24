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
  const [apiStatus, setApiStatus] = useState({ status: 'unknown', error: null });

  const primaryUrl = 'https://rtsa.zakariakortam.com';
  const fallbackUrl = 'http://acb0be7bd92a148e1a464121365cd6a1-150769251.us-east-2.elb.amazonaws.com';

  // Debug logging for state changes
  useEffect(() => {
    console.log('State Update:', {
      loading,
      activeEndpoint,
      apiStatus,
      historyLength: history.length,
      currentText: text,
      currentSentiment: sentiment
    });
  }, [loading, activeEndpoint, apiStatus, history, text, sentiment]);

  const testEndpoint = async (url) => {
    console.log(`Testing endpoint ${url}...`);
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${url}/status`, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept any status < 500
      });
      
      const endTime = performance.now();
      console.log(`Endpoint ${url} responded in ${endTime - startTime}ms:`, response.data);
      
      return {
        success: true,
        responseTime: endTime - startTime,
        data: response.data
      };
    } catch (error) {
      console.error(`Endpoint ${url} failed:`, {
        message: error.message,
        code: error.code,
        response: error.response,
        config: error.config
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      console.log('Empty text, skipping analysis');
      return;
    }

    console.log('Starting sentiment analysis:', {
      text,
      endpoint: activeEndpoint,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    const startTime = performance.now();

    try {
      // First try primary endpoint if it's active
      if (activeEndpoint === primaryUrl) {
        console.log('Attempting primary endpoint...');
        const response = await axios.post(`${primaryUrl}/predict`, { text }, {
          timeout: 20000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Primary endpoint response:', response.data);
        setSentiment(response.data.sentiment);
        setHistory(prev => [...prev, { text, sentiment: response.data.sentiment }]);
        setLoading(false);
        return;
      }

      // Try fallback endpoint
      console.log('Attempting fallback endpoint...');
      const response = await axios.post(`${fallbackUrl}/predict`, { text }, {
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Fallback endpoint response:', response.data);
      setSentiment(response.data.sentiment);
      setHistory(prev => [...prev, { text, sentiment: response.data.sentiment }]);

    } catch (error) {
      console.error('Analysis failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        endpoint: activeEndpoint
      });

      setSentiment('Error: ' + (error.response?.data?.detail || error.message));
      setApiStatus({
        status: 'error',
        error: error.message
      });

    } finally {
      const endTime = performance.now();
      console.log(`Analysis completed in ${endTime - startTime}ms`);
      setLoading(false);
    }
  };

  // Initialize endpoints
  useEffect(() => {
    const initializeEndpoints = async () => {
      console.log('Initializing endpoints...');
      setLoading(true);

      // Test primary endpoint
      const primaryTest = await testEndpoint(primaryUrl);
      if (primaryTest.success) {
        setActiveEndpoint(primaryUrl);
        setApiStatus({ status: 'ready', error: null });
        setLoading(false);
        return;
      }

      // Test fallback endpoint
      const fallbackTest = await testEndpoint(fallbackUrl);
      if (fallbackTest.success) {
        setActiveEndpoint(fallbackUrl);
        setApiStatus({ status: 'fallback', error: null });
      } else {
        setActiveEndpoint(null);
        setApiStatus({ 
          status: 'error', 
          error: 'Both endpoints failed' 
        });
      }
      
      setLoading(false);
    };

    initializeEndpoints();
  }, []);

  return (
    <div className="App">
      <header>
        <h1>Real-time Sentiment Analysis</h1>
        <div className="api-status">
          API Status: {apiStatus.status}
          {apiStatus.error && <div className="error-message">{apiStatus.error}</div>}
        </div>
      </header>
      <main>
        <textarea
          placeholder="Enter text to analyze sentiment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <br />
        <button 
          onClick={analyzeSentiment} 
          disabled={loading || !text.trim()}
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
