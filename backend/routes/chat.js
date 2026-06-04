import express from 'express';
import Room from '../models/Room.js';

const router = express.Router();

// 1. GET USER'S RECENT CHATS (ROOMS)
router.get('/my-rooms/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        
        const rooms = await Room.find({ members: userId })
            .sort({ lastMessageTime: -1 }); // Latest message

        res.status(200).json(rooms);
    } catch (err) {
        console.error("❌ Error fetching rooms:", err);
        res.status(500).json({ message: "Could not fetch recent chats" });
    }
});

// 2. CREATE OR GET PRIVATE CHAT ROOM (For 1-on-1 chats)
router.post('/private-room', async (req, res) => {
    try {
        const { userId, friendId, friendName } = req.body;

        
        let room = await Room.findOne({
            isPrivate: true,
            members: { $all: [userId, friendId] }
        });

        
        if (!room) {
            room = new Room({
                name: friendName, // Frontend display
                isPrivate: true,
                members: [userId, friendId],
                lastMessage: 'Chat started! Say hi 👋'
            });
            await room.save();
        }

        res.status(200).json(room);
    } catch (err) {
        res.status(500).json({ message: "Error initializing private chat room" });
    }
});

export default router;