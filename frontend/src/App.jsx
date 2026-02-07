import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import TestPage from './pages/TestPage';
import AdminPage from './pages/AdminPage';
import ResultPage from './pages/ResultPage';
import CandidateLandingPage from './pages/CandidateLandingPage';
import './App.css';

import AccessibilityControls from './components/AccessibilityControls';
import { useState, useEffect } from 'react';

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
  // Accessibility State
  const [theme, setTheme] = useState('light');
  const [textSize, setTextSize] = useState('normal');
  const [textBold, setTextBold] = useState(false);

  // Apply styles to body
  useEffect(() => {
    const body = document.body;

    // Theme
    if (theme === 'dark') {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }

    // Text Size
    if (textSize === 'large') {
      body.classList.add('large-text');
    } else {
      body.classList.remove('large-text');
    }

    // Bold Text
    if (textBold) {
      body.classList.add('bold-text');
    } else {
      body.classList.remove('bold-text');
    }

  }, [theme, textSize, textBold]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleTextBold = () => setTextBold(prev => !prev);

  return (
    <Router>
      <AccessibilityControls
        theme={theme}
        toggleTheme={toggleTheme}
        textSize={textSize}
        setTextSize={setTextSize}
        textBold={textBold}
        toggleTextBold={toggleTextBold}
      />
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
