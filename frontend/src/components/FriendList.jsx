import React from 'react';
import { MessageSquare, User } from 'lucide-react';

function FriendList({ friends, searchQuery, loading, onStartChat }) {
  if (loading) {
    return <div className="text-center text-xs text-slate-400 py-8 animate-pulse">Loading friend list... ⏳</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="text-center text-xs text-slate-500 py-8 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
        No friends found! 🔍
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-2">
      {friends.map((friend) => {
        const id = friend._id || friend.id;
        return (
          <div
            key={id}
            onClick={() => onStartChat(id)}
            className="p-2.5 bg-slate-900/40 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-700/30 rounded-xl flex items-center justify-between cursor-pointer transition group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="bg-slate-800 p-2 rounded-lg text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition flex-shrink-0">
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                  {friend.username}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {friend.email}
                </p>
              </div>
            </div>

            {/* Right indicator button */}
            <button className="p-1.5 bg-slate-900/60 border border-slate-800 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition hover:text-blue-400 hover:border-blue-500/20">
              <MessageSquare size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default FriendList;