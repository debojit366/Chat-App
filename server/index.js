import express from "express";
import http from "http";
import { initializeSocket } from "./socket.js"; // Import logic
import messageRoutes from "./routes/message.routes.js";
const app = express();
const server = http.createServer(app); // HTTP server 

// Socket initialize 
const io = initializeSocket(server);
app.set("io", io);

app.use("/api/v1/messages", messageRoutes); 
server.listen(5000, () => console.log("Server running on 5000"));