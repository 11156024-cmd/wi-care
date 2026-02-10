import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { default as MainApp } from './App';
import LineAuthCallbackPage from './pages/LineAuthCallbackPage';

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
