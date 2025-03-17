'use client';
import { useEffect, useState } from 'react';
import socket from '@/utils/socket';
import { useUser } from '@/contexts/UserContext';

interface ReadyOverlayProps {
  onAllUsersReady: () => void;
}

export default function ReadyOverlay({ onAllUsersReady }: ReadyOverlayProps) {
  const { user } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleAllUsersReady = ({
      allUsersReady,
    }: {
      allUsersReady: boolean;
    }) => {
      if (allUsersReady) {
        onAllUsersReady();
      }
    };

    socket.on('updateUsers', handleAllUsersReady);

    return () => {
      socket.off('updateUsers', handleAllUsersReady);
    };
  }, [onAllUsersReady]);

  const handleReadyClick = () => {
    if (!user) return;
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit('ready', { username: user.username, ready: newReadyState });
  };

  if (!user) return null;

  const readyText = isReady ? (
    <>Actually... I{"'"}m not ready</>
  ) : (
    <>I&#39;m Ready</>
  );

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Watch?</h2>
        <p className="mb-6">
          Click the button when you&#39;re ready to start watching together.
        </p>
        <button
          onClick={handleReadyClick}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isReady
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {readyText}
        </button>
      </div>
    </div>
  );
}
