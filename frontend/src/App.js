// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SentimentChart from './components/SentimentChart';
import StatusMonitor from './components/StatusMonitor';
import './App.css';

// Use environment variables for API endpoints
const PRIMARY_URL = process.env.REACT_APP_PRIMARY_URL || 'https://rtsa.zakariakortam.com';
const FALLBACK_URL = process.env.REACT_APP_FALLBACK_URL || 'http://acb0be7bd92a148e1a464121365cd6a1-150769251.us-east-2.elb.amazonaws.com';

function App() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory] = useState(() => {
    // Retrieve history from localStorage on initial load
    const storedHistory = localStorage.getItem('sentimentHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [loading, setLoading] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const [apiStatus, setApiStatus] = useState({ status: 'unknown', error: null });

  // Persist history to localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem('sentimentHistory', JSON.stringify(history));
  }, [history]);

  // Test endpoint availability using useCallback to memoize the function
  const testEndpoint = useCallback(async (url) => {
    console.group(`Testing API Endpoint: ${url}`);
    try {
      const httpsUrl = url.replace('http://', 'https://');
      console.log(`🔒 Testing HTTPS: ${httpsUrl}`);
      const httpsResponse = await axios.get(`${httpsUrl}/status`, { timeout: 5000 });
      if (httpsResponse.status === 200) {
        console.log('✅ HTTPS endpoint available');
        return { success: true, url: httpsUrl };
      }
    } catch (e) {
      console.log('⚠️ HTTPS test failed, trying HTTP');
    }
    try {
      console.log(`Testing HTTP endpoint: ${url}`);
      const response = await axios.get(`${url}/status`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ HTTP endpoint available');
        return { success: true, url };
      }
    } catch (e) {
      console.error('❌ Both protocols failed for', url);
    }
    console.groupEnd();
    return { success: false, error: 'No endpoints available' };
  }, []);

  // Analyze sentiment with enhanced error handling
  const analyzeSentiment = useCallback(async () => {
    if (!text.trim()) {
      console.warn('🚫 Analysis cancelled: Empty text input');
      return;
    }
    if (!activeEndpoint) {
      console.warn('🚫 No active API endpoint available');
      setSentiment('Error: No API endpoint available');
      return;
    }

    console.group('Sentiment Analysis Request');
    console.log(`🕒 Analysis started at: ${new Date().toISOString()}`);
    console.log('📝 Input text:', text);
    console.log('🎯 Active endpoint:', activeEndpoint);

    setLoading(true);
    const startTime = performance.now();

    const requestConfig = {
      timeout: 20000,
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-Time': new Date().toISOString()
      }
    };

    try {
      // Try HTTPS first, then fallback to HTTP if necessary
      let response;
      const secureEndpoint = activeEndpoint.replace('http://', 'https://');
      try {
        console.log(`🔒 Attempting HTTPS request to ${secureEndpoint}`);
        response = await axios.post(`${secureEndpoint}/predict`, { text }, requestConfig);
      } catch (httpsError) {
        console.log('⚠️ HTTPS request failed, trying HTTP fallback');
        response = await axios.post(`${activeEndpoint}/predict`, { text }, requestConfig);
      }

      const duration = performance.now() - startTime;
      console.log('✅ Analysis successful:', {
        duration: `${duration.toFixed(2)}ms`,
        data: response.data
      });

      setSentiment(response.data.sentiment);
      setHistory(prev => [
        ...prev, 
        { text, sentiment: response.data.sentiment, timestamp: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('❌ Analysis failed:', {
        error: error.message,
        endpoint: activeEndpoint,
        status: error.response?.status,
        data: error.response?.data
      });
      setSentiment('Error: API is not responding. Please try again later.');
      setApiStatus({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [text, activeEndpoint]);

  // Initialize endpoints on mount
  useEffect(() => {
    const initializeEndpoints = async () => {
      console.log('🔍 Initializing API endpoints...');
      setLoading(true);

      const primaryTest = await testEndpoint(PRIMARY_URL);
      if (primaryTest.success) {
        setActiveEndpoint(primaryTest.url);
        setApiStatus({ status: 'ready', error: null });
        setLoading(false);
        return;
      }

      const fallbackTest = await testEndpoint(FALLBACK_URL);
      if (fallbackTest.success) {
        setActiveEndpoint(fallbackTest.url);
        setApiStatus({ status: 'fallback', error: null });
      } else {
        setActiveEndpoint(null);
        setApiStatus({ status: 'error', error: 'Both endpoints failed' });
      }
      setLoading(false);
    };

    initializeEndpoints();
  }, [testEndpoint]);

  return (
    <div className="App">
      <header>
        <h1>Real-time Sentiment Analysis</h1>
        <div className="endpoint-status" aria-live="polite">
          {activeEndpoint ? (
            <span className="status-ok">✅ API Connected: {activeEndpoint}</span>
          ) : (
            <span className="status-error">❌ No API Connection</span>
          )}
        </div>
      </header>
      <main>
        <textarea
          placeholder="Enter text to analyze sentiment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          aria-label="Text for sentiment analysis"
        />
        <br />
        <button 
          onClick={analyzeSentiment} 
          disabled={loading || !text.trim()}
          aria-busy={loading}
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
      <StatusMonitor apiStatus={apiStatus} />
    </div>
  );
}

export default App;
