import React from 'react';
import { Check, X, BellOff, ArrowLeft } from 'lucide-react';
import API from '../api';

function NotificationPanel({ notifications, onActionTaken, onClose }) {

  const handleResponse = async (requestId, actionStatus) => {
    try {
      const response = await API.post('/users/respond-request', {
        requestId,
        status: actionStatus // 'accepted' ya 'rejected'
      });

      if (response.status === 200) {
        alert(`Request ${actionStatus === 'accepted' ? 'Accept ✅' : 'Reject ❌'} ho gayi!`);
        onActionTaken(); // Parent sidebar data refresh refresh karega
      }
    } catch (err) {
      console.error("❌ Action respond error:", err);
    }
  };

  return (
    <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 h-full flex flex-col shadow-2xl p-4 animate-in slide-in-from-left duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ArrowLeft size={16} className="text-slate-400 cursor-pointer hover:text-white" onClick={onClose} />
          Notifications Panel
        </h3>
        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
          {notifications.length} Pending
        </span>
      </div>

      {/* Request Feed Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center p-4">
            <BellOff size={28} className="mb-2 text-slate-600" />
            <p className="text-xs">No pending friend requests at the moment, bhai!</p>
          </div>
        ) : (
          notifications.map((req) => (
            <div 
              key={req._id} 
              className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl flex flex-col gap-2 transition hover:border-slate-600"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{req.sender?.username}</p>
                <p className="text-[10px] text-slate-500 truncate">{req.sender?.email}</p>
                <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">Wants to be your friend</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={() => handleResponse(req._id, 'accepted')}
                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1"
                >
                  <Check size={12} /> Accept
                </button>
                <button 
                  onClick={() => handleResponse(req._id, 'rejected')}
                  className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1"
                >
                  <X size={12} /> Ignore
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default NotificationPanel;