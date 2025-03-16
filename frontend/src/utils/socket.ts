import { io } from 'socket.io-client';

const socket = io('http://localhost:1247', {
  transports: ['websocket'],
  autoConnect: false,
});

export function joinRoom(roomId: string) {
  socket.emit('joinRoom', roomId);
}

export default socket;
