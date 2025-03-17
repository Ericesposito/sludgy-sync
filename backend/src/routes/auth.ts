import { Router, Request, Response } from 'express';
import { GuestAuthRequest } from '../types/auth';

const router = Router();

const handleGuestAuth = async (req: Request, res: Response) => {
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

router.post('/guest', handleGuestAuth);

export default router;
