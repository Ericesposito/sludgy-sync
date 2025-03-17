export interface GuestAuthRequest {
  username: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: Date;
  lastSeen: Date;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  deviceType: 'web';
}

export interface AuthResponse {
  user: User;
  session: Session;
}
