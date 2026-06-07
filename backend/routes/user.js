import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { cloudinary } from '../config/cloudinary.js';
import { upload } from '../middleware/multer.js'; // Import upload middleware
import DatauriParser from 'datauri/parser.js';
import path from 'path';
import fs from 'fs'; 
const parser = new DatauriParser();
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

// 🚀 PROFILE PICTURE UPLOAD ROUTE WITH FIXED PARSING LOGIC
router.post('/upload-profile-pic/:userId', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded!" });

        const filePath = req.file.path; 

        const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
    folder: 'chat_app_profiles',
    upload_preset: 'first_time_using_cloudinary',
    unsigned: true,
        resource_type: 'image',
});

        // IMPORTANT: Delete the local file after uploading to Cloudinary to save server space
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("❌ error while deleting file", err);
            else console.log("✅ Local file deleted successfully!");
        }); 

        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json({ profilePic: updatedUser.profilePic });
    } catch (err) {
        console.error("❌ Backend Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;