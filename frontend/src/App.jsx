import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the Welcome / Join Room Screen */}
        <Route path="/" element={<JoinPage />} />
        
        {/* Dynamic Route for individual Chat Rooms */}
        <Route path="/chat/:roomId" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;