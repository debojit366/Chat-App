import React from 'react';
import { Phone, X } from 'lucide-react';

function VoiceCallModal({ callState, callerName, onAccept, onDecline }) {
  if (callState === 'idle') return null;

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-80 max-w-full text-center shadow-2xl relative overflow-hidden">
        
        {/* Dynamic Animated Call Rings */}
        <div className="relative mb-6 flex justify-center">
          {callState !== 'connected' && (
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping scale-150"></div>
          )}
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-5 rounded-full text-white shadow-lg shadow-blue-500/30 z-10">
            <Phone 
              size={32} 
              className={callState === 'dialing' || callState === 'incoming' ? 'animate-bounce' : ''} 
            />
          </div>
        </div>

        {/* Dynamic Status Text */}
        <h3 className="text-white font-bold text-lg mb-1 truncate px-2">{callerName}</h3>
        <p className="text-xs text-slate-400 font-mono tracking-wide mb-6">
          {callState === 'dialing' && 'DIALING LINE... 📡'}
          {callState === 'incoming' && 'INCOMING VOICE CALL... 🔔'}
          {callState === 'connected' && 'CONNECTED (SECURE P2P) 🔐'}
        </p>

        {/* Dynamic Buttons Layout based on State */}
        <div className="flex items-center justify-center gap-4">
          {callState === 'incoming' ? (
            <>
              {/* Accept Button */}
              <button 
                onClick={onAccept}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                Accept
              </button>
              {/* Decline Button */}
              <button 
                onClick={onDecline}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-red-600/20"
              >
                Decline
              </button>
            </>
          ) : (
            /* Single Hang up Button for Dialing or Connected status */
            <button 
              onClick={onDecline}
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              <X size={14} />
              <span>{callState === 'dialing' ? 'Cancel Call' : 'Disconnect'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceCallModal;