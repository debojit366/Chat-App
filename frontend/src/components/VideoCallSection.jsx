import React, { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';
import { socket } from '../socket';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

function VideoCallSection({ roomId, userName, onCallEnd, isInitiator }) {
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const currentCallRef = useRef(null);

  useEffect(() => {
    let isComponentMounted = true;
    let activeStream = null;

    const setupPeerAndMedia = async () => {
      try {
        // 1. Get Local Camera and Mic
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // If the user closed the call while we were waiting for the camera
        if (!isComponentMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        activeStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Initialize PeerJS pointing to OWN Custom Signaling Server
        const customPeerId = `${roomId}-${userName.replace(/\s+/g, '')}`;
        
        const peer = new Peer(customPeerId, {
          host: 'localhost',       // Hamare backend ka host
          port: 5000,              // Hamare backend ka port
          path: '/peerjs/myapp',   // server.js me jo app.use path set kiya tha
          secure: false            // Dev mode me http hai isliye false (production/https me true hoga)
        });
        
        peerInstanceRef.current = peer;

        peer.on('open', (id) => {
          console.log(`📡 Connected to OWN Custom Peer Server with ID: ${id}`);
          if (isInitiator) {
            socket.emit('send-message', { 
              roomId, 
              message: `☎️ Call started by ${userName}. Connecting via secure local channel...`, 
              sender: 'System'
            });
          }
        });

        // 3. ANSWERING SIDE
        peer.on('call', (incomingCall) => {
          console.log("📬 Receiving incoming custom peer call...");
          currentCallRef.current = incomingCall;
          incomingCall.answer(activeStream);

          incomingCall.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          });
        });

        // 4. CALLING SIDE
        socket.on('peer-ready-to-receive', ({ targetPeerName }) => {
          if (isInitiator) {
            const targetPeerId = `${roomId}-${targetPeerName.replace(/\s+/g, '')}`;
            console.log(`🚀 Dialing via Custom Peer Server to: ${targetPeerId}`);
            
            const outgoingCall = peer.call(targetPeerId, activeStream);
            currentCallRef.current = outgoingCall;

            outgoingCall.on('stream', (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          }
        });

        socket.emit('ready-for-call', { roomId, userName });

      } catch (err) {
        console.error("Failed to fetch media streams:", err);
      }
    };

    setupPeerAndMedia();

    return () => {
      isComponentMounted = false;
      console.log("🧹 Cleaning custom peer sessions...");
      if (currentCallRef.current) currentCallRef.current.close();
      if (peerInstanceRef.current) peerInstanceRef.current.destroy();
      if (activeStream) activeStream.getTracks().forEach(track => track.stop());
      socket.off('peer-ready-to-receive');
    };
  }, [roomId, userName, isInitiator]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="w-full md:w-1/2 bg-slate-950 p-4 flex flex-col justify-center items-center gap-4 border-r border-slate-800 h-full">
      <div className="relative w-full aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md">Remote Peer</span>
      </div>
      
      <div className="relative w-full max-w-[180px] aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 self-end shadow-md">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded-md">You</span>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button onClick={toggleMute} className={`p-3 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <button onClick={onCallEnd} className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-lg">
          <PhoneOff size={24} />
        </button>

        <button onClick={toggleVideo} className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      </div>
    </div>
  );
}

export default VideoCallSection;