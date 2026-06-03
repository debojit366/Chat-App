import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true // Indexing se search aur loading super fast ho jayegi
    },
    sender: {
        type: String, // Tum chaho toh ObjectId (ref: 'User') bhi de sakte ho, par username abhi chalega
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true }); // Isse createdAt aur updatedAt (timestamps) automatically mil jayenge

export default mongoose.model('Message', messageSchema);