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
  IconButton,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  TablePagination,
} from '@mui/material';
import { Link } from 'react-router-dom';
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

interface DashboardMetrics {
  total_active_position_groups: number;
  execution_pool_usage: string;
  queued_signals_count: number;
  total_pnl_usd: number;
  total_pnl_percent: number | null;
  last_webhook_timestamp: string;
  engine_status: string;
  risk_engine_status: string;
  error_alerts: string[];
}

const addSchema = yup.object().shape({
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

const editSchema = yup.object().shape({
  name: yup.string().trim().required('Key name is required'),
});

const DashboardPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [serverError, setServerError] = useState('');
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [webhookPage, setWebhookPage] = useState(0);
  const [webhookRowsPerPage, setWebhookRowsPerPage] = useState(10);
  const [totalWebhookLogs, setTotalWebhookLogs] = useState(0);

  const {
    control: addControl,
    handleSubmit: handleAddSubmit,
    reset: addReset,
    formState: { errors: addErrors },
  } = useForm({
    resolver: yupResolver(addSchema),
    defaultValues: { name: '', key: '' },
  });

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm({
    resolver: yupResolver(editSchema),
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
      const response = await axios.get('http://localhost:8001/webhooks/logs/', {
        params: {
          skip: webhookPage * webhookRowsPerPage,
          limit: webhookRowsPerPage,
        },
      });
      setWebhookLogs(response.data.logs);
      setTotalWebhookLogs(response.data.total);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8001/dashboard-metrics/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDashboardMetrics(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchApiKeys();
      fetchWebhookLogs();
      fetchDashboardMetrics();

      const metricsInterval = setInterval(fetchDashboardMetrics, 5000); // Refresh every 5 seconds

      return () => {
        clearInterval(metricsInterval);
      };
    }
  }, [localStorage.getItem('access_token'), webhookPage, webhookRowsPerPage]);

  const onAddSubmit = async (data: any) => {
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
      addReset();
      fetchApiKeys(); // Refresh the list
    } catch (err) {
      setServerError('Failed to add API key.');
      console.error('Add API key error:', err);
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    editReset({ name: key.name });
  };

  const handleDelete = (key: ApiKey) => {
    setDeletingKey(key);
  };

  const onEditSubmit = async (data: any) => {
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

  const pnlColor = dashboardMetrics?.total_pnl_percent !== null
    ? (dashboardMetrics?.total_pnl_percent >= 0 ? 'green' : 'red')
    : 'inherit';

  return (
    <>
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Dashboard
        </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {dashboardMetrics ? (
        <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Active Positions</Typography>
              <Typography variant="h4">{dashboardMetrics.total_active_position_groups}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Execution Pool</Typography>
              <Typography variant="h4">{dashboardMetrics.execution_pool_usage}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Queued Signals</Typography>
              <Typography variant="h4">{dashboardMetrics.queued_signals_count}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Total PnL (USD)</Typography>
              <Typography variant="h4" style={{ color: pnlColor }}>
                {dashboardMetrics.total_pnl_usd.toFixed(2)}$
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Total PnL (%)</Typography>
              <Typography variant="h4" style={{ color: pnlColor }}>
                {dashboardMetrics.total_pnl_percent !== null ? `${dashboardMetrics.total_pnl_percent.toFixed(2)}%` : 'N/A'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Last Webhook</Typography>
              <Typography variant="h5">{new Date(dashboardMetrics.last_webhook_timestamp).toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Engine Status</Typography>
              <Typography variant="h5">{dashboardMetrics.engine_status}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Risk Engine Status</Typography>
              <Typography variant="h5">{dashboardMetrics.risk_engine_status}</Typography>
            </Paper>
          </Grid>
          {dashboardMetrics.error_alerts.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="error">
                <Typography variant="h6">Alerts</Typography>
                <List>
                  {dashboardMetrics.error_alerts.map((alert, index) => (
                    <ListItem key={index}><ListItemText primary={alert} /></ListItem>
                  ))}
                </List>
              </Alert>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

        <Paper sx={{ p: 3, mt: 4, width: '100%' }}>
          <Typography component="h2" variant="h5" gutterBottom>
            API Key Management
          </Typography>
          <Box component="form" onSubmit={handleAddSubmit(onAddSubmit)} sx={{ mt: 2 }}>
            <Controller
              name="name"
              control={addControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Key Name"
                  error={!!addErrors.name}
                  helperText={addErrors.name?.message}
                />
              )}
            />
            <Controller
              name="key"
              control={addControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="API Key"
                  type="password"
                  error={!!addErrors.key}
                  helperText={addErrors.key?.message}
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalWebhookLogs}
            rowsPerPage={webhookRowsPerPage}
            page={webhookPage}
            onPageChange={(event, newPage) => setWebhookPage(newPage)}
            onRowsPerPageChange={(event) => {
              setWebhookRowsPerPage(parseInt(event.target.value, 10));
              setWebhookPage(0);
            }}
          />
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
          <form onSubmit={handleEditSubmit(onEditSubmit)}>
            <Controller
              name="name"
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Key Name"
                  error={!!editErrors.name}
                  helperText={editErrors.name?.message}
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