import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Peer } from 'peerjs';

function VideoCallArea({ roomId, currentUserId, socket, onCallClose }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('Initializing media...');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const currentCallInstance = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // 🔥 Optimization 1: Strict Dynamic Binding Hook
  // ─────────────────────────────────────────────────────────────────────────
  // Hamesha use strict Ref-binding when the stream state changes, don't rely only on the main useEffect.
  // This ensures dynamic elements always bind safely.
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("🟢 Strictly binding dynamic remote media track object...");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]); // Trigger when state updates

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("🎥 strictly binding dynamic local media track object...");
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Main operational pipeline framework
  useEffect(() => {
    let isMounted = true;
    let localStreamInstance = null;

    const startWebRTCPipeline = async () => {
      try {
        console.log("🎥 Grabbing camera and microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamInstance = stream;
        setLocalStream(stream);
        // Direct binding to satisfy initial render context
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        console.log(`📡 Spawn PeerJS broker bound to ID: ${currentUserId}`);
        const peer = new Peer(currentUserId, { debug: 1 }); // Less logging complexity

        peerInstance.current = peer;

        peer.on('open', (id) => {
          if (!isMounted) return;
          console.log(`🟢 Peer broker is ready: ${id}`);
          setCallStatus('Waiting for peer...');
          socket.emit('ready-for-call', { roomId: String(roomId).trim(), userName: currentUserId });
        });

        peer.on('call', (incomingCall) => {
          if (!isMounted) return;
          console.log("📞 Receiving inbound request!");
          
          incomingCall.answer(stream); // Answer with current stream
          currentCallInstance.current = incomingCall;

          incomingCall.on('stream', (incomingRemoteStream) => {
            console.log("🟢 Remote media stream injected!");
            setRemoteStream(incomingRemoteStream);
            setCallStatus('Call Connected 🟢');
            // Strict element binding handshake check
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = incomingRemoteStream;
            }
          });
        });

        socket.on('peer-ready-to-receive', ({ targetPeerName }) => {
          if (isMounted && targetPeerName && targetPeerName !== currentUserId) {
            console.log(`🚀 Automated dialing routing to: ${targetPeerName}`);
            setCallStatus('Dialing remote endpoint...');
            
            const call = peer.call(targetPeerName, stream);
            
            if (call) {
              currentCallInstance.current = call;
              
              call.on('stream', (dialedRemoteStream) => {
                console.log("🟢 Remote media stream injected!");
                setRemoteStream(dialedRemoteStream);
                setCallStatus('Call Connected 🟢');
                // Strict element binding handshake check
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = dialedRemoteStream;
                }
              });

              call.on('error', (err) => {
                console.error("❌ WebRTC Call Error:", err);
                setCallStatus('Call failed or rejected ❌');
              });
            }
          }
        });

        socket.on('call-terminated-by-peer', () => {
          console.log("🛑 Remote peer disconnected.");
          if (isMounted) onCallClose();
        });

      } catch (err) {
        console.error("❌ Hardware abort permission exception:", err);
        setCallStatus('Camera access denied 🛑');
      }
    };

    startWebRTCPipeline();

    return () => {
      isMounted = false;
      console.log("🧹 Tearing down media tracks securely...");
      socket.off('peer-ready-to-receive');
      socket.off('call-terminated-by-peer');
      
      if (currentCallInstance.current) currentCallInstance.current.close();
      if (peerInstance.current) peerInstance.current.destroy();
      if (localStreamInstance) {
        localStreamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, currentUserId, socket]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleHangUp = () => {
    socket.emit('end-call-signal', { roomId: String(roomId).trim() });
    onCallClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center p-4 h-screen w-screen relative overflow-hidden backdrop-blur-md">
      {/* Top operational status HUD layer */}
      <div className="absolute top-4 px-5 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono tracking-widest flex items-center gap-3 shadow-2xl z-20">
        <span className={`w-2 h-2 rounded-full ${callStatus.includes('Connected') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`}></span>
        STATUS: <span className="text-slate-200">{callStatus}</span>
      </div>

      {/* Main Grid Workspace Canvas */}
      <div className="flex-1 w-full flex items-center justify-center p-4 relative z-0">
        {/* Remote Large Monitor View Screen */}
        {remoteStream ? (
          // 🔥 Optimization 3: Added playsInline, muted=false, loadedmetadata strict triggers
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline // Strictly required for iOS and modern Chromium
            muted={false} // Ensure receiving track has audio enabled by default
            onLoadedMetadata={(e) => {
              console.log("🟢 Video metadata loaded, enforcing play pipeline...");
              e.target.play().catch(console.error); // Force safe play handshake check
            }}
            className="w-full h-full object-cover rounded-3xl shadow-2xl transition-all duration-300"
          />
        ) : (
          <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl w-full h-full flex flex-col items-center justify-center space-y-3">
            <div className="text-slate-600 font-medium text-xs tracking-widest uppercase animate-pulse">Waiting for remote user stream to handshake bridge... ⏳</div>
          </div>
        )}

        {/* Local Stream Floating Box View Area */}
        <div className="absolute bottom-6 right-6 w-44 md:w-60 aspect-video bg-slate-950 border-4 border-slate-700 rounded-2xl overflow-hidden shadow-3xl z-10 hover:scale-105 transition-transform duration-300">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted // strictly muted for local echo prevention loop
            playsInline // strict hardware mapping playsInline required
            className="w-full h-full object-cover transform -scale-x-100" 
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-[10px] text-slate-500">Camera Off</div>
          )}
        </div>
      </div>

      {/* Operational Operational Operational Control Operational operational operational Controller Operational Operational Controller Operational operacional dock Operational operator control operational control operational operational control operator Operational Operational Operational Controller Operational Operation operational control operator operational operational dock control panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 px-6 py-3.5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-20 transition-all hover:bg-slate-800/80 hover:scale-105 hover:backdrop-blur-sm">
        <button onClick={toggleMute} className={`p-3 rounded-2xl border ${isMuted ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50'}`}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button onClick={toggleVideo} className={`p-3 rounded-2xl border ${isVideoOff ? 'bg-red-500 text-white border-red-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50'}`}>
          {isVideoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
        </button>
        <button onClick={handleHangUp} className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl border border-red-700 shadow-xl shadow-red-600/20 active:scale-95 transition-all">
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}

export default VideoCallArea;