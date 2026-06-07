import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
    type: String,
    required: true,
    unique: true, // Unique constraint applied at the database level
    trim: true,
    minlength: 3
  },
    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Email validation regex pattern
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
    password: { 
        type: String, 
        required: true 
    },
    // ==========================================
    // NEW FIELDS FOR DASHBOARD SEARCH & LISTS
    // ==========================================
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
    profilePic: {
    type: String,
    default: "",
    },
    joinedRooms: [{
        type: String 
    }]
}, { timestamps: true });

// Pre-save hook: Hash password automatically before saving 
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);