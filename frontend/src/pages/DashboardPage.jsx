import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Plus, User, Search, Hash } from 'lucide-react';

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Parse logged in user from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userName = loggedInUser?.username || 'Anonymous';

  // Mock Data: In real app, you will fetch this from MongoDB
  const [recentChats] = useState([
    { id: 'room-101', name: 'WebRTC Developers', lastMessage: 'Call connect nahi ho raha bhai...', time: '12:45 PM' },
    { id: 'gaming-zone', name: 'Chai Aur Code', lastMessage: 'Debojit: PeerJS server setup done!', time: 'Yesterday' },
  ]);

  const [friends] = useState([
    { id: '1', username: 'Rahul Sharma', status: 'online' },
    { id: '2', username: 'Amit Das', status: 'offline' },
    { id: '3', username: 'Sneha Paul', status: 'online' },
  ]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleJoinRoom = (roomId) => {
    if (!roomId.trim()) return;
    // Redirect to the actual Chat Page with the selected Room ID
    navigate(`/chat/${roomId}`, { state: { userName } });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 overflow-hidden h-screen">
      
      {/* SIDEBAR SECTION */}
      <aside className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
        
        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white truncate max-w-[120px]">{userName}</h2>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span> Online
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-xl transition" title="Logout">
            <LogOut size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 gap-2 border-b border-slate-700 bg-slate-800/30">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'chats' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'friends' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            Friends
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search rooms..." : "Search friends..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* LIST FEED AREA */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {activeTab === 'chats' ? (
            recentChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => handleJoinRoom(chat.id)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/60 cursor-pointer border border-transparent hover:border-slate-600 transition group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="bg-slate-700 p-2.5 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Hash size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-200 truncate">{chat.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap self-start mt-1">{chat.time}</span>
              </div>
            ))
          ) : (
            friends.map((friend) => (
              <div 
                key={friend.id} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/40 border border-transparent transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative bg-slate-700 p-2.5 rounded-xl text-slate-300">
                    <User size={18} />
                    {friend.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-800 rounded-full"></span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-slate-200">{friend.username}</h4>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${friend.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {friend.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Action Button: Create/Join Custom Room */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
          >
            <Plus size={18} /> Join New Room
          </button>
        </div>
      </aside>

      {/* MAIN WELCOME VIEW PANEL (Right Side Screen) */}
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl text-blue-400 mb-4 shadow-xl">
          <MessageSquare size={48} className="animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {userName}!</h2>
        <p className="text-slate-400 max-w-sm text-sm">
          Select a chat room from the sidebar menu to start instant text messaging and high-quality P2P WebRTC Video Calling.
        </p>
      </main>

      {/* POPUP MODAL FOR JOINING NEW ROOM */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Enter Room ID</h3>
            <p className="text-xs text-slate-400 mb-4">Type any custom code name to create or sync into an existing room channel.</p>
            <input 
              type="text" 
              placeholder="e.g. core-team-room" 
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
              <button 
                onClick={() => {
                  handleJoinRoom(newRoomId);
                  setShowCreateModal(false);
                }} 
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardPage;