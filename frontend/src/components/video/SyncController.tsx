'use client';
import { useEffect, useRef } from 'react';
import socket from '@/utils/socket';
import { useUser } from '@/contexts/UserContext';

interface SyncControllerProps {
  roomId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  userInteracted: boolean;
}

interface SyncEvent {
  videoIsPlaying: boolean;
  timestamp: number;
  username: string;
  isInitialSync?: boolean;
}

export default function SyncController({
  roomId,
  videoRef,
  userInteracted,
}: SyncControllerProps) {
  const isLocalSeek = useRef(false);
  const hasInitialSync = useRef(false);
  const { user } = useUser();

  useEffect(() => {
    if (!videoRef.current || !roomId || !user) return;

    const video = videoRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    const joinRoom = () => {
      socket.emit('joinRoom', { roomId, username: user.username });
    };

    joinRoom(); // Initial join

    // Handle reconnection
    const handleReconnect = () => {
      console.log('Reconnected, rejoining room...');
      joinRoom();
    };

    socket.on('reconnect', handleReconnect);

    const handleRemoteSync = ({
      videoIsPlaying,
      timestamp,
      username,
      isInitialSync,
    }: SyncEvent) => {
      console.log(`Remote sync from ${username}:`, {
        videoIsPlaying,
        timestamp,
        isInitialSync,
      });

      // Always accept initial sync, regardless of userInteracted
      if (
        !isLocalSeek.current &&
        (isInitialSync || hasInitialSync.current || userInteracted)
      ) {
        if (Number.isFinite(timestamp)) {
          video.currentTime = timestamp;
        } else {
          console.warn('Received invalid sync timestamp:', timestamp);
          return;
        }

        const syncPlayback = () => {
          if (videoIsPlaying && video.paused) {
            video.play().catch((err) => {
              console.error('Sync play failed:', err);
            });
          } else if (!videoIsPlaying && !video.paused) {
            video.pause();
          }

          if (isInitialSync) {
            hasInitialSync.current = true;
          }
        };

        // For initial sync or when no user interaction, wait for timeupdate
        if ((isInitialSync || !userInteracted) && !hasInitialSync.current) {
          const handleTimeUpdate = () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            syncPlayback();
            isLocalSeek.current = false;
          };
          video.addEventListener('timeupdate', handleTimeUpdate);
        } else {
          syncPlayback();
          isLocalSeek.current = false;
        }
      }
    };

    const handleSyncConfirm = ({
      videoIsPlaying,
      timestamp,
      username,
    }: SyncEvent) => {
      console.log(`Local action confirmed for ${username}:`, {
        videoIsPlaying,
        timestamp,
      });
      hasInitialSync.current = true;
      // Only reset isLocalSeek after a short delay to prevent race conditions
      setTimeout(() => {
        isLocalSeek.current = false;
      }, 100);
    };

    // Handle the ended event to sync pause state
    const handleEnded = () => {
      if (!isLocalSeek.current && userInteracted && hasInitialSync.current) {
        socket.emit('pause', {
          time: video.duration,
          username: user.username,
        });
      }
    };

    video.addEventListener('ended', handleEnded);
    socket.on('sync', handleRemoteSync);
    socket.on('syncConfirm', handleSyncConfirm);

    return () => {
      video.removeEventListener('ended', handleEnded);
      socket.off('sync', handleRemoteSync);
      socket.off('syncConfirm', handleSyncConfirm);
      socket.off('reconnect', handleReconnect);
    };
  }, [roomId, userInteracted, videoRef, user]);

  const handlePlay = () => {
    if (!userInteracted || !videoRef.current || !user || isLocalSeek.current)
      return;
    isLocalSeek.current = true;
    socket.emit('play', {
      time: videoRef.current.currentTime,
      username: user.username,
    });
  };

  const handlePause = () => {
    if (!userInteracted || !videoRef.current || !user || isLocalSeek.current)
      return;
    isLocalSeek.current = true;
    socket.emit('pause', {
      time: videoRef.current.currentTime,
      username: user.username,
    });
  };

  const handleSeek = () => {
    if (!userInteracted || !videoRef.current || !user || isLocalSeek.current)
      return;
    isLocalSeek.current = true;
    const newTime = videoRef.current.currentTime;
    socket.emit('seek', { time: newTime, username: user.username });
  };

  return { handlePlay, handlePause, handleSeek };
}
