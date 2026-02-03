import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import TestPage from './pages/TestPage';
import AdminPage from './pages/AdminPage';
import ResultPage from './pages/ResultPage';
import CandidateLandingPage from './pages/CandidateLandingPage';
import './App.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const isTestPage = location.pathname.includes('/exam');

  return (
    <div className="app-container">
      {!isTestPage && !location.pathname.includes('/test/') && (
        <nav className="navbar">
          <Link to="/" className="nav-brand">OnlineTest Platform</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Admin Panel</Link>
          </div>
        </nav>
      )}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Root redirects to Admin */}
          <Route path="/" element={<AdminPage />} />

          {/* Candidate flow */}
          <Route path="/test/:testId" element={<CandidateLandingPage />} />
          <Route path="/test/:testId/exam" element={<TestPage />} />

          {/* Result page */}
          <Route path="/result/:sessionId" element={<ResultPage />} />

          {/* Legacy admin route */}
          <Route path="/admin" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
