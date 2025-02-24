// frontend/src/components/StatusMonitor.js
import React, { useState } from 'react';
import axios from 'axios';

function StatusMonitor() {
  const [status, setStatus] = useState('Unknown');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:80';

  const checkStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/status`);
      if (response.data && response.data.aws) {
        setStatus('All Systems Operational');
      } else {
        setStatus('Status Unknown');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('Error');
    }
  };

  return (
    <section className="status-section">
      <h2>System Monitoring</h2>
      <button onClick={checkStatus}>Check System Status</button>
      <p className={status === 'Error' ? 'error-text' : 'success-text'}>{status}</p>
    </section>
  );
}

export default StatusMonitor;
