import dotenv from "dotenv/config"; // Standard import
import express from "express";
import http from "http";
import connectDB from "./db/index.js";
import { initializeSocket } from "./socket.js";
import messageRoutes from "./routes/message.routes.js";
import authRoutes from "./routes/auth.routes.js";



const app = express();
const server = http.createServer(app); 

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/auth", authRoutes);
// 3. Socket Initialize (Pass the 'server' instance)
const io = initializeSocket(server);
app.set("io", io);

// 4. Routes
app.use("/api/v1/messages", messageRoutes);

// 5. Database Connection & Server Start
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        // Industry Standard: Listen on 'server', not 'app'
        server.listen(PORT, () => {
            console.log(`🚀 Server & Socket running at port : ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
        process.exit(1);
    });