import React from 'react';
import { User } from 'lucide-react';

function FriendList({ friends, searchQuery, loading, onStartChat }) {
  // Local list filter logic
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-xs text-slate-400 py-8 animate-pulse">Loading database friends... ⏳</div>;
  }

  if (filteredFriends.length === 0) {
    return <div className="text-center text-xs text-slate-500 py-8">No friends match your search... 👤</div>;
  }

  return (
    <div className="space-y-1">
      {filteredFriends.map((friend) => (
        <div 
          key={friend._id || friend.id} 
          onClick={() => onStartChat(friend._id || friend.id)}
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
      ))}
    </div>
  );
}

export default FriendList;