import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import authRoutes from './routes/auth.js'; 

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
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, userName }) => {
        socket.join(roomId);
        console.log(`👤 ${userName} (${socket.id}) joined room: ${roomId}`);
        socket.to(roomId).emit('user-connected', { userName, socketId: socket.id });
    });

    socket.on('send-message', ({ roomId, message, sender }) => {
        const messageData = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            text: message,
            sender: sender,
            timestamp: new Date()
        };
        io.to(roomId).emit('receive-message', messageData);
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