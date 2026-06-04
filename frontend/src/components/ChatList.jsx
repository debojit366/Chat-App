import React from 'react';
import { Hash } from 'lucide-react';

function ChatList({ chats, searchQuery, onJoinRoom }) {
  // Local list filter logic
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredChats.length === 0) {
    return <div className="text-center text-xs text-slate-500 py-8">No matching joined rooms... 🔍</div>;
  }

  return (
    <div className="space-y-1">
      {filteredChats.map((chat) => (
        <div 
          key={chat.id} 
          onClick={() => onJoinRoom(chat.id)}
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
      ))}
    </div>
  );
}

export default ChatList;