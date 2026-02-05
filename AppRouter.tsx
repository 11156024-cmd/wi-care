import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { default as MainApp } from './App';
import LineAuthCallbackPage from './pages/LineAuthCallbackPage';

// Pages
import MonitorPage from './pages/MonitorPage';
import HealthLogPage from './pages/HealthLogPage';
import CaregiversPage from './pages/CaregiversPage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth/line/callback" element={<LineAuthCallbackPage />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
