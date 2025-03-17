export interface User {
  id: string;
  username: string;
  createdAt: Date;
  lastSeen: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    quality?: 'auto' | '720p' | '1080p';
    volume?: number;
  };
}

export interface UserSession {
  userId: string;
  token: string;
  expiresAt: Date;
  deviceType: 'web' | 'mobile' | 'tv';
}
