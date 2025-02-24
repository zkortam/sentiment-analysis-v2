import React, { useState, useEffect } from 'react';
import './App.css';

function SentimentForm({ apiUrl }) {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSentiment(null);
    try {
      const response = await fetch(apiUrl + '/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSentiment(data.sentiment);
    } catch (err) {
      console.error(err);
      setError('Error fetching sentiment');
    }
    setLoading(false);
  };

  return (
    <div className="sentiment-form">
      <h2>Sentiment Analysis</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="6"
          cols="50"
        />
        <br />
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </form>
      {sentiment && (
        <div className="result">
          <h3>Result: {sentiment}</h3>
        </div>
      )}
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

function StatusDashboard({ apiUrl }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Attempt to fetch status from the /status endpoint
  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      try {
        const response = await fetch(apiUrl + '/status');
        if (!response.ok) {
          throw new Error('Status endpoint not available');
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error(err);
        // Simulate status if /status is not implemented
        setStatus({
          aws: 'OK',
          eksCluster: 'Running',
          docker: 'Healthy',
          argoCD: 'Synced',
        });
        setError('Status endpoint not available, showing simulated status.');
      }
      setLoading(false);
    }
    fetchStatus();
  }, [apiUrl]);

  return (
    <div className="status-dashboard">
      <h2>System Status Dashboard</h2>
      {loading && <p>Loading status...</p>}
      {error && <p className="error">{error}</p>}
      {status && (
        <div className="status-details">
          <p><strong>AWS:</strong> {status.aws}</p>
          <p><strong>EKS Cluster:</strong> {status.eksCluster}</p>
          <p><strong>Docker:</strong> {status.docker}</p>
          <p><strong>ArgoCD:</strong> {status.argoCD}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  // Use an environment variable for the API URL, defaulting to localhost:8000
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const [activeTab, setActiveTab] = useState('sentiment');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sentiment Analysis & Monitoring Dashboard</h1>
        <div className="tabs">
          <button
            className={activeTab === 'sentiment' ? 'active' : ''}
            onClick={() => setActiveTab('sentiment')}
          >
            Sentiment Analysis
          </button>
          <button
            className={activeTab === 'status' ? 'active' : ''}
            onClick={() => setActiveTab('status')}
          >
            System Status
          </button>
        </div>
      </header>
      <main>
        {activeTab === 'sentiment' && <SentimentForm apiUrl={API_URL} />}
        {activeTab === 'status' && <StatusDashboard apiUrl={API_URL} />}
      </main>
    </div>
  );
}

export default App;
