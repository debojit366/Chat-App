import Message from "../models/Message.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Send a new message
// @route   POST /api/v1/messages
export const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return res.status(400).json({ message: "Invalid data passed into request" });
    }

    // 1. Create a new message object
    var newMessage = {
        sender: req.user._id, // This comes from auth middleware
        content: content,
        chat: chatId,
    };

    try {
        // 2. Save message to database
        let message = await Message.create(newMessage);

        // 3. Populate sender's name and profile pic (needed for frontend UI)
        message = await message.populate("sender", "username profilePic");
        
        // 4. Populate the chat details
        message = await message.populate("chat");

        // 5. Populate users inside the chat (for real-time signaling)
        message = await User.populate(message, {
            path: "chat.users",
            select: "username profilePic email",
        });

        // 6. Update the 'latestMessage' in Conversation/Chat model (Optional but pro)
        // await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all messages for a specific chat
// @route   GET /api/v1/messages/:chatId
export const allMessages = asyncHandler(async (req, res) => {
    try {
        // Fetching messages for the specific chat with pagination (Industry practice)
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "username profilePic email")
            .populate("chat")
            .sort({ createdAt: 1 }); // Sorted in ascending order for chat flow

        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});