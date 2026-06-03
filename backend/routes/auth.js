import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// Route 1: Register a new user
router.post('/register', async (req, res, next) => {
    console.log("➡️ [Auth Router] Inside register route handler...");
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            console.log("⚠️ [Auth Router] Missing required fields");
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log("🔍 [Auth Router] Checking if user exists in DB...");
        // This is where Mongoose queries the DB
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        console.log("📊 [Auth Router] User existence check done. Exists?", !!userExists);
        
        if (userExists) {
            return res.status(400).json({ message: 'Username or Email already registered' });
        }

        console.log("💾 [Auth Router] Creating new user in DB (Hashing password via hook)...");
        const user = await User.create({ username, email, password });
        console.log("✅ [Auth Router] User created successfully inside DB!");
        
        const token = generateToken(user._id);

        return res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error("❌ [Auth Router] CRASHED INSIDE CATCH BLOCK:", error);
        // Pass the error to the global error handler in server.js
        next(error); 
    }
});

// Route 2: Login existing user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            token: generateToken(user._id),
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (error) {
        next(error);
    }
});

// Route 3: Dynamic Search Route for Friends and Rooms
router.get('/search', async (req, res, next) => {
    try {
        
        const { type, q, userId } = req.query;

        if (!q) {
            return res.status(200).json([]);
        }

        const searchRegex = new RegExp(q, 'i');

        // CASE 1: Users/Friends Search
        if (type === 'users') {
            console.log(`🔍 [Search Route] Searching for users matching: ${q}`);
            
            const users = await User.find({
                _id: { $ne: userId },
                username: searchRegex
            }).select('username email');

            return res.status(200).json(users);
        }

        // CASE 2: Rooms Search
        if (type === 'rooms') {
            console.log(`🔍 [Search Route] Searching rooms for user ${userId} matching: ${q}`);
            
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            const matchedRooms = user.joinedRooms.filter(roomName => 
                roomName.toLowerCase().includes(q.toLowerCase())
            );

            return res.status(200).json(matchedRooms);
        }

        return res.status(400).json({ message: "Invalid search type" });

    } catch (error) {
        console.error("❌ [Search Route] Error inside search endpoint:", error);
        next(error);
    }
});


// Route 4: Get Current User's Friends List from Database
router.get('/friends/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        const userWithFriends = await User.findById(userId)
            .populate('friends', 'username status email');

        if (!userWithFriends) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`👥 [Friends Route] Fetched ${userWithFriends.friends.length} friends for user: ${userWithFriends.username}`);
        
        res.status(200).json(userWithFriends.friends);
    } catch (error) {
        console.error("❌ [Friends Route] Error fetching friends:", error);
        next(error);
    }
});


export default router;