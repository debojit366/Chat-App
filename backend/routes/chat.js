import express from 'express';
import Room from '../models/Room.js';
import  Message  from '../models/Message.js';
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
                lastMessage: 'Chat started! Say hi 👋',
                lastMessageTime: Date.now() // Initial setup logic time lock
            });
            await room.save();
        }

        res.status(200).json(room);
    } catch (err) {
        console.error("❌ Private room initialization error:", err);
        res.status(500).json({ message: "Error initializing private chat room" });
    }
});


// ====================================================================
// 🔥 NYA CODE: IN DONO ENDPOINTS KO ABHI ADD KARO TAKI 404 ERROR KHATAM HO JAYE
// ====================================================================

// 3. GET ALL MESSAGES FOR A SPECIFIC ROOM (Frontend isi ko dhoondh raha hai)
// Path will map to: /api/chats/messages/:chatRoomId
router.get('/messages/:chatRoomId', async (req, res) => {
    try {
        const { chatRoomId } = req.params;

        // Database se is room ke saare messages ascending order (time order) me nikaalo
        const messages = await Message.find({ chatRoomId })
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        console.error("❌ Error fetching messages from DB:", err);
        res.status(500).json({ message: "Could not load message logs" });
    }
});

// 4. POST A NEW MESSAGE TO DATABASE
// Path will map to: /api/chats/send-message
router.post('/send-message', async (req, res) => {
    try {
        const { chatRoomId, senderId, text } = req.body;

        if (!chatRoomId || !senderId || !text) {
            return res.status(400).json({ message: "Bhai, fields missing hain!" });
        }

        // Naye message ko document format me save karo
        const newMessage = new Message({
            chatRoomId,
            senderId,
            text
        });
        const savedMessage = await newMessage.save();

        // Room model ka status update karo takki dynamic "Rooms & Chats" tab top par scroll ho sake
        await Room.findByIdAndUpdate(chatRoomId, {
            lastMessage: text,
            lastMessageTime: Date.now()
        });

        res.status(201).json(savedMessage);
    } catch (err) {
        console.error("❌ Error saving new message:", err);
        res.status(500).json({ message: "Could not deliver message" });
    }
});

export default router;