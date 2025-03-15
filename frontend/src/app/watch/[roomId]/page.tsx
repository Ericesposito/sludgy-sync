'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import { joinRoom } from '@/utils/socket';

export default function WatchRoom() {
  const { roomId } = useParams();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId.toString());
    }
  }, [roomId]);

  return (
    <div>
      <h1>Sludgy Sync Room: {roomId}</h1>
      <VideoPlayer videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />
    </div>
  );
}
