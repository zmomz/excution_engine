import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';

interface ApiKey {
  id: number;
  name: string;
}

interface Config {
  exchange: {
    name: string;
    api_key_id: number | null;
    testnet: boolean;
  };
  execution_pool: {
    max_open_groups: number;
  };
  grid_strategy: {
    dca_config: Array<{
      price_gap: number;
      capital_weight: number;
      tp_target: number;
    }>;
  };
  risk_management: {
    risk_engine_enabled: boolean;
    activation_threshold: number;
    max_loss_per_trade: number;
  };
  webhook: {
    secret: string;
  };
}

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<Config>({
    defaultValues: config || undefined,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('http://localhost:8001/config/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setConfig(response.data);
        reset(response.data);
      } catch (err) {
        setServerError('Failed to fetch configuration.');
        console.error('Fetch config error:', err);
      }
    };

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
        console.error('Failed to fetch API keys:', err);
      }
    };

    fetchConfig();
    fetchApiKeys();
  }, [reset]);

  const onSubmit = async (data: Config) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8001/config/', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMessage('Configuration updated successfully!');
    } catch (err) {
      setServerError('Failed to update configuration.');
      console.error('Update config error:', err);
    }
  };

  if (!config) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Settings
        </Typography>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Typography>Loading configuration...</Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Engine Settings
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Exchange Settings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Exchange Settings</Typography>
              <Controller
                name="exchange.name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} margin="normal" fullWidth label="Exchange Name" />
                )}
              />
              <Controller
                name="exchange.api_key_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="api-key-select-label">Active API Key</InputLabel>
                    <Select
                      {...field}
                      labelId="api-key-select-label"
                      label="Active API Key"
                      value={field.value || ''}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {apiKeys.map((key) => (
                        <MenuItem key={key.id} value={key.id}>{key.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="exchange.testnet"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Use Testnet"
                  />
                )}
              />
            </Paper>
          </Grid>

          {/* Execution Pool & Webhook */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Execution Pool</Typography>
              <Controller
                name="execution_pool.max_open_groups"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Max Open Position Groups" margin="normal" />
                )}
              />
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Webhook Settings</Typography>
              <Controller
                name="webhook.secret"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="password" fullWidth label="Webhook Secret" margin="normal" />
                )}
              />
            </Paper>
          </Grid>

          {/* Risk Management */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Risk Management</Typography>
              <Controller
                name="risk_management.risk_engine_enabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Enable Risk Engine"
                  />
                )}
              />
              <Controller
                name="risk_management.activation_threshold"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Activation Threshold (%)" margin="normal" />
                )}
              />
              <Controller
                name="risk_management.max_loss_per_trade"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" fullWidth label="Max Loss per Trade (%)" margin="normal" />
                )}
              />
            </Paper>
          </Grid>

          {/* Grid Strategy */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Grid Strategy - DCA Configuration</Typography>
              <Grid container spacing={2}>
                {config.grid_strategy.dca_config.map((dca, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                      <Typography variant="subtitle1" align="center">DCA Leg {index + 1}</Typography>
                      <Controller
                        name={`grid_strategy.dca_config.${index}.price_gap`}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} type="number" fullWidth label="Price Gap (%)" margin="normal" />
                        )}
                      />
                      <Controller
                        name={`grid_strategy.dca_config.${index}.capital_weight`}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} type="number" fullWidth label="Capital Weight (%)" margin="normal" />
                        )}
                      />
                      <Controller
                        name={`grid_strategy.dca_config.${index}.tp_target`}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} type="number" fullWidth label="TP Target (%)" margin="normal" />
                        )}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 4 }}>
          Save Configuration
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage;