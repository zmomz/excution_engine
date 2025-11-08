import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
}
from '@mui/material';

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const logsEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    const fetchLogs = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const token = localStorage.getItem('access_token');
        const response = await axios.get('http://localhost:8001/logs/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(response.data.logs);
      } catch (err) {
        setServerError('Failed to fetch logs.');
        console.error('Fetch logs error:', err);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchLogs(true);
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        System Logs
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, mt: 2, backgroundColor: '#1e1e1e', color: '#e0e0e0', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto' }}>
          {logs.length > 0 ? logs.map((line, index) => (
            <div key={index}>{line}</div>
          )) : (
            <Typography>No logs available.</Typography>
          )}
          <div ref={logsEndRef} />
        </Paper>
      )}
    </Container>
  );
};

export default LogsPage;