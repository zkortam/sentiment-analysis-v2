import React, { useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use an environment variable for the API URL if set, fallback to localhost
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/predict';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSentiment(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setSentiment(data.sentiment);
    } catch (err) {
      console.error('Error fetching sentiment:', err);
      setError('Error fetching sentiment. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sentiment Analysis</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Type your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            cols={50}
          />
          <br />
          <button type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </form>
        {sentiment && (
          <div className="result">
            <h2>Sentiment: {sentiment}</h2>
          </div>
        )}
        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
