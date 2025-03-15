import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const roomStates: {
  [key: string]: { videoIsPlaying: boolean; timestamp: number };
} = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    if (!roomStates[roomId]) {
      roomStates[roomId] = { videoIsPlaying: false, timestamp: 0 };
    }

    io.to(roomId).emit('sync', roomStates[roomId]);
  });

  socket.on('play', (time) => {
    const roomId = Array.from(socket.rooms)[1]; // Get the room ID
    if (!roomId) return;

    roomStates[roomId] = { videoIsPlaying: true, timestamp: time };
    io.to(roomId).emit('play', time);
  });

  socket.on('pause', (time) => {
    const roomId = Array.from(socket.rooms)[1];
    if (!roomId) return;

    roomStates[roomId] = { videoIsPlaying: false, timestamp: time };
    io.to(roomId).emit('pause', time);
  });

  socket.on('seek', (time) => {
    const roomId = Array.from(socket.rooms)[1];
    if (!roomId) return;

    roomStates[roomId].timestamp = time;
    io.to(roomId).emit('seek', time);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 1247;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
