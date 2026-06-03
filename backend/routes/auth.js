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

export default router;