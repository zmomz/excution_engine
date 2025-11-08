import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PositionsPage from './pages/PositionsPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { CssBaseline, Box } from '@mui/material';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<MainLayout><DashboardPage /></MainLayout>}
          />
          <Route
            path="/positions"
            element={<MainLayout><PositionsPage /></MainLayout>}
          />
          <Route
            path="/settings"
            element={<MainLayout><SettingsPage /></MainLayout>}
          />
          <Route
            path="/logs"
            element={<MainLayout><LogsPage /></MainLayout>}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;