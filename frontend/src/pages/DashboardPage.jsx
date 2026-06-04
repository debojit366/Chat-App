import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Plus, User, Search } from 'lucide-react';
import API from '../api';
import UserSearch from '../components/UserSearch';
import ChatList from '../components/ChatList';     // <-- 1. Import Naya ChatList
import FriendList from '../components/FriendList'; // <-- 2. Import Naya FriendList

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userName = loggedInUser?.username || 'Anonymous';
  const userId = loggedInUser?.id || loggedInUser?._id;

  // Mock static chats data
  const [recentChats] = useState([
    { id: 'room-101', name: 'WebRTC Developers', lastMessage: 'Call connect nahi ho raha bhai...', time: '12:45 PM' },
    { id: 'gaming-zone', name: 'Chai Aur Code', lastMessage: 'Debojit: PeerJS server setup done!', time: 'Yesterday' },
  ]);

  const fetchMyFriends = async () => {
    if (!userId) return;
    try {
      setLoadingFriends(true);
      const response = await API.get(`/users/friends/${userId}`);
      setFriends(response.data);
    } catch (err) {
      console.error("❌ Friends load error:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchMyFriends();
  }, [userId]);

  const handleStartPrivateChat = (friendId) => {
    if (!userId || !friendId) return;
    const sortedIds = [userId, friendId].sort();
    const uniquePrivateRoomId = `${sortedIds[0]}_${sortedIds[1]}`;
    navigate(`/chat/${uniquePrivateRoomId}`, { state: { userName } });
  };

  const handleJoinRoom = (roomId) => {
    if (!roomId.trim()) return;
    navigate(`/chat/${roomId}`, { state: { userName } });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 overflow-hidden h-screen">
      
      {/* SIDEBAR SECTION */}
      <aside className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full relative">
        
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

        {/* Global User Search Component */}
        <UserSearch 
          currentUserId={userId} 
          myFriends={friends} 
          onFriendAdded={fetchMyFriends}
          onStartChat={handleStartPrivateChat}
        />

        {/* Navigation Tabs */}
        <div className="flex p-2 gap-2 border-b border-slate-700 bg-slate-800/30">
          <button 
            onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'chats' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => { setActiveTab('friends'); setSearchQuery(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'friends' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            Friends
          </button>
        </div>

        {/* Local Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search joined rooms..." : "Search current friends..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* CLEAN MODULAR LIST FEED AREA */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {activeTab === 'chats' ? (
            <ChatList 
              chats={recentChats} 
              searchQuery={searchQuery} 
              onJoinRoom={handleJoinRoom} 
            />
          ) : (
            <FriendList 
              friends={friends} 
              searchQuery={searchQuery} 
              loading={loadingFriends} 
              onStartChat={handleStartPrivateChat} 
            />
          )}
        </div>

        {/* Bottom Join Action Button */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={18} /> Join New Room
          </button>
        </div>
      </aside>

      {/* RIGHT VIEW PANEL */}
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl text-blue-400 mb-4 shadow-xl">
          <MessageSquare size={48} className="animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {userName}!</h2>
        <p className="text-slate-400 max-w-sm text-sm">
          Select a friend or chat room from the sidebar menu to start instant secure messaging and high-quality P2P WebRTC Video Calling.
        </p>
      </main>

      {/* POPUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Enter Room ID</h3>
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
                onClick={() => { handleJoinRoom(newRoomId); setShowCreateModal(false); }} 
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