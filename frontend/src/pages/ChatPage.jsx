import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Send, LogOut, Users } from 'lucide-react';

function ChatPage() {
  const { roomId } = useParams(); // Extract roomId from URL parameters
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract username passed from the Join page state
  const userName = location.state?.userName;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Redirect back if someone tries to open the chat page directly without a username
  useEffect(() => {
    if (!userName) {
      navigate('/');
    }
  }, [userName, navigate]);

  useEffect(() => {
    if (!userName || !roomId) return;

    // Connect to backend socket server dynamically when page mounts
    socket.connect();
    socket.emit('join-room', { roomId, userName });

    // Handle incoming messages
    socket.on('receive-message', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    // Handle new system logs (e.g., user connected)
    socket.on('user-connected', ({ userName }) => {
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), text: `${userName} joined the room`, system: true }
      ]);
    });

    // Cleanup: Disconnect socket when leaving this page/component
    return () => {
      socket.off('receive-message');
      socket.off('user-connected');
      socket.disconnect();
    };
  }, [roomId, userName]);

  // Auto scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('send-message', { roomId, message, sender: userName });
    setMessage('');
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Navbar Section */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-700 p-2 rounded-lg text-blue-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Room: {roomId}</h2>
            <p className="text-slate-400 text-xs">Logged in as <span className="text-blue-400 font-medium">{userName}</span></p>
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition duration-200 text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Leave Room</span>
        </button>
      </header>

      {/* Messages Feed */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => {
          if (msg.system) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.sender === userName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1 px-1">{msg.sender}</span>
              <div className={`max-w-md p-3.5 rounded-2xl shadow-sm text-sm ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Inputs Bar */}
      <footer className="bg-slate-800 border-t border-slate-700 p-4 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl w-full mx-auto flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20 transition duration-200 flex items-center justify-center aspect-square"
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}

export default ChatPage;