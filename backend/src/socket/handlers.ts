import { Server, Socket } from 'socket.io';
import { roomStateManager } from './state';
import {
  SyncEvent,
  TimeEvent,
  ReadyEvent,
  RoleRequestEvent,
  RoleUpdateEvent,
} from '../types/room';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

      const room = roomStateManager.addUser(roomId, {
        id: socket.id,
        username,
      });

      // Send initial sync to the joining user
      socket.emit('sync', {
        videoIsPlaying: room.videoIsPlaying,
        timestamp: room.timestamp,
        username: 'system',
        isInitialSync: true,
      });

      // Update all users about the new user list
      io.to(roomId).emit('updateUsers', {
        users: room.users,
        allUsersReady: room.allUsersReady,
      });
    });

    socket.on(
      'requestRole',
      ({ username, requestedRole }: RoleRequestEvent) => {
        const roomId = Array.from(socket.rooms)[1];
        if (!roomId) return;

        const room = roomStateManager.getRoom(roomId);
        if (!room) return;

        // For now, automatically approve role changes
        // In the future, this could be handled by room owner/participants
        const updatedRoom = roomStateManager.updateUserRole(
          roomId,
          socket.id,
          requestedRole
        );
        if (!updatedRoom) return;

        // Notify the user of their role update
        socket.emit('roleUpdate', {
          userId: socket.id,
          username,
          role: requestedRole,
        });

        // Update all users about the new user list
        io.to(roomId).emit('updateUsers', {
          users: updatedRoom.users,
          allUsersReady: updatedRoom.allUsersReady,
        });
      }
    );

    socket.on('ready', ({ username, ready }: ReadyEvent) => {
      const roomId = Array.from(socket.rooms)[1];
      if (!roomId) return;

      const room = roomStateManager.setUserReady(roomId, socket.id, ready);
      if (!room) return;

      // Update all users about the new ready state
      io.to(roomId).emit('updateUsers', {
        users: room.users,
        allUsersReady: room.allUsersReady,
      });
    });

    socket.on('play', ({ time, username }: TimeEvent) => {
      const roomId = Array.from(socket.rooms)[1];
      if (!roomId) return;

      const room = roomStateManager.getRoom(roomId);
      if (!room) return;

      // Only allow participants to control playback
      const user = room.users.find((u) => u.id === socket.id);
      if (!user || user.role !== 'participant') return;

      roomStateManager.updatePlayState(roomId, true, time);

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

    socket.on('pause', ({ time, username }: TimeEvent) => {
      const roomId = Array.from(socket.rooms)[1];
      if (!roomId) return;

      const room = roomStateManager.getRoom(roomId);
      if (!room) return;

      // Only allow participants to control playback
      const user = room.users.find((u) => u.id === socket.id);
      if (!user || user.role !== 'participant') return;

      roomStateManager.updatePlayState(roomId, false, time);

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

    socket.on('seek', ({ time, username }: TimeEvent) => {
      const roomId = Array.from(socket.rooms)[1];
      if (!roomId) return;

      const room = roomStateManager.getRoom(roomId);
      if (!room) return;

      // Only allow participants to control playback
      const user = room.users.find((u) => u.id === socket.id);
      if (!user || user.role !== 'participant') return;

      roomStateManager.updateTimestamp(roomId, time);

      // Send to other clients
      socket.to(roomId).emit('sync', {
        videoIsPlaying: room.videoIsPlaying,
        timestamp: time,
        username,
        isInitialSync: false,
      });

      // Send confirmation back to sender
      socket.emit('syncConfirm', {
        videoIsPlaying: room.videoIsPlaying,
        timestamp: time,
        username,
        isInitialSync: false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const updates = roomStateManager.removeUser(socket.id);

      // Notify remaining users in affected rooms
      updates.forEach(({ roomId, users }) => {
        const room = roomStateManager.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('updateUsers', {
            users: room.users,
            allUsersReady: room.allUsersReady,
          });
        }
      });
    });
  });
}
