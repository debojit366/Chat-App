import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import API from '../api';
import { io } from 'socket.io-client';

// Core Layout Extractions Imports
import SidebarHeader from '../components/SidebarHeader';
import SidebarFooter from '../components/SidebarFooter';
import ChatHeader from '../components/ChatHeader';
import ChatArea from '../components/ChatArea';
import UserProfile from '../components/UserProfile';
import NotificationPanel from '../components/NotificationPanel';
import VoiceCallModal from '../components/VoiceCallModal';
import VideoCallArea from '../components/VideoCallArea';

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [socket, setSocket] = useState(null);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const [voiceCallState, setVoiceCallState] = useState('idle');
  const [callerName, setCallerName] = useState('');
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const userName = loggedInUser?.username || 'Anonymous';
  const userId = loggedInUser?.id || loggedInUser?._id;

  // ==================== DATA API PIPELINES ====================
  const fetchMyFriends = async () => {
    if (!userId) return;
    try {
      setLoadingFriends(true);
      const response = await API.get(`/api/users/friends/${userId}`);
      setFriends(response.data);
    } catch (err) { console.error("❌ Friends sync error:", err); }
    finally { setLoadingFriends(false); }
  };

  const fetchMyRooms = async () => {
    if (!userId) return;
    try {
      setLoadingChats(true);
      const response = await API.get(`/api/chats/my-rooms/${userId}`);
      const formattedRooms = response.data.map(room => ({
        id: room._id, name: room.name, lastMessage: room.lastMessage,
        time: room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'
      }));
      setRecentChats(formattedRooms);
    } catch (err) { console.error("❌ Rooms loading error:", err); }
    finally { setLoadingChats(false); }
  };

  const fetchMyNotifications = async () => {
    if (!userId) return;
    try {
      const response = await API.get(`/api/users/notifications/${userId}`);
      setNotifications(response.data);
    } catch (err) { console.error("❌ Notifications load error:", err); }
  };

  // ==================== SYSTEMS INITIALIZATION ====================
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL);
    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, []);

  useEffect(() => {
    if (socket && activeChatId) {
      socket.emit('join-room', { roomId: activeChatId, userName });
    }
  }, [socket, activeChatId]);

  useEffect(() => {
    if (!userId) return;
    fetchMyFriends(); fetchMyRooms(); fetchMyNotifications();
    const interval = setInterval(fetchMyNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  // ==================== REAL-TIME CALL LISTENERS ====================
  useEffect(() => {
    if (!socket || !activeChatId) return;

    socket.on('incoming-voice-call', ({ callerName: remoteCaller }) => {
      setVoiceCallState('incoming'); setCallerName(remoteCaller);
    });
    socket.on('voice-call-accepted', () => setVoiceCallState('connected'));
    socket.on('voice-call-ended', () => cleanupVoiceTracks());

    socket.on('peer-ready-to-receive', ({ targetPeerName }) => {
    // Strict conditional processing check
    if (targetPeerName !== userId) {
      setIsVideoCallActive(true);
    }
  });
    socket.on('call-terminated-by-peer', () => setIsVideoCallActive(false));

    return () => {
      socket.off('incoming-voice-call'); socket.off('voice-call-accepted');
      socket.off('voice-call-ended'); socket.off('peer-ready-to-receive');
      socket.off('call-terminated-by-peer');
    };
  }, [socket, activeChatId, userId]);

  // ==================== MEDIA CAPTURE PROCESSORS ====================
  const handleVoiceCall = async () => {
    if (!activeChatId || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = stream;
      setVoiceCallState('dialing'); setCallerName(activeChatName || 'Friend');
      socket.emit('initiate-voice-call', { roomId: activeChatId, callerName: userName });
    } catch (err) { alert("Microphone access required! 🎙️"); }
  };

  const acceptIncomingCall = async () => {
    if (!activeChatId || !socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = stream;
      setVoiceCallState('connected');
      socket.emit('accept-voice-call', { roomId: activeChatId });
    } catch (err) { alert("Microphone permission error."); }
  };

  const declineOrEndCall = () => {
    if (!activeChatId || !socket) return;
    socket.emit('end-voice-call', { roomId: activeChatId });
    cleanupVoiceTracks();
  };

  const cleanupVoiceTracks = () => {
    setVoiceCallState('idle'); setCallerName('');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleVideoCall = () => { if (activeChatId) setIsVideoCallActive(true); };

  const handleStartPrivateChat = async (friendId) => {
    if (!userId || !friendId) return;
    try {
      const targetFriend = friends.find(f => (f._id || f.id) === friendId);
      const response = await API.post('/api/chats/private-room', {
        userId, friendId, friendName: targetFriend ? targetFriend.username : 'Direct Message'
      });
      if (response.status === 200) {
        setActiveChatId(response.data._id);
        setActiveChatName(targetFriend ? targetFriend.username : 'Direct Message');
        fetchMyRooms();
      }
    } catch (err) { console.error("❌ Room bootstrap exception:", err); }
  };

  const handleJoinRoom = (roomId) => {
    const targetChat = recentChats.find(c => c.id === roomId);
    setActiveChatId(roomId); setActiveChatName(targetChat ? targetChat.name : roomId);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 overflow-hidden h-screen w-full relative">
      
      {/* ================= LEFT SIDEBAR PANEL LAYER ================= */}
      <aside className={`w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full relative z-20 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {showProfile ? (
          <UserProfile onClose={() => setShowProfile(false)} />
        ) : showNotifications ? (
          <NotificationPanel notifications={notifications} onActionTaken={() => { fetchMyNotifications(); fetchMyFriends(); }} onClose={() => setShowNotifications(false)} />
        ) : (
          <>
            <SidebarHeader 
              userId={userId} friends={friends} fetchMyFriends={fetchMyFriends} fetchMyRooms={fetchMyRooms} handleStartPrivateChat={handleStartPrivateChat}
              activeTab={activeTab} setActiveTab={setActiveTab} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loadingChats={loadingChats}
              recentChats={recentChats} loadingFriends={loadingFriends} handleJoinRoom={handleJoinRoom}
            />
            <SidebarFooter userName={userName} setShowProfile={setShowProfile} setShowNotifications={setShowNotifications} notifications={notifications} />
          </>
        )}
      </aside>

      {/* ================= RIGHT STREAM CONTEXT WORKSPACE ================= */}
      <main className={`flex-1 flex flex-col bg-slate-950 h-full relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            <ChatHeader 
              activeChatName={activeChatName} activeChatId={activeChatId} setActiveChatId={setActiveChatId} 
              setActiveChatName={setActiveChatName} handleVoiceCall={handleVoiceCall} handleVideoCall={handleVideoCall} 
            />
            <div className="flex-1 w-full overflow-hidden relative bg-slate-950">
              <ChatArea roomId={activeChatId} roomName={activeChatName} currentUserId={userId} userName={userName} socket={socket} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-3xl text-blue-400 mb-4 shadow-xl">
              <MessageSquare size={40} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Select a Workspace Conversation</h2>
            <p className="text-slate-500 max-w-xs text-xs">Click on any active thread stream to connect hooks.</p>
          </div>
        )}
      </main>

      <audio ref={remoteAudioRef} autoPlay playsInline />
      <VoiceCallModal callState={voiceCallState} callerName={callerName} onAccept={acceptIncomingCall} onDecline={declineOrEndCall} />
      {isVideoCallActive && <VideoCallArea roomId={activeChatId} currentUserId={userId} socket={socket} onCallClose={() => setIsVideoCallActive(false)} />}
    </div>
  );
}

export default DashboardPage;