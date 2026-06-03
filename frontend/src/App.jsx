import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage'; // <-- New Dashboard Import
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Context Paths */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Core Route (Protected) */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage /> {/* <-- Direct entry post login */}
          </ProtectedRoute>
        } />

        {/* Real-time Streaming Room Area */}
        <Route path="/chat/:roomId" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;