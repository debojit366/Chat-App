import mongoose from "mongoose";

/**
 * database connection logic
 * Always wrap in try-catch because DB connection can fail
 */
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host} ✅`);
    } catch (error) {
        console.log("MONGODB connection FAILED ❌ ", error);
        // Exit the process if connection fails
        process.exit(1);
    }
};

export default connectDB;