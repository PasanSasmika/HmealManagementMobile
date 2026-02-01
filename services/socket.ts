import { io } from 'socket.io-client';

const SOCKET_URL = 'https://travis-kelkoo-rules-spare.trycloudflare.com'; // Must match your API_URL

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually after login
  transports: ['websocket'],
});