import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

function JoinPage() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
 const [userName] = useState(loggedInUser?.username || 'Anonymous');
  const handleJoin = (e) => {
    e.preventDefault();
    if (!userName.trim() || !roomId.trim()) return;

    // Pass the data to the Chat room page via React Router state
    navigate(`/chat/${roomId}`, { state: { userName } });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full text-white mb-3 shadow-lg shadow-blue-500/30">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Chat Room</h1>
          <p className="text-slate-400 text-sm mt-1">Connect with your friends instantly</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Room ID</label>
            <input
              type="text"
              required
              placeholder="Enter Room ID (e.g., room-123)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition duration-200"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinPage;