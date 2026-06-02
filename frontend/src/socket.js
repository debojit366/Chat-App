import { io } from 'socket.io-client';

// Connect to the backend server URL (Change this in production)
const SOCKET_URL = 'http://localhost:5000';

// Initialize the socket instance with auto-connect disabled 
// We will manually connect when the user enters their username and room ID
export const socket = io(SOCKET_URL, {
    autoConnect: false
});