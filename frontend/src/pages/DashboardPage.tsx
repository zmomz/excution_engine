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
  IconButton,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface ApiKey {
  id: number;
  name: string;
}

interface WebhookLog {
  timestamp: string;
  payload: any;
  status: string;
}

const schema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Key name is required')
    .test('is-unique', 'An API key with this name already exists', async function (value) {
      if (!value) return true; // Skip validation if value is empty
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`http://localhost:8001/api-keys/check-name/?name=${value}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return !response.data.exists;
      } catch (error) {
        return false; // In case of an error, fail validation
      }
    }),
  key: yup
    .string()
    .trim()
    .required('API key is required')
    .min(10, 'API key must be at least 10 characters')
    .matches(/^\S*$/, 'API key cannot contain spaces'),
});

const DashboardPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [serverError, setServerError] = useState('');
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);

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

  const fetchWebhookLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8001/webhooks/logs/');
      setWebhookLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchApiKeys();
      fetchWebhookLogs();

      const interval = setInterval(fetchWebhookLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [localStorage.getItem('access_token')]);

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

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
  };

  const handleDelete = (key: ApiKey) => {
    setDeletingKey(key);
  };

  const handleUpdate = async (data: any) => {
    if (!editingKey) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `http://localhost:8001/api-keys/${editingKey.id}`,
        {
          name: data.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditingKey(null);
      fetchApiKeys();
    } catch (err) {
      console.error('Update API key error:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingKey) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8001/api-keys/${deletingKey.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDeletingKey(null);
      fetchApiKeys();
    } catch (err) {
      console.error('Delete API key error:', err);
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
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Paper sx={{ p: 3, mt: 4, width: '100%' }}>
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

        <TableContainer component={Paper} sx={{ mt: 4, width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(key)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(key)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper sx={{ p: 3, mt: 4, width: '100%' }}>
          <Typography component="h2" variant="h5" gutterBottom>
            Webhook Activity
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payload</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {webhookLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{JSON.stringify(log.payload)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Edit Modal */}
      <Modal open={!!editingKey} onClose={() => setEditingKey(null)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography variant="h6" component="h2">
            Edit API Key
          </Typography>
          <form onSubmit={handleSubmit(handleUpdate)}>
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
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Update
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingKey}
        onClose={() => setDeletingKey(null)}
      >
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the API key "{deletingKey?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingKey(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardPage;