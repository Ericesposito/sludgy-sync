import express, { Request, Response, RequestHandler } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Add JSON body parsing
app.use(express.json());

// Configure CORS for both API and Socket.IO
const allowedOrigins = ['http://localhost:4500', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

const roomStates: {
  [key: string]: {
    videoIsPlaying: boolean;
    timestamp: number;
    users: { id: string; username: string }[];
  };
} = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

    if (!roomStates[roomId]) {
      roomStates[roomId] = { videoIsPlaying: false, timestamp: 0, users: [] };
    }

    const user = { id: socket.id, username };
    if (!roomStates[roomId].users.some((u) => u.id === socket.id)) {
      roomStates[roomId].users.push(user);
    }

    // Send initial sync to the joining user
    socket.emit('sync', {
      videoIsPlaying: roomStates[roomId].videoIsPlaying,
      timestamp: roomStates[roomId].timestamp,
      username: 'system',
      isInitialSync: true,
    });

    // Update all users about the new user list
    io.to(roomId).emit('updateUsers', roomStates[roomId].users);
  });

  socket.on('play', ({ time, username }) => {
    const roomId = Array.from(socket.rooms)[1];
    if (!roomId) return;

    roomStates[roomId].videoIsPlaying = true;
    roomStates[roomId].timestamp = time;

    // Send to other clients
    socket.to(roomId).emit('sync', {
      videoIsPlaying: true,
      timestamp: time,
      username,
      isInitialSync: false,
    });

    // Send confirmation back to sender
    socket.emit('syncConfirm', {
      videoIsPlaying: true,
      timestamp: time,
      username,
      isInitialSync: false,
    });
  });

  socket.on('pause', ({ time, username }) => {
    const roomId = Array.from(socket.rooms)[1];
    if (!roomId) return;

    roomStates[roomId].videoIsPlaying = false;
    roomStates[roomId].timestamp = time;

    // Send to other clients
    socket.to(roomId).emit('sync', {
      videoIsPlaying: false,
      timestamp: time,
      username,
      isInitialSync: false,
    });

    // Send confirmation back to sender
    socket.emit('syncConfirm', {
      videoIsPlaying: false,
      timestamp: time,
      username,
      isInitialSync: false,
    });
  });

  socket.on('seek', ({ time, username }) => {
    const roomId = Array.from(socket.rooms)[1];
    if (!roomId) return;

    roomStates[roomId].timestamp = time;

    // Send to other clients
    socket.to(roomId).emit('sync', {
      videoIsPlaying: roomStates[roomId].videoIsPlaying,
      timestamp: time,
      username,
      isInitialSync: false,
    });

    // Send confirmation back to sender
    socket.emit('syncConfirm', {
      videoIsPlaying: roomStates[roomId].videoIsPlaying,
      timestamp: time,
      username,
      isInitialSync: false,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomId in roomStates) {
      const userIndex = roomStates[roomId].users.findIndex(
        (user) => user.id === socket.id
      );

      if (userIndex !== -1) {
        roomStates[roomId].users.splice(userIndex, 1);
        io.to(roomId).emit('updateUsers', roomStates[roomId].users);

        if (roomStates[roomId].users.length === 0) {
          delete roomStates[roomId];
        }
      }
    }
  });
});

// Add API routes with proper types
interface GuestAuthRequest {
  username: string;
}

const handleGuestAuth: RequestHandler = async (req, res) => {
  try {
    const { username } = req.body as GuestAuthRequest;
    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    // Create a simple guest session
    const user = {
      id: `guest_${Math.random().toString(36).substring(2)}`,
      username,
      createdAt: new Date(),
      lastSeen: new Date(),
    };

    const session = {
      userId: user.id,
      token: Math.random().toString(36).substring(2),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      deviceType: 'web' as const,
    };

    res.json({ user, session });
  } catch (error) {
    console.error('Guest auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/api/auth/guest', handleGuestAuth);

const PORT = process.env.PORT || 1247;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
