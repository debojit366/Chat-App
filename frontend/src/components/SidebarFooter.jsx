import React from 'react';
import { User, Bell } from 'lucide-react';

function SidebarFooter({ userName, setShowProfile, setShowNotifications, notifications }) {
  return (
    <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
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
  );
}

export default SidebarFooter;