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
}
from '@mui/material';

interface Config {
  exchange: {
    name: string;
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
}

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
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
        reset(response.data); // Reset form with fetched data
      } catch (err) {
        setServerError('Failed to fetch configuration.');
        console.error('Fetch config error:', err);
      }
    };

    fetchConfig();
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
        Settings
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Exchange Settings</Typography>
          <Controller
            name="exchange.name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                label="Exchange Name"
                error={!!errors.exchange?.name}
                helperText={errors.exchange?.name?.message}
              />
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

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Execution Pool Settings</Typography>
          <Controller
            name="execution_pool.max_open_groups"
            control={control}
            rules={{ required: 'Max open groups is required', min: { value: 1, message: 'Must be at least 1' } }}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                fullWidth
                label="Max Open Position Groups"
                type="number"
                error={!!errors.execution_pool?.max_open_groups}
                helperText={errors.execution_pool?.max_open_groups?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
              />
            )}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Grid Strategy - DCA Configuration</Typography>
          {config.grid_strategy.dca_config.map((dca, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
              <Typography variant="subtitle1">DCA Leg {index}</Typography>
              <Controller
                name={`grid_strategy.dca_config.${index}.price_gap` as const}
                control={control}
                rules={{ required: 'Price gap is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    label="Price Gap (%)"
                    type="number"
                    step="0.001"
                    error={!!errors.grid_strategy?.dca_config?.[index]?.price_gap}
                    helperText={errors.grid_strategy?.dca_config?.[index]?.price_gap?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                )}
              />
              <Controller
                name={`grid_strategy.dca_config.${index}.capital_weight` as const}
                control={control}
                rules={{ required: 'Capital weight is required', min: { value: 0, message: 'Must be non-negative' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    label="Capital Weight (%)"
                    type="number"
                    step="0.01"
                    error={!!errors.grid_strategy?.dca_config?.[index]?.capital_weight}
                    helperText={errors.grid_strategy?.dca_config?.[index]?.capital_weight?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                )}
              />
              <Controller
                name={`grid_strategy.dca_config.${index}.tp_target` as const}
                control={control}
                rules={{ required: 'TP target is required', min: { value: 0, message: 'Must be non-negative' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    label="TP Target (%)"
                    type="number"
                    step="0.001"
                    error={!!errors.grid_strategy?.dca_config?.[index]?.tp_target}
                    helperText={errors.grid_strategy?.dca_config?.[index]?.tp_target?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                )}
              />
            </Box>
          ))}
        </Paper>

        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Save Configuration
        </Button>
      </Box>
    </Container>
  );
};

export default SettingsPage;