import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.8.100:5000'; // Must match your API_URL

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually after login
  transports: ['websocket'],
});