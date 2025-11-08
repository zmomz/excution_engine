import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PositionsPage from './pages/PositionsPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { CssBaseline, Box, Toolbar } from '@mui/material';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <DashboardPage />
                  </Box>
                </>
              }
            />
            <Route
              path="/positions"
              element={
                <>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <PositionsPage />
                  </Box>
                </>
              }
            />
            <Route
              path="/settings"
              element={
                <>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <SettingsPage />
                  </Box>
                </>
              }
            />
            <Route
              path="/logs"
              element={
                <>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <LogsPage />
                  </Box>
                </>
              }
            />
          </Route>
        </Routes>
      </Router>
    </Box>
  );
}

export default App;