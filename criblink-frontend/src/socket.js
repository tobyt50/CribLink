import { io } from 'socket.io-client';

// Adjust this URL depending on your backend setup
const SOCKET_URL = 'http://localhost:5000'; // Or your production URL

// Connect once and export
const socket = io(SOCKET_URL, {
  autoConnect: false, // Optional: delay connection until auth ready
  transports: ['websocket'], // Optional: skip long polling fallback
});

export default socket;
