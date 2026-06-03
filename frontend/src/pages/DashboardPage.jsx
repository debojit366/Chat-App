import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Plus, User, Search, Hash } from 'lucide-react';
import API from '../api';


function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // Storage for backend search
  const [friends, setFriends] = useState([]); // Database friends store
  const [loadingFriends, setLoadingFriends] = useState(true);
  // Parse logged in user metadata
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userName = loggedInUser?.username || 'Anonymous';
  const userId = loggedInUser?.id || loggedInUser?._id; // Ensure we have the current user's DB ID

  // Dynamic lists hooks (In real production app, fetch on mount via useEffect)
  const [recentChats] = useState([
    { id: 'room-101', name: 'WebRTC Developers', lastMessage: 'Brother, the call is not connecting...', time: '12:45 PM' },
    { id: 'gaming-zone', name: 'Chai Aur Code', lastMessage: 'Debojit: PeerJS server setup done!', time: 'Yesterday' },
  ]);

  // ==========================================
  // BACKEND DEBOUNCED SEARCH API EFFECT
  // ==========================================
  useEffect(() => {
  const delayDebounceFn = setTimeout(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const searchType = activeTab === 'chats' ? 'rooms' : 'users';
      
      // Axios call (No .json() required, data directly config object me milta hai)
      const response = await API.get('/search', {
        params: {
          type: searchType,
          q: searchQuery,
          userId: userId
        }
      });
      
      setSearchResults(response.data); // Axios output response.data me deta hai
    } catch (err) {
      console.error("❌ Axios search error:", err.response?.data?.message || err.message);
    }
  }, 300);

  return () => clearTimeout(delayDebounceFn);
}, [searchQuery, activeTab, userId]);

  useEffect(() => {
  const fetchMyFriends = async () => {
    if (!userId) return;
    try {
      setLoadingFriends(true);
      
      // Axios clean endpoint fetch path
      const response = await API.get(`/friends/${userId}`);
      
      setFriends(response.data); // MongoDB documents array directly sync ho gaya
    } catch (err) {
      console.error("❌ Axios friends load error:", err.response?.data?.message || err.message);
    } finally {
      setLoadingFriends(false);
    }
  };

  fetchMyFriends();
}, [userId]);

  // ==========================================
  // SECURE PRIVATE 1-ON-1 CHAT GENERATOR
  // ==========================================
  const handleStartPrivateChat = (friendId) => {
    if (!userId || !friendId) {
      alert("Error: User IDs session not found!");
      return;
    }

    // Alphabetic order sorting logic: hamesha identical room string structure banega
    const sortedIds = [userId, friendId].sort();
    const uniquePrivateRoomId = `${sortedIds[0]}_${sortedIds[1]}`;

    // Connect to private room context feed
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

  // Local sync filter array fallback (if search is empty)
  const filteredChats = recentChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search rooms..." : "Search friends database..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* LIST FEED AREA */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {activeTab === 'chats' ? (
            // CHATS TARGET FEED BLOCK
            searchQuery.trim() ? (
              searchResults.map((roomName, index) => (
                <div 
                  key={index} 
                  onClick={() => handleJoinRoom(roomName)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/60 cursor-pointer border border-transparent hover:border-slate-600 transition group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="bg-slate-700 p-2.5 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Hash size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-200 truncate">{roomName}</h4>
                      <p className="text-xs text-emerald-400 truncate">Joined Room channel</p>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
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
              <div className="text-center text-xs text-slate-500 py-8">No active chats found... 🔍</div>
            )
          ) : (
            // FRIENDS TARGET FEED BLOCK
            searchQuery.trim() ? (
              searchResults.map((user) => (
                <div 
                  key={user._id || user.id} 
                  onClick={() => handleStartPrivateChat(user._id || user.id)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/60 cursor-pointer border border-transparent hover:border-slate-600 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-700 p-2.5 rounded-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition">
                      <User size={18} />
                    </div>
                    <h4 className="text-sm font-medium text-slate-200">{user.username}</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Global User</span>
                </div>
              ))
            ) : loadingFriends ? (
              <div className="text-center text-xs text-slate-400 py-8 animate-pulse">
                Loading friends from database... ⏳
              </div>
            ) : friends.length > 0 ? (
              friends.map((friend) => (
                <div 
                  key={friend._id || friend.id} 
                  onClick={() => handleStartPrivateChat(friend._id || friend.id)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/60 cursor-pointer border border-transparent hover:border-slate-600 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative bg-slate-700 p-2.5 rounded-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition">
                      <User size={18} />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-slate-800 rounded-full ${friend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    </div>
                    <h4 className="text-sm font-medium text-slate-200">{friend.username}</h4>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${friend.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                    {friend.status || 'offline'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-500 py-8">Your friends list is empty... 👤</div>
            )
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

      {/* MAIN WELCOME VIEW PANEL */}
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