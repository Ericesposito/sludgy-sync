export interface RoomUser {
  id: string;
  username: string;
  ready: boolean;
}

export interface RoomState {
  videoIsPlaying: boolean;
  timestamp: number;
  users: RoomUser[];
  allUsersReady: boolean;
}

export interface RoomStates {
  [key: string]: RoomState;
}

export interface SyncEvent {
  videoIsPlaying: boolean;
  timestamp: number;
  username: string;
  isInitialSync?: boolean;
}

export interface TimeEvent {
  time: number;
  username: string;
}

export interface ReadyEvent {
  username: string;
  ready: boolean;
}
