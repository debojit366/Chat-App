import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';

const router = express.Router();

// 1. GLOBAL SEARCH USERS: Search for anyone in the entire database
router.get('/search', async (req, res) => {
    try {
        const { q, userId } = req.query;
        if (!q) return res.json([]);

        const searchRegex = new RegExp(q, 'i');
        
        // Find all users except the current user whose username matches the query
        const users = await User.find({
            _id: { $ne: userId },
            username: searchRegex
        }).select('username email status');

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Search failed" });
    }
});

// 2. ADD FRIEND ROUTE: Send a friend request
router.post('/send-request', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Request already pending or you are already friends!" });
        }

        const newRequest = new FriendRequest({ sender: senderId, receiver: receiverId });
        await newRequest.save();

        res.status(200).json({ message: "Friend request sent! 🚀" });
    } catch (err) {
        res.status(500).json({ message: "Failed to send request" });
    }
});

// 3. GET FRIENDS LIST
router.get('/friends/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('friends', 'username status');
        res.json(user ? user.friends : []);
    } catch (err) {
        res.status(500).json({ message: "Could not fetch friends" });
    }
});


router.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Fetch only requests that are 'pending' where the current user is the receiver
        const requests = await FriendRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'username email'); // Attach sender details

        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "Failed to load notifications" });
    }
});



router.post('/respond-request', async (req, res) => {
    try {
        const { requestId, status } = req.body; // status can be 'accepted' or 'rejected'

        const request = await FriendRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Permanently add both users to each other's friends list
            await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
            await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });
        }

        res.status(200).json({ message: `Request ${status} successfully!` });
    } catch (err) {
        res.status(500).json({ message: "Action failed" });
    }
});



export default router;