import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// 1. GLOBAL SEARCH USERS: Poore database me se kisi ko bhi dhoondo
router.get('/search', async (req, res) => {
    try {
        const { q, userId } = req.query;
        if (!q) return res.json([]);

        const searchRegex = new RegExp(q, 'i');
        
        // Apne alawa baki sabhi users ko dhoondo jiska username match kare
        const users = await User.find({
            _id: { $ne: userId },
            username: searchRegex
        }).select('username email status');

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Search failed" });
    }
});

// 2. ADD FRIEND ROUTE: Friend banane ke liye database me push karo
router.post('/add-friend', async (req, res) => {
    try {
        const { userId, friendId } = req.body;

        if (!userId || !friendId) {
            return res.status(400).json({ message: "Missing required IDs" });
        }

        // User A ki friend list me User B ko dalo
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } });
        // User B ki friend list me User A ko dalo (vice-versa)
        await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } });

        res.status(200).json({ message: "Friend added successfully! 🤝" });
    } catch (err) {
        res.status(500).json({ message: "Could not add friend" });
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

export default router;