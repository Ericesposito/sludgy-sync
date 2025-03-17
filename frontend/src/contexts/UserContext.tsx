'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, UserSession } from '@/types/user';

interface UserContextType {
  user: User | null;
  session: UserSession | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (
    preferences: Partial<User['preferences']>
  ) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1247';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get session from localStorage
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const parsedSession: UserSession = JSON.parse(savedSession);
          const savedUser = localStorage.getItem('userData');
          if (savedUser && new Date(parsedSession.expiresAt) > new Date()) {
            setSession(parsedSession);
            setUser(JSON.parse(savedUser));
          } else {
            // Session expired or no user data, clear it
            localStorage.removeItem('userSession');
            localStorage.removeItem('userData');
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async (username: string, password?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, just create a guest session
      // In production, this would be a real login endpoint
      const response = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const { user, session } = await response.json();
      setUser(user);
      setSession(session);
      localStorage.setItem('userSession', JSON.stringify(session));
      localStorage.setItem('userData', JSON.stringify(user));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to login'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (session) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem('userSession');
      localStorage.removeItem('userData');
      setIsLoading(false);
    }
  };

  const updatePreferences = async (
    preferences: Partial<User['preferences']>
  ) => {
    if (!user || !session) return;

    try {
      const response = await fetch(`${API_URL}/api/users/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to update preferences')
      );
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        login,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
