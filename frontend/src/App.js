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
    const startTime = performance.now();
    console.group(`API Endpoint Test: ${url}`);
    console.log(`🕒 Test started at: ${new Date().toISOString()}`);
    console.log(`📡 Testing endpoint: ${url}`);
    
    try {
      console.log('⏳ Sending status request...');
      const response = await axios.get(`${url}/status`, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log('✅ Endpoint test successful:', {
        url,
        statusCode: response.status,
        responseTime: `${duration.toFixed(2)}ms`,
        data: response.data,
        headers: response.headers
      });

      return {
        success: true,
        responseTime: duration,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Endpoint test failed:', {
        url,
        errorType: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          timeout: error.config?.timeout,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers
        }
      });
      
      return {
        success: false,
        error: error.message,
        errorDetails: {
          type: error.name,
          code: error.code,
          status: error.response?.status
        }
      };
    } finally {
      console.groupEnd();
    }
  };

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      console.warn('🚫 Analysis cancelled: Empty text input');
      return;
    }

    console.group('Sentiment Analysis Request');
    console.log(`🕒 Analysis started at: ${new Date().toISOString()}`);
    console.log('📝 Input text:', text);
    console.log('🎯 Active endpoint:', activeEndpoint);

    setLoading(true);
    const startTime = performance.now();

    try {
      let endpoint = activeEndpoint;
      console.log(`📡 Sending request to ${endpoint}`);
      
      const requestConfig = {
        timeout: 20000,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-Time': new Date().toISOString()
        }
      };

      console.log('⚙️ Request configuration:', {
        endpoint,
        payload: { text },
        ...requestConfig
      });

      const response = await axios.post(`${endpoint}/predict`, { text }, requestConfig);
      
      const endTime = performance.now();
      console.log('✅ Analysis successful:', {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        statusCode: response.status,
        headers: response.headers,
        data: response.data
      });

      setSentiment(response.data.sentiment);
      setHistory(prev => {
        const newHistory = [...prev, { text, sentiment: response.data.sentiment }];
        console.log('📊 Updated history:', {
          previousLength: prev.length,
          newLength: newHistory.length,
          latestEntry: { text, sentiment: response.data.sentiment }
        });
        return newHistory;
      });

    } catch (error) {
      const endTime = performance.now();
      console.error('❌ Analysis failed:', {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        errorType: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        endpoint: activeEndpoint,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        request: {
          config: error.config,
          timing: {
            started: startTime,
            ended: endTime,
            duration: `${(endTime - startTime).toFixed(2)}ms`
          }
        }
      });

      // Try fallback if primary fails
      if (activeEndpoint === primaryUrl) {
        console.log('🔄 Attempting fallback endpoint...');
        try {
          const fallbackResponse = await axios.post(`${fallbackUrl}/predict`, { text }, requestConfig);
          console.log('✅ Fallback request successful:', fallbackResponse.data);
          setSentiment(fallbackResponse.data.sentiment);
          setActiveEndpoint(fallbackUrl);
        } catch (fallbackError) {
          console.error('❌ Fallback request failed:', {
            error: fallbackError.message,
            details: fallbackError
          });
          setSentiment('Error: All endpoints failed');
        }
      } else {
        setSentiment('Error: ' + (error.response?.data?.detail || error.message));
      }

      setApiStatus({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      const finalTime = performance.now();
      console.log(`⏱️ Total operation time: ${(finalTime - startTime).toFixed(2)}ms`);
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
