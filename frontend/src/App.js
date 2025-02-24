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

  // Enhanced testEndpoint function with more logging
  const testEndpoint = async (url) => {
    console.group(`API Endpoint Test: ${url}`);
    
    try {
      // Try HTTPS first
      const httpsUrl = url.replace('http://', 'https://');
      console.log(`🔒 Testing HTTPS endpoint: ${httpsUrl}`);
      const httpsResponse = await axios.get(`${httpsUrl}/status`, { timeout: 5000 });
      if (httpsResponse.status === 200) {
        console.log('✅ HTTPS endpoint available');
        return { success: true, url: httpsUrl };
      }
    } catch (httpsError) {
      console.log('⚠️ HTTPS endpoint failed, trying HTTP');
    }

    // Try HTTP if HTTPS fails
    try {
      console.log(`Testing HTTP endpoint: ${url}`);
      const response = await axios.get(`${url}/status`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ HTTP endpoint available');
        return { success: true, url };
      }
    } catch (error) {
      console.error('❌ Both HTTPS and HTTP endpoints failed');
    }

    console.groupEnd();
    return { success: false, error: 'No endpoints available' };
  };

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      console.warn('🚫 Analysis cancelled: Empty text input');
      return;
    }

    if (!activeEndpoint) {
      console.warn('🚫 No active endpoint available');
      setSentiment('Error: No API endpoint available');
      return;
    }

    console.group('Sentiment Analysis Request');
    console.log(`🕒 Analysis started at: ${new Date().toISOString()}`);
    console.log('📝 Input text:', text);
    console.log('🎯 Active endpoint:', activeEndpoint);

    setLoading(true);
    const startTime = performance.now();

    try {
      const endpoint = activeEndpoint;
      console.log(`📡 Sending request to ${endpoint}`);
      
      const requestConfig = {
        timeout: 20000,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-Time': new Date().toISOString()
        }
      };

      // Try HTTPS first
      try {
        const httpsEndpoint = endpoint.replace('http://', 'https://');
        console.log(`🔒 Attempting HTTPS request to ${httpsEndpoint}`);
        const response = await axios.post(`${httpsEndpoint}/predict`, { text }, requestConfig);
        
        const endTime = performance.now();
        console.log('✅ HTTPS request successful:', {
          duration: `${(endTime - startTime).toFixed(2)}ms`,
          data: response.data
        });

        setSentiment(response.data.sentiment);
        setHistory(prev => [...prev, { text, sentiment: response.data.sentiment }]);
        return;
      } catch (httpsError) {
        console.log('⚠️ HTTPS request failed, trying HTTP fallback');
      }

      // HTTP fallback
      const response = await axios.post(`${endpoint}/predict`, { text }, requestConfig);
      
      const endTime = performance.now();
      console.log('✅ Analysis successful:', {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        data: response.data
      });

      setSentiment(response.data.sentiment);
      setHistory(prev => [...prev, { text, sentiment: response.data.sentiment }]);

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
  };

  // Initialize endpoints
  useEffect(() => {
    const initializeEndpoints = async () => {
      console.log('Initializing endpoints...');
      setLoading(true);

      // Test primary endpoint
      const primaryTest = await testEndpoint(primaryUrl);
      if (primaryTest.success) {
        setActiveEndpoint(primaryTest.url);
        setApiStatus({ status: 'ready', error: null });
        setLoading(false);
        return;
      }

      // Test fallback endpoint
      const fallbackTest = await testEndpoint(fallbackUrl);
      if (fallbackTest.success) {
        setActiveEndpoint(fallbackTest.url);
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
        <div className="endpoint-status">
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
