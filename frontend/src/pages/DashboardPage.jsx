import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Search, ArrowLeft, Bell } from 'lucide-react';
import API from '../api';
import UserSearch from '../components/UserSearch';
import ChatList from '../components/ChatList';
import FriendList from '../components/FriendList';
import UserProfile from '../components/UserProfile';
import NotificationPanel from '../components/NotificationPanel';

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatName, setActiveChatName] = useState('');
  
  // Toggler Navigation States
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Database pipelines States
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userName = loggedInUser?.username || 'Anonymous';
  const userId = loggedInUser?.id || loggedInUser?._id;

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

  const fetchMyRooms = async () => {
    if (!userId) return;
    try {
      setLoadingChats(true);
      const response = await API.get(`/chats/my-rooms/${userId}`);
      const formattedRooms = response.data.map(room => ({
        id: room._id,
        name: room.name,
        lastMessage: room.lastMessage,
        time: room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'
      }));
      setRecentChats(formattedRooms);
    } catch (err) {
      console.error("❌ Error loading dynamic chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  // 2. FETCH PENDING NOTIFICATIONS FROM DATABASE
  const fetchMyNotifications = async () => {
    if (!userId) return;
    try {
      const response = await API.get(`/users/notifications/${userId}`);
      setNotifications(response.data);
    } catch (err) {
      console.error("❌ Notifications tracking error:", err);
    }
  };

  // Sync data loads
  useEffect(() => {
    fetchMyFriends();
    fetchMyRooms();
    fetchMyNotifications(); // App load hote hi notifications bhi fetch karo
    
    // Periodically poll for new notifications every 10 seconds
    const interval = setInterval(fetchMyNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleStartPrivateChat = async (friendId) => {
    if (!userId || !friendId) return;
    try {
      const targetFriend = friends.find(f => (f._id || f.id) === friendId);
      const response = await API.post('/chats/private-room', {
        userId,
        friendId,
        friendName: targetFriend ? targetFriend.username : 'Direct Message'
      });

      if (response.status === 200) {
        setActiveChatId(response.data._id);
        setActiveChatName(targetFriend ? targetFriend.username : 'Direct Message');
        fetchMyRooms();
      }
    } catch (err) {
      console.error("❌ Failed to initiate chat room:", err);
    }
  };

  const handleJoinRoom = (roomId) => {
    if (!roomId.trim()) return;
    const targetChat = recentChats.find(c => c.id === roomId);
    setActiveChatId(roomId);
    setActiveChatName(targetChat ? targetChat.name : roomId);
  };

  // Refresh data when a notification action (Accept/Reject) is executed
  const handleNotificationActionRefresh = () => {
    fetchMyNotifications();
    fetchMyFriends();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 overflow-hidden h-screen w-full relative">
      
      {/* ================= LEFT SIDEBAR AREA ================= */}
      <aside className={`w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full relative z-20 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* CONDITION-1: Show Profile view page */}
        {showProfile ? (
          <UserProfile onClose={() => setShowProfile(false)} />
        ) : 
        /* CONDITION-2: Show Notification Panel view page */
        showNotifications ? (
          <NotificationPanel 
            notifications={notifications} 
            onActionTaken={handleNotificationActionRefresh} 
            onClose={() => setShowNotifications(false)} 
          />
        ) : (
          /* CONDITION-3: Default View Dashboard */
          <>
            {/* User Info Header with Notification Badge */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
              <div 
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-3 min-w-0 cursor-pointer group"
                title="View Profile Settings"
              >
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md flex-shrink-0 group-hover:bg-blue-700 transition">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-white truncate max-w-[120px]">{userName}</h2>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> Profile
                  </span>
                </div>
              </div>

              {/* 🔔 PROFESSIONAL BELL BUTTON WITH RED BADGE COUNT */}
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative p-2 bg-slate-900/40 border border-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                title="View Pending Requests"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[9px] flex items-center justify-center rounded-full animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* Global User Search Component */}
            {/* <UserSearch 
              currentUserId={userId} 
              myFriends={friends} 
              onFriendAdded={() => { fetchMyFriends(); fetchMyRooms(); }}
              onStartChat={handleStartPrivateChat}
            /> */}

            {/* Navigation Tabs */}
            <div className="flex p-2 gap-2 border-b border-slate-700 bg-slate-800/30">
              <button 
                onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${activeTab === 'chats' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700/50'}`}
              >
                Rooms & Chats
              </button>
              <button 
                onClick={() => { setActiveTab('friends'); setSearchQuery(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${activeTab === 'friends' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700/50'}`}
              >
                My Friends
              </button>
            </div>

            {/* Local Filter Box */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'chats' ? "Filter joined rooms..." : "Filter friends list..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-900/40 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* CLEAN MODULAR FEED AREA */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
              {activeTab === 'chats' ? (
                loadingChats ? (
                  <div className="text-center text-xs text-slate-400 py-8 animate-pulse">Loading conversations... ⏳</div>
                ) : (
                  <ChatList chats={recentChats} searchQuery={searchQuery} onJoinRoom={handleJoinRoom} />
                )
              ) : (
                <FriendList friends={friends} searchQuery={searchQuery} loading={loadingFriends} onStartChat={handleStartPrivateChat} />
              )}
            </div>
          </>
        )}
      </aside>

      {/* ================= RIGHT WORKSPACE VIEW CONTEXT ================= */}
      <main className={`flex-1 flex flex-col bg-slate-950 h-full relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Persistent Global User Search */}
        <div className="w-full z-10">
          <UserSearch 
            currentUserId={userId} 
            myFriends={friends} 
            onFriendAdded={() => { fetchMyFriends(); fetchMyRooms(); }}
            onStartChat={handleStartPrivateChat}
          />
        </div>

        {activeChatId ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden mt-4">
            <div className="h-14 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between px-4 z-10">
              <div className="flex items-center space-x-3 min-w-0">
                <button 
                  onClick={() => { setActiveChatId(null); setActiveChatName(''); }}
                  className="p-2 -ml-2 text-slate-400 hover:text-white bg-slate-800/40 rounded-xl md:hidden transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h3 className="font-bold text-sm text-white truncate">{activeChatName}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Room ID: {activeChatId}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/40 relative overflow-y-auto flex flex-col justify-end p-4">
              <div className="text-center text-xs text-slate-600 border border-dashed border-slate-800 py-12 rounded-2xl w-full max-w-md mx-auto my-auto">
                💬 Chat Engine Stream Active: "{activeChatName}"
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl text-blue-400 mb-4 shadow-xl">
              <MessageSquare size={40} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Select a Workspace Conversations</h2>
            <p className="text-slate-500 max-w-xs text-xs leading-relaxed">
              Click on any active room or database friend profile from the left navigation pane to trigger full screen workspace view stream.
            </p>
          </div>
        )}
      </main>

    </div>
  );
}

export default DashboardPage;