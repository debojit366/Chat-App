import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import authRoutes from './routes/auth.js'; 
import userRoutes from './routes/users.js';
import { ExpressPeerServer } from 'peer';
import Message from './models/Message.js';
import User from './models/User.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Configuration
app.use(cors({ origin: "*" })); 

// 2. Body Parser
app.use(express.json());

// 3. Debug Logger Middleware 
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📦 Request Body:`, JSON.stringify(req.body));
    }
    next();
});

// 4. Bind Authentication API Routes
app.use('/api/auth', authRoutes);

// 5. User API Routes
app.use('/api/users', userRoutes);

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

const httpServer = createServer(app);

// Initialize PeerServer
const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
    path: '/myapp'
});

app.use('/peerjs', peerServer);

const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userName }) => {
    
    // If it's a private room (ID contains '_'), verify access permissions
    if (roomId.includes('_')) {
        const [user1Id, user2Id] = roomId.split('_');

        try {
            const user1 = await User.findById(user1Id);
            const user2 = await User.findById(user2Id);

            const isFriend = user1?.friends.some(f => f.toString() === user2Id) || user2?.friends.some(f => f.toString() === user1Id);

            if (!isFriend) {
                console.log(`🚫 [Security Alert] Unauthorized access attempt by ${userName} in room ${roomId}`);
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

    // Standard room join if authentication passes
    socket.join(roomId);
    console.log(`🔒 [Secure Chat Activated] ${userName} entered private room: ${roomId}`);
    socket.to(roomId).emit('user-connected', { userName });

    // Load Chat History
    try {
        const chatHistory = await Message.find({ roomId }).sort({ createdAt: 1 });
        socket.emit('chat-history', chatHistory);
    } catch (err) {
        console.error("History loading error:", err);
    }
});

    socket.on('send-message', async ({ roomId, message, sender }) => {
    try {
        const newMessage = new Message({
            roomId,
            sender,
            text: message
        });
        const savedMessage = await newMessage.save();

        // Broadcast the saved message structure to the room
        const messageData = {
            id: savedMessage._id,
            text: savedMessage.text,
            sender: savedMessage.sender,
            createdAt: savedMessage.createdAt
        };
        
        io.to(roomId).emit('receive-message', messageData);
    } catch (err) {
        console.error("❌ Error saving message:", err);
    }
});

    socket.on('ready-for-call', ({ roomId, userName }) => {
        console.log(`📡 [PeerJS Signal] ${userName} is ready for call in room ${roomId}`);
        socket.to(roomId).emit('peer-ready-to-receive', { targetPeerName: userName });
    });

    socket.on('end-call-signal', ({ roomId }) => {
        socket.to(roomId).emit('call-terminated-by-peer');
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

httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});