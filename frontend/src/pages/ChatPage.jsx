import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import VideoCallSection from '../components/VideoCallSection';
import { Send, LogOut, Users, Video, Phone, Search, X } from 'lucide-react';

function ChatPage() {
  const { roomId } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const userName = location.state?.userName;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // --- Video Calling States ---
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userName) {
      navigate('/');
    }
  }, [userName, navigate]);

  useEffect(() => {
    if (!userName || !roomId) return;

    socket.connect();
    socket.emit('join-room', { roomId, userName });

    socket.on('receive-message', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    socket.on('user-connected', ({ userName }) => {
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), text: `${userName} joined the room`, system: true }
      ]);
    });
    socket.on('chat-history', (historyData) => {
  // Database se aane wale data ke keys ko apne standard format me map kar lo
  const formattedHistory = historyData.map(msg => ({
    id: msg._id,
    text: msg.text,
    sender: msg.sender,
    createdAt: msg.createdAt
  }));
  
  setMessages(formattedHistory); // Poori history ek baar me UI par render ho jayegi
});

    // --- Dynamic Listener: Signal to auto-open call layout for the receiver ---
    socket.on('incoming-call', () => {
      if (!isCallActive) {
        setIsInitiator(false); // Receiver side
        setIsCallActive(true);
      }
    });

    // --- Dynamic Listener: Close layout if other peer terminates the call ---
    socket.on('call-terminated-by-peer', () => {
      setIsCallActive(false);
      setIsInitiator(false);
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-connected');
      socket.off('incoming-call');
      socket.off('call-terminated-by-peer');
      socket.off('chat-history');
      socket.disconnect();
    };
  }, [roomId, userName, isCallActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Triggered when clicking the Video Button ---
  const handleStartVideoCall = () => {
    setIsInitiator(true); // You are starting the dial wave
    setIsCallActive(true);
  };

  // --- Triggered when clicking the Phone End Button ---
  const handleEndVideoCall = () => {
    socket.emit('end-call-signal', { roomId }); // Tell backend to inform the room
    setIsCallActive(false);
    setIsInitiator(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('send-message', { roomId, message, sender: userName });
    setMessage('');
  };

  const handleLeaveRoom = () => {
    if (isCallActive) handleEndVideoCall();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* 1. LEFT PANEL: Video Frame (Rendered side-by-side only when call is active) */}
      {isCallActive && (
        <VideoCallSection 
          roomId={roomId}
          userName={userName}
          isInitiator={isInitiator}
          onCallEnd={handleEndVideoCall}
        />
      )}

      {/* 2. RIGHT PANEL: Chat Body Frame */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
        
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

          <div className="flex items-center space-x-3">
            {isSearching ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500 w-40 md:w-60 transition-all"
                />
                <button 
                  onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                  className="absolute right-2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition duration-200"
                title="Search Messages"
              >
                <Search size={20} />
              </button>
            )}

            <button
              onClick={() => console.log('Voice call initiated')}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded-xl transition duration-200"
              title="Voice Call"
            >
              <Phone size={20} />
            </button>
            
            {/* Dynamic Button Color based on Call state */}
            <button
              onClick={handleStartVideoCall}
              disabled={isCallActive}
              className={`p-2 rounded-xl transition duration-200 ${
                isCallActive 
                  ? 'bg-emerald-600 text-white cursor-not-allowed animate-pulse' 
                  : 'bg-slate-700 hover:bg-slate-600 text-blue-400'
              }`}
              title="Video Call"
            >
              <Video size={20} />
            </button>
            
            <button
              onClick={handleLeaveRoom}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition duration-200 text-sm font-medium"
            >
              <LogOut size={16} />
              <span>Leave Room</span>
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
          {messages
            .filter(msg => {
              const content = msg.system ? msg.text : `${msg.sender} ${msg.text}`;
              return content.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map((msg) => {
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
        <footer className="bg-slate-800 border-t border-slate-700 p-4">
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
    </div>
  );
}

export default ChatPage;