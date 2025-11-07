import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';

interface ApiKey {
  id: number;
  name: string;
}

const DashboardPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [error, setError] = useState('');

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8001/api-keys/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApiKeys(response.data);
    } catch (err) {
      setError('Failed to fetch API keys.');
      console.error('Fetch API keys error:', err);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleAddApiKey = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8001/api-keys/',
        {
          name: newApiKeyName,
          key: newApiKeyValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNewApiKeyName('');
      setNewApiKeyValue('');
      fetchApiKeys(); // Refresh the list
    } catch (err) {
      setError('Failed to add API key.');
      console.error('Add API key error:', err);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Execution Engine
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Paper sx={{ p: 2, mt: 4 }}>
          <Typography component="h2" variant="h5">
            API Key Management
          </Typography>
          <Box component="form" onSubmit={handleAddApiKey} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="apiKeyName"
              label="Key Name"
              name="apiKeyName"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="apiKeyValue"
              label="API Key"
              type="password"
              id="apiKeyValue"
              value={newApiKeyValue}
              onChange={(e) => setNewApiKeyValue(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Add API Key
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default DashboardPage;