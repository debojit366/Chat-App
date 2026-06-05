import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true }
}, { timestamps: true });

// ❌ Agar wahan aisa likha hai: export { Message } ya export const Message = ...
//  Toh use hatao aur niche ye default export add karo:
const Message = mongoose.model('Message', MessageSchema);
export default Message;