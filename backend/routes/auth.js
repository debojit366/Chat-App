import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import OtpVerification from '../models/OtpVerification.js'
import nodemailer from 'nodemailer';
import axios from 'axios'
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();

// Helper to generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};


// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_SERVER,
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_LOGIN_ID,
//     pass: process.env.SMTP_KEY
//   },
//   connectionTimeout: 5000,
//   greetingTimeout: 5000
// });


const sendBrevoEmail = async (email, username, otp, subject) => {
    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "MERN Chat App", email: process.env.EMAIL_USER },
            to: [{ email: email }],
            subject: subject,
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 12px 20px; font-size: 22px; font-weight: bold; border-radius: 12px; letter-spacing: 0.5px;">
                            💬 MERN Chat App
                        </div>
                    </div>

                    <div style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                        <p style="font-size: 18px; margin-top: 0; color: #1e293b;">Hello <strong>${username || 'User'}</strong>,</p>
                        <p>Thank you for choosing MERN Chat App. To complete your verification process, please use the secure One-Time Password (OTP) below:</p>
                    </div>

                    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; margin: 30px 0; border-radius: 12px;">
                        ${otp}
                    </div>

                    <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                        <p style="color: #713f12; font-size: 13px; margin: 0;">
                            ⚠️ <strong>Important Security Note:</strong> This verification code is valid for <strong>10 minutes</strong>. Please do not share this code or screen with anyone for security purposes.
                        </p>
                    </div>

                    <p style="color: #64748b; font-size: 14px; margin-bottom: 25px;">If you did not initiate this request, you can safely disregard this email.</p>

                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0; line-height: 1.4;">
                        This is an automated operational email from MERN Chat App. <br/>
                        © 2026 MERN Chat App Inc. All rights reserved.
                    </p>
                </div>
            `
        }, {
            headers: {
                'api-key': process.env.BREVO_API_KEY, 
                'content-type': 'application/json'
            }
        });
        return true;
    } catch (error) {
        console.error("❌ Brevo API Error:", error.response?.data || error.message);
        throw new Error("Email sending failed");
    }
};




// server.js ya jahan mail bhejne ka logic hai, wahan ye check karo
console.log("Checking Email Config:", process.env.EMAIL_USER ? "Loaded ✅" : "Missing ❌");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("CRITICAL: Email credentials are not set in environment!");
}



const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Route 1: Register a new user
router.post('/register/request', async (req, res) => {
    const { username, email } = req.body;
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: "Email already registered!" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OtpVerification.deleteMany({ email: email.toLowerCase() });
        await new OtpVerification({ email: email.toLowerCase(), otp, purpose: 'email_verification' }).save();

        await sendBrevoEmail(email, username, otp, '🚀 Verify Your Account');
        
        res.status(200).json({ message: "OTP sent successfully! 📩" });
    } catch (err) {
        res.status(500).json({ message: "Failed to send email." });
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
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: "User not found!" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OtpVerification.deleteMany({ email: email.toLowerCase() });
        await new OtpVerification({ email: email.toLowerCase(), otp, purpose: 'forgot_password' }).save();

        await sendBrevoEmail(email, user.username, otp, '🔐 Password Reset Code');

        res.status(200).json({ message: "OTP sent to your email!" });
    } catch (err) {
        res.status(500).json({ message: "Email delivery failed." });
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