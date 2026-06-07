import mongoose from 'mongoose';

const OtpVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['forgot_password', 'email_verification'],
        default: 'forgot_password'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 10 minutes auto-delete TTL configuration
    }
});

// ES Module Export
const OtpVerification = mongoose.model('OtpVerification', OtpVerificationSchema);
export default OtpVerification;