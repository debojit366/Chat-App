import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for all origins during development
app.use(cors({ origin: "*" })); 
app.use(express.json());

// API Health Check Endpoint
app.get('/', (req, res) => {
    res.send({ message: "Server is up and running!" });
});

// Create an HTTP server instance using the Express application
const httpServer = createServer(app);

// Initialize Socket.io instance with CORS configuration
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Will be restricted to specific frontend URLs in production
        methods: ["GET", "POST"]
    }
});

// Main WebSocket connection event handler
io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // Event: Triggered when a user joins a specific room
    socket.on('join-room', ({ roomId, userName }) => {
        // Add the current socket/user to the specified room channel
        socket.join(roomId);
        console.log(`👤 ${userName} (${socket.id}) joined room: ${roomId}`);
        
        // Broadcast a notification to all other users in the room except the sender
        socket.to(roomId).emit('user-connected', { userName, socketId: socket.id });
    });

    // Event: Triggered when a user sends a text message inside a room
    socket.on('send-message', ({ roomId, message, sender }) => {
        // Structure the message payload with a unique ID and current timestamp
        const messageData = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            text: message,
            sender: sender,
            timestamp: new Date()
        };
        
        // Broadcast the message payload to everyone in the room (including the sender)
        io.to(roomId).emit('receive-message', messageData);
    });

    // Event: Triggered right before a socket disconnects (useful to capture current rooms)
    socket.on('disconnecting', () => {
        // Fetch all active rooms that this socket belongs to
        const rooms = Object.keys(socket.rooms);
        
        // Notify other members in those rooms that this user is disconnecting
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.to(room).emit('user-disconnected', { socketId: socket.id });
            }
        });
    });

    // Event: Triggered when a user completely disconnects from the server
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Start the HTTP and WebSocket server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});