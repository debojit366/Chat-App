import React from 'react';
import { ArrowLeft, Phone, Video } from 'lucide-react';

function ChatHeader({ activeChatName, activeChatId, setActiveChatId, setActiveChatName, handleVoiceCall, handleVideoCall }) {
  return (
    <div className="h-14 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between px-4 z-10 backdrop-blur-md">
      <div className="flex items-center space-x-3 min-w-0">
        <button 
          onClick={() => { setActiveChatId(null); setActiveChatName(''); }}
          className="p-2 -ml-2 text-slate-400 hover:text-white bg-slate-800/40 rounded-xl md:hidden transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-white truncate flex items-center gap-2">
            {activeChatName || 'Active Room'}
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" title="Online Ready"></span>
          </h3>
          <p className="text-[10px] text-slate-500 font-mono truncate">Room ID: {activeChatId}</p>
        </div>
      </div>

      {/* 🛠️ ACTION BUTTON PIPELINES */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={handleVoiceCall}
          className="p-2 bg-slate-950 border border-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl transition"
          title="Voice Call"
        >
          <Phone size={15} />
        </button>

        <button 
          onClick={handleVideoCall}
          className="p-2 bg-slate-950 border border-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-blue-400 rounded-xl transition"
          title="Video Call"
        >
          <Video size={15} />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;