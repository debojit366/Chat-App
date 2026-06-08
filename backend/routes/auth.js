import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import OtpVerification from '../models/OtpVerification.js'
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();

// Helper to generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};


const transporter = nodemailer.createTransport({
    
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // TLS use karo
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Yahan 16-digit App Password hona chahiye
  },
});


// server.js ya jahan mail bhejne ka logic hai, wahan ye check karo
console.log("Checking Email Config:", process.env.EMAIL_USER ? "Loaded ✅" : "Missing ❌");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("CRITICAL: Email credentials are not set in environment!");
}



const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Route 1: Register a new user
router.post('/register/request', async (req, res) => {
    const { username, email } = req.body;
    console.log("OTP Request received for:", email);
    
    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "⚠️ Email already registered! Please log in." });
        }
        
        const existingUsername = await User.findOne({ username: username.trim() });
        if (existingUsername) {
            return res.status(400).json({ message: "⚠️ Username is already taken! Try another one." });
        }

        // Generate 6-Digit Signup OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing signup OTP
        await OtpVerification.deleteMany({ email: email.toLowerCase(), purpose: 'email_verification' });

        // Save OTP template
        const newOtpRecord = new OtpVerification({
            email: email.toLowerCase(),
            otp: otp,
            purpose: 'email_verification'
        });
        await newOtpRecord.save();

        // Email Payload
        const mailOptions = {
            from: `"MERN Chat App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🚀 Verify Your Account - Signup OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb; text-align: center;">Welcome to Chat App!</h2>
                    <p>Thank you for signing up, <strong>${username}</strong>. Please use the verification code below to activate your account:</p>
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 25px 0;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 12px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
                </div>
            `
        };

        // Send Email with Debugging
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully to:", email);
        res.status(200).json({ message: "Verification OTP sent to your email! 📩" });

    } catch (err) {
        // Detailed error logging for Production
        console.error("❌ NODEMAILER ERROR:", err.message);
        res.status(500).json({ 
            message: "Server error during registration request.", 
            error: err.message 
        });
    }
});


router.post('/register/verify', async (req, res) => {
    const { username, email, password, otp } = req.body;
    try {
        // Validate OTP document matching
        const otpRecord = await OtpVerification.findOne({
            email: email.toLowerCase(),
            otp: otp,
            purpose: 'email_verification'
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "❌ Invalid or Expired OTP. Please request a new one." });
        }

        // DOUBLE CHECK IN STEP 2: Verify if someone else claimed this username or email in the interim
        const existingUsername = await User.findOne({ username: username.trim() });
        if (existingUsername) {
            return res.status(400).json({ message: "⚠️ Username was just taken! Please go back and change it." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered during session layout." });
        }

        // Create New User
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase(),
            password 
        });
        await newUser.save();

        // Token Generation
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

        // Clean up OTP record
        await OtpVerification.deleteOne({ _id: otpRecord._id });

        res.status(201).json({
            message: "Account created successfully! 🎉",
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });

    } catch (err) {
        console.error("Signup verification error:", err);
        res.status(500).json({ message: "Account creation failed on server database." });
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



// 📩 1. REQUEST OTP ENDPOINT
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        // CHECK 1: Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "⚠️ This email is not registered with us!" });
        }

        // STEP 2: Generate 6-Digit Secure OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // STEP 3: Clear older tokens
        await OtpVerification.deleteMany({ email: email.toLowerCase(), purpose: 'forgot_password' });

        // STEP 4: Save record to OtpVerification collection
        const newOtpRecord = new OtpVerification({
            email: email.toLowerCase(),
            otp: otp,
            purpose: 'forgot_password'
        });
        await newOtpRecord.save();

        // 🔥 STEP 5: Send ACTUAL OTP via Gmail
        const mailOptions = {
    from: `"MERN Chat App Support" <${process.env.EMAIL_USER}>`, // Dynamically reads your email
    to: user.email, 
    subject: '🔐 Password Reset Verification Code', 
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #2563eb; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">We received a request to reset the password for your account. Please use the secure Verification Code (OTP) below to proceed:</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 25px 0; border-radius: 8px;">
                ${otp}
            </div>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This OTP is strictly valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This is an automated email, please do not reply to this address.</p>
        </div>
    ` 
};

        // Mail send execute pipeline
        await transporter.sendMail(mailOptions);
        console.log(`📨 Real Email dispatched to: ${email} | Dev Token: ${otp}`);

        res.status(200).json({ message: "Verification OTP sent to your email! 📩" });

    } catch (err) {
        console.error("Forgot password email error:", err);
        res.status(500).json({ message: "Server error or Email delivery failed. Please try again." });
    }
});

// 🔑 2. VERIFY OTP & RESET PASSWORD ENDPOINT
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        // STEP 1: Check for a live record in the OTP collection (MongoDB TTL handles expiry)
        const otpRecord = await OtpVerification.findOne({
            email: email.toLowerCase(),
            otp: otp,
            purpose: 'forgot_password'
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "❌ Invalid or Expired OTP. Please request a new one." });
        }

        // STEP 2: Locate user and update their password
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "User no longer exists." });
        }

        // Assign directly if bcrypt pre-save hook is active in the model, otherwise hash manually
        user.password = newPassword; 
        await user.save();

        // STEP 3: Cleanup: Manually delete the OTP record from the database to prevent reuse
        await OtpVerification.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ message: "Password updated successfully! 🎉 Proceed to Login." });

    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error during password reset." });
    }
});

export default router;