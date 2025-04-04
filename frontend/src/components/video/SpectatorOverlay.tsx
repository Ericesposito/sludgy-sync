'use client';
import { useEffect, useState } from 'react';
import socket from '@/utils/socket';
import { useUser } from '@/contexts/UserContext';

interface SpectatorOverlayProps {
  onBecomeParticipant: () => void;
}

export default function SpectatorOverlay({
  onBecomeParticipant,
}: SpectatorOverlayProps) {
  const { user } = useUser();
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const handleRoleUpdate = ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) => {
      if (user && userId === socket.id && role === 'participant') {
        onBecomeParticipant();
      }
    };

    socket.on('roleUpdate', handleRoleUpdate);

    return () => {
      socket.off('roleUpdate', handleRoleUpdate);
    };
  }, [user, onBecomeParticipant]);

  const handleRequestParticipation = () => {
    if (!user) return;
    setIsRequesting(true);
    socket.emit('requestRole', {
      username: user.username,
      requestedRole: 'participant',
    });
  };

  if (!user) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Video in Progress</h2>
        <p className="mb-6">
          You&apos;ve joined as a spectator. You can watch but cannot control
          playback.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleRequestParticipation}
            disabled={isRequesting}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
              isRequesting
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRequesting
              ? 'Requesting to participate...'
              : 'Request to Participate'}
          </button>
          <p className="text-sm text-gray-400">
            {isRequesting
              ? 'Your request is being processed...'
              : 'Click to request full participation rights'}
          </p>
        </div>
      </div>
    </div>
  );
}
