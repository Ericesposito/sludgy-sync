'use client';
import { useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import HLSPlayer from './video/HLSPlayer';
import SyncController from './video/SyncController';
import UsernameModal from './UsernameModal';
import ReadyOverlay from './video/ReadyOverlay';
import SpectatorOverlay from './video/SpectatorOverlay';
import socket from '@/utils/socket';
import { useUser } from '@/contexts/UserContext';

interface UserState {
  role?: 'spectator' | 'participant';
  ready: boolean;
}

export default function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [userState, setUserState] = useState<UserState>({ ready: false });
  const { user } = useUser();

  useEffect(() => {
    interface UpdatedUser {
      id: string;
      username: string;
      role: 'spectator' | 'participant';
      ready: boolean;
    }

    const handleUpdateUsers = ({ users }: { users: UpdatedUser[] }) => {
      const currentUser = users.find((u) => u.id === socket.id);
      if (currentUser) {
        setUserState({
          role: currentUser.role,
          ready: currentUser.ready,
        });
      }
    };

    socket.on('updateUsers', handleUpdateUsers);

    return () => {
      socket.off('updateUsers', handleUpdateUsers);
    };
  }, []);

  const { handlePlay, handlePause, handleSeek } = SyncController({
    roomId: roomId as string,
    videoRef,
    userInteracted,
  });

  const handleUserReady = () => {
    setUserInteracted(true);
  };

  const handleBecomeParticipant = () => {
    setUserState((prev) => ({ ...prev, role: 'participant' }));
  };

  return (
    <>
      <UsernameModal />
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {user && <HLSPlayer videoUrl={videoUrl} videoRef={videoRef} />}
        <video
          ref={videoRef}
          controls={userState.role !== 'spectator'}
          className="w-full h-full"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeek}
        />
        {!userInteracted && userState.role === 'participant' && user && (
          <ReadyOverlay onAllUsersReady={handleUserReady} />
        )}
        {userState.role === 'spectator' && user && (
          <SpectatorOverlay onBecomeParticipant={handleBecomeParticipant} />
        )}
      </div>
    </>
  );
}
