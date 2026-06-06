import React from 'react';
import { Search } from 'lucide-react';
import UserSearch from './UserSearch';
import ChatList from './ChatList';
import FriendList from './FriendList';

function SidebarHeader({ 
  userId, friends, fetchMyFriends, fetchMyRooms, handleStartPrivateChat,
  activeTab, setActiveTab, searchQuery, setSearchQuery, loadingChats, recentChats,
  loadingFriends, handleJoinRoom 
}) {
  return (
    <>
      <div className="p-3 bg-slate-800/30 border-b border-slate-700/50">
        <UserSearch 
          currentUserId={userId} 
          myFriends={friends} 
          onFriendAdded={() => { fetchMyFriends(); fetchMyRooms(); }}
          onStartChat={handleStartPrivateChat}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-2 gap-2 bg-slate-800/10">
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

      {/* Modular Lists Feed */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-2">
        <div className="px-1 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Filter joined rooms..." : "Filter friends list..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/40 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

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
  );
}

export default SidebarHeader;