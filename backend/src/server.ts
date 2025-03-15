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

let videoState = { isPlaying: false, timestamp: 0 };

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Sync new users to the current video state
  socket.emit('sync', videoState);

  socket.on('play', (time) => {
    videoState = { isPlaying: true, timestamp: time };
    io.emit('play', time);
  });

  socket.on('pause', (time) => {
    videoState = { isPlaying: false, timestamp: time };
    io.emit('pause', time);
  });

  socket.on('seek', (time) => {
    videoState.timestamp = time;
    io.emit('seek', time);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 1247;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
