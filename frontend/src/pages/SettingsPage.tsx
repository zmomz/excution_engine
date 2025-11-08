import React from 'react';
import { Container, Typography } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1">
        Settings content will go here.
      </Typography>
    </Container>
  );
};

export default SettingsPage;
