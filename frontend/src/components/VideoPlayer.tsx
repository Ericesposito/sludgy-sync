'use client';
import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import HLSPlayer from './video/HLSPlayer';
import SyncController from './video/SyncController';
import UsernameModal from './UsernameModal';
import ReadyOverlay from './video/ReadyOverlay';
import { useUser } from '@/contexts/UserContext';

export default function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const { user } = useUser();

  const { handlePlay, handlePause, handleSeek } = SyncController({
    roomId: roomId as string,
    videoRef,
    userInteracted,
  });

  const handleUserReady = () => {
    setUserInteracted(true);
  };

  return (
    <>
      <UsernameModal />
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {user && <HLSPlayer videoUrl={videoUrl} videoRef={videoRef} />}
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeek}
        />
        {!userInteracted && user && (
          <ReadyOverlay onAllUsersReady={handleUserReady} />
        )}
      </div>
    </>
  );
}
