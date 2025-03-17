import { RoomStates, RoomUser } from '../types/room';

class RoomStateManager {
  private roomStates: RoomStates = {};

  initRoom(roomId: string) {
    if (!this.roomStates[roomId]) {
      this.roomStates[roomId] = {
        videoIsPlaying: false,
        timestamp: 0,
        users: [],
        allUsersReady: false,
      };
    }
    return this.roomStates[roomId];
  }

  addUser(roomId: string, user: RoomUser) {
    const room = this.initRoom(roomId);
    if (!room.users.some((u) => u.id === user.id)) {
      room.users.push({ ...user, ready: false });
    }
    return room;
  }

  removeUser(socketId: string) {
    const updates: { roomId: string; users: RoomUser[] }[] = [];

    for (const roomId in this.roomStates) {
      const userIndex = this.roomStates[roomId].users.findIndex(
        (user) => user.id === socketId
      );

      if (userIndex !== -1) {
        this.roomStates[roomId].users.splice(userIndex, 1);
        this.updateAllUsersReadyState(roomId);
        updates.push({
          roomId,
          users: this.roomStates[roomId].users,
        });

        if (this.roomStates[roomId].users.length === 0) {
          delete this.roomStates[roomId];
        }
      }
    }

    return updates;
  }

  updatePlayState(roomId: string, isPlaying: boolean, timestamp: number) {
    const room = this.roomStates[roomId];
    if (room) {
      room.videoIsPlaying = isPlaying;
      room.timestamp = timestamp;
    }
    return room;
  }

  updateTimestamp(roomId: string, timestamp: number) {
    const room = this.roomStates[roomId];
    if (room) {
      room.timestamp = timestamp;
    }
    return room;
  }

  setUserReady(roomId: string, socketId: string, ready: boolean) {
    const room = this.roomStates[roomId];
    if (!room) return null;

    const user = room.users.find((u) => u.id === socketId);
    if (user) {
      user.ready = ready;
      this.updateAllUsersReadyState(roomId);
    }

    return room;
  }

  private updateAllUsersReadyState(roomId: string) {
    const room = this.roomStates[roomId];
    if (!room) return;

    room.allUsersReady =
      room.users.length > 0 && room.users.every((u) => u.ready);
  }

  getRoom(roomId: string) {
    return this.roomStates[roomId];
  }
}

export const roomStateManager = new RoomStateManager();
