import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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

const schema = yup.object().shape({
  name: yup.string().required('Key name is required'),
  key: yup.string().required('API key is required'),
});

const DashboardPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [serverError, setServerError] = useState('');
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', key: '' },
  });

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
      setServerError('Failed to fetch API keys.');
      console.error('Fetch API keys error:', err);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const onSubmit = async (data: any) => {
    setServerError('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:8001/api-keys/',
        {
          name: data.name,
          key: data.key,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      reset();
      fetchApiKeys(); // Refresh the list
    } catch (err) {
      setServerError('Failed to add API key.');
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
      <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography component="h2" variant="h5" gutterBottom>
            API Key Management
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Key Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="key"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="API Key"
                  type="password"
                  error={!!errors.key}
                  helperText={errors.key?.message}
                />
              )}
            />
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
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
