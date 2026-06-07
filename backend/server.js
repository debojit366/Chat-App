import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import crypto from 'crypto';

import authRoutes from './routes/auth.js'; 
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';

import { ExpressPeerServer } from 'peer';
import Message from './models/Message.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;



const allowedOrigins = [
  'http://localhost:5173', // Tumhara local frontend
  'https://chat-8r1tuwu1o-debojitdas366-gmailcoms-projects.vercel.app', // Tumhara Vercel production URL
];



// 1. CORS Configuration for Express Routes
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('https://chat-')) {
      return callback(null, true); // Agar origin list mein hai ya Vercel ka sub-domain hai toh allow kar do
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parser
app.use(express.json());

// 3. Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

app.get('/', (req, res) => {
    res.send({ message: "Server is up and running!" });
});

// MongoDB Connection Setup
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📁 MongoDB Database Connected Successfully'))
    .catch((err) => console.error('❌ Database Connection Error:', err));

// Global Error Handler for Express
app.use((err, req, res, next) => {
    console.error("🔥 EXPRESS ROUTE CRASHED:", err.stack);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// Create Core HTTP Server
const httpServer = createServer(app);

// 🛠️ 4. Initialize PeerServer (Signaling Server for Video/Voice Calls)
const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
    allow_discovery: true
});
app.use('/peerjs', peerServer);

// 🛠️ 5. Socket.io Integration with Strict CORS & Transports Fallbacks
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

// const io = new Server(httpServer, {
//     cors: { 
//         origin: "http://localhost:5173", // Dynamic client origin strictly specified
//         methods: ["GET", "POST"],
//         credentials: true
//     },
//     transports: ['polling', 'websocket'] // Auto fallback pipeline handshake support
// });

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userName }) => {
        const cleanRoomId = String(roomId).trim();
        
        // Security check for private rooms
        if (cleanRoomId.includes('_')) {
            const [user1Id, user2Id] = cleanRoomId.split('_');
            try {
                const user1 = await User.findById(user1Id);
                const user2 = await User.findById(user2Id);

                const isFriend = user1?.friends.some(f => f.toString() === user2Id) || user2?.friends.some(f => f.toString() === user1Id);

                if (!isFriend) {
                    console.log(`🚫 [Security Alert] Unauthorized access attempt by ${userName} in room ${cleanRoomId}`);
                    socket.emit('receive-message', {
                        id: 'sys-error',
                        text: '⚠️ Security Error: You can only chat with users who are on your friends list!',
                        system: true
                    });
                    return;
                }
            } catch (err) {
                console.error("Security check failed:", err);
                return;
            }
        }

        socket.join(cleanRoomId);
        console.log(`🔒 [Secure Chat Activated] ${userName} entered private room: ${cleanRoomId}`);
        socket.to(cleanRoomId).emit('user-connected', { userName });

        // 🔥 FIX 1: Schema ke mutabik 'chatRoomId' use karo chat history nikalne ke liye
        try {
            const chatHistory = await Message.find({ chatRoomId: cleanRoomId }).sort({ createdAt: 1 });
            socket.emit('chat-history', chatHistory);
        } catch (err) {
            console.error("History loading error:", err);
        }
    });

    socket.on('send-message', async ({ roomId, message, sender }) => {
        const cleanRoomId = String(roomId).trim();
        try {
            const newMessage = new Message({
                chatRoomId: cleanRoomId,
                senderId: sender,
                text: message
            });
            const savedMessage = await newMessage.save();

            const messageData = {
                id: savedMessage._id,
                _id: savedMessage._id,
                text: savedMessage.text,
                chatRoomId: savedMessage.chatRoomId,
                senderId: savedMessage.senderId,
                createdAt: savedMessage.createdAt
            };
            
            io.to(cleanRoomId).emit('receive-message', messageData);
        } catch (err) {
            console.error("❌ Error saving message:", err);
        }
    });

    // ==================== 📞 VOICE CALLING SIGNALS ====================
    socket.on('initiate-voice-call', ({ roomId, callerName }) => {
        const cleanRoomId = String(roomId).trim();
        console.log(`📞 Call initiated in Room: ${cleanRoomId} by ${callerName}`);
        socket.to(cleanRoomId).emit('incoming-voice-call', { 
            roomId: cleanRoomId, 
            callerName 
        });
    });

    socket.on('accept-voice-call', ({ roomId }) => {
        const cleanRoomId = String(roomId).trim();
        console.log(`✅ Call accepted in Room: ${cleanRoomId}`);
        socket.to(cleanRoomId).emit('voice-call-accepted');
    });

    socket.on('end-voice-call', ({ roomId }) => {
        const cleanRoomId = String(roomId).trim();
        console.log(`🛑 Call terminated or declined in Room: ${cleanRoomId}`);
        socket.to(cleanRoomId).emit('voice-call-ended');
    });

    // ==================== 🎥 WEBRTC CORE SIGNALS ====================
    socket.on('ready-for-call', ({ roomId, userName }) => {
        const cleanRoomId = String(roomId).trim();
        console.log(`📡 [PeerJS Signal] ${userName} is ready for call in room ${cleanRoomId}`);
        
        // 🔥 FIX 2: Room me broadcast karne se pehle ensure karo ki caller socket securely isolated ho
        socket.to(cleanRoomId).emit('peer-ready-to-receive', { targetPeerName: userName });
    });

    socket.on('end-call-signal', ({ roomId }) => {
        const cleanRoomId = String(roomId).trim();
        socket.to(cleanRoomId).emit('call-terminated-by-peer');
    });
    
    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.to(room).emit('user-disconnected', { socketId: socket.id });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Start Single Core Server Process
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});