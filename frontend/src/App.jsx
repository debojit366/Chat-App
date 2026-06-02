import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Helper Component to check if user is logged in
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard & Chat Routes (Protected: Requires Login) */}
        <Route path="/" element={
          <ProtectedRoute>
            <JoinPage />
          </ProtectedRoute>
        } />
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