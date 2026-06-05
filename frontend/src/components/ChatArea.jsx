import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react'; 
import API from '../api';

function ChatArea({ roomId, roomName, currentUserId, socket }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 📜 Automatically scroll to the bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Initial Chat History Loader ---
  const fetchMessages = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const response = await API.get(`/chats/messages/${roomId}`);
      setMessages(response.data);
    } catch (err) {
      console.error("❌ Error loading messages history:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 🔌 SOCKET.IO REAL-TIME LISTENERS ====================
  useEffect(() => {
  // 1. Initial history fetch jab bhi roomId badle
  fetchMessages();

  // Agar socket connected nahi hai, toh aage ke listeners mat lagao
  if (!socket || !roomId) return;

  console.log(`🎧 Syncing live socket subscription channel for Room: ${roomId}`);

  // 2. Real-time message listener bind karo
  const handleIncomingMessage = (incomingMsg) => {
    console.log("📩 New real-time message captured via socket:", incomingMsg);
    
    setMessages((prev) => {
      const isDuplicate = prev.some(msg => msg._id === incomingMsg.id || msg._id === incomingMsg._id);
      if (isDuplicate) return prev;
      
      const normalizedMsg = {
        ...incomingMsg,
        senderId: incomingMsg.senderId || incomingMsg.sender,
        _id: incomingMsg._id || incomingMsg.id
      };
      
      return [...prev, normalizedMsg];
    });
  };

  socket.on('receive-message', handleIncomingMessage);

  // 3. Cleanup handler
  return () => {
    console.log(`🗑️ Unmounting message hooks from room layer: ${roomId}`);
    socket.off('receive-message', handleIncomingMessage);
  };
}, [roomId, socket]);

  // ==================== 🚀 SEND MESSAGE ENGINE ====================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // UI input clearing lag free feel ke liye immediate operations par

    try {
      // Payload structuring as per your API schema requirement
      const messagePayload = {
        chatRoomId: roomId,
        senderId: currentUserId,
        text: messageText
      };

      // 1. Emit live to server socket loop first for lightning fast sync across tabs
      if (socket) {
        socket.emit('send-message', {
          roomId: roomId,
          message: messageText,
          sender: currentUserId
        });
      }
      
      // 2. Persist database log tracking via API pipeline asynchronously
      const response = await API.post('/chats/send-message', messagePayload);
      
      // Agar backend socket pipeline khud handle nahi kar raha local screen append context,
      // toh update safely inside local state flow.
      if (response.status === 200 || response.status === 201) {
        setMessages((prev) => {
          const checkExist = prev.some(msg => msg._id === response.data._id);
          if (checkExist) return prev;
          return [...prev, response.data];
        });
      }
    } catch (err) {
      console.error("❌ Message transmission framework failed:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
      
      {/* Messages Render Container Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="text-center text-xs text-slate-500 my-auto animate-pulse">Loading messages history... ⏳</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-slate-600 border border-dashed border-slate-800/60 py-12 rounded-2xl max-w-sm mx-auto my-auto">
            👋 Say Hi! Start your 1v1 private thread loop.
          </div>
        ) : (
          messages.map((msg, index) => {
            // Evaluates both direct mapping profiles
            const isMe = msg.senderId === currentUserId || msg.sender?._id === currentUserId;
            
            return (
              <div key={msg._id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-md break-words ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE SEND BAR CONTAINER */}
      <div className="p-4 bg-slate-900/40 border-t border-slate-800/80 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
          <button type="button" className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition">
            <Smile size={16} />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message "${roomName}"... 💬`}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
          />
          
          <button 
            type="submit" 
            disabled={!newMessage.trim()} 
            className={`p-3 rounded-xl transition shadow-lg active:scale-95 ${
              newMessage.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            }`}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

    </div>
  );
}

export default ChatArea;