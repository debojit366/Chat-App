import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// @desc    Register a new user
// @route   POST /api/v1/auth/register
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // 1. Validation - Sabse pehle check karo fields khali toh nahi
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Bhai, saari fields bharna zaroori hai!" });
    }

    // 2. Check if user already exists (Email ya Username se)
    const userExists = await User.findOne({ 
        $or: [{ email }, { username }] 
    });

    if (userExists) {
        return res.status(400).json({ message: "Bhai, ye user toh pehle se hi exist karta hai!" });
    }

    // 3. Password Hashing (Security)
    // 10 rounds of salt is the industry standard
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User in Database
    const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
    });

    if (user) {
        // 5. Response - Password ko delete karke bhej rahe hain
        const createdUser = await User.findById(user._id).select("-password");

        res.status(201).json({
            success: true,
            data: createdUser,
            message: "User created successfully! 🎉"
        });
    } else {
        res.status(400).json({ message: "Invalid user data" });
    }
});