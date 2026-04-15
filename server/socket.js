import { Server } from "socket.io";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: process.env.CORS_ORIGIN },
    });

    io.on("connection", (socket) => {
        console.log("A user connected: ", socket.id);
        
        // Saare event handlers yahan likho
        socket.on("join_room", (data) => {
            socket.join(data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    return io;
};