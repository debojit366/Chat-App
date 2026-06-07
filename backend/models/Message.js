import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true }
}, { timestamps: true });

// Ensure to use default export instead of named exports for this model
const Message = mongoose.model('Message', MessageSchema);
export default Message;