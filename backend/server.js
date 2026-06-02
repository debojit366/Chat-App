import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js'; // Import auth routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" })); 
app.use(express.json());

// Bind Authentication API Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send({ message: "Server is up and running!" });
});

// MongoDB Connection Setup
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📁 MongoDB Database Connected Successfully'))
    .catch((err) => console.error('❌ Database Connection Error:', err));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ... (Baaki bacha hua socket.io code waisa hi rahega jo step 1 me tha)

httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});