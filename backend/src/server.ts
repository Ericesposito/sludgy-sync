import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { socketCorsOptions } from './config/cors';
import { setupSocketHandlers } from './socket/handlers';

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: socketCorsOptions,
});

// Set up socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 1247;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
