'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import UserList from '@/components/watch/UserList';
import { joinRoom } from '@/utils/socket';

export default function WatchRoom() {
  const { roomId } = useParams();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId.toString());
    }
  }, [roomId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <VideoPlayer videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />
        </div>
        <div className="lg:col-span-1">
          <UserList />
        </div>
      </div>
    </div>
  );
}
