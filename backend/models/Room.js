import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    isPrivate: {
        type: Boolean,
        default: false 
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    lastMessage: {
        type: String,
        default: 'No messages yet...'
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Room', RoomSchema);