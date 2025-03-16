'use client';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useParams } from 'next/navigation';
import socket from '@/utils/socket';

export default function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(0);
  const isLocalSeek = useRef(false);

  // Initialize HLS
  useEffect(() => {
    if (!videoRef.current || hlsRef.current) return;

    const video = videoRef.current;
    const hls = new Hls();
    hlsRef.current = hls;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Log available quality levels
      console.log(
        'Available quality levels:',
        hls.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
        }))
      );

      // Allow all quality levels
      hls.autoLevelCapping = -1;

      if (hls.levels.length > 0) {
        // Start with higher quality (usually 720p)
        // Level 2 is typically 720p in most HLS streams
        const targetLevel = Math.min(2, hls.levels.length - 1);
        hls.currentLevel = targetLevel;

        console.log('Starting playback at quality level:', {
          level: targetLevel,
          height: hls.levels[targetLevel].height,
          width: hls.levels[targetLevel].width,
          bitrate: hls.levels[targetLevel].bitrate,
        });
      }
    });

    // Log quality level changes
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const newLevel = hls.levels[data.level];
      console.log('Quality level changed:', {
        height: newLevel.height,
        width: newLevel.width,
        bitrate: newLevel.bitrate,
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error:', data);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Network error – retrying...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Media error – recovering...');
            hls.recoverMediaError();
            break;
          default:
            console.error('Unrecoverable error – destroying HLS.');
            hls.destroy();
            break;
        }
      }
    });

    hls.loadSource(videoUrl);
    hls.attachMedia(video);

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [videoUrl]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!videoRef.current || !roomId || !userInteracted) return;

    const video = videoRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinRoom', roomId);

    const handleRemotePlay = (time: number) => {
      console.log('Received play event at:', time);
      if (!isLocalSeek.current) {
        if (Number.isFinite(time)) {
          video.currentTime = time;
        } else {
          console.warn('Received invalid play time:', time);
        }
        video.play().catch((err) => console.error('Play failed:', err));
      }
      isLocalSeek.current = false;
    };

    const handleRemotePause = (time: number) => {
      console.log('Received pause event at:', time);
      if (!isLocalSeek.current) {
        if (Number.isFinite(time)) {
          video.currentTime = time;
        } else {
          console.warn('Received invalid pause time:', time);
        }
        video.pause();
      }
      isLocalSeek.current = false;
    };

    const handleRemoteSeek = (time: number) => {
      console.log('Received seek event at:', time);
      if (!Number.isFinite(time)) {
        console.warn('Received invalid seek time:', time);
        return;
      }
      if (!isLocalSeek.current && Math.abs(video.currentTime - time) > 0.5) {
        video.currentTime = time;
      }
      isLocalSeek.current = false;
    };

    const handleRemoteSync = ({
      videoIsPlaying,
      timestamp,
    }: {
      videoIsPlaying: boolean;
      timestamp: number;
    }) => {
      console.log('Received sync event:', { videoIsPlaying, timestamp });
      if (Number.isFinite(timestamp)) {
        video.currentTime = timestamp;
      } else {
        console.warn('Received invalid sync timestamp:', timestamp);
      }
      if (videoIsPlaying && video.paused) {
        video.play().catch((err) => console.error('Sync play failed:', err));
      } else if (!videoIsPlaying && !video.paused) {
        video.pause();
      }
    };

    socket.on('play', handleRemotePlay);
    socket.on('pause', handleRemotePause);
    socket.on('seek', handleRemoteSeek);
    socket.on('sync', handleRemoteSync);

    return () => {
      socket.off('play', handleRemotePlay);
      socket.off('pause', handleRemotePause);
      socket.off('seek', handleRemoteSeek);
      socket.off('sync', handleRemoteSync);
    };
  }, [roomId, userInteracted]);

  const handleUserInteraction = () => setUserInteracted(true);

  const handleLocalPlay = () => {
    if (!userInteracted || !videoRef.current) return;
    isLocalSeek.current = true;
    socket.emit('play', videoRef.current.currentTime);
  };

  const handleLocalPause = () => {
    if (!userInteracted || !videoRef.current) return;
    isLocalSeek.current = true;
    socket.emit('pause', videoRef.current.currentTime);
  };

  const handleLocalSeek = () => {
    if (!userInteracted || !videoRef.current) return;
    const newTime = videoRef.current.currentTime;
    if (Math.abs(newTime - lastSyncedTime) > 0.5) {
      isLocalSeek.current = true;
      socket.emit('seek', newTime);
      setLastSyncedTime(newTime);
    }
  };

  return (
    <div
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
    >
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        onPlay={handleLocalPlay}
        onPause={handleLocalPause}
        onSeeked={handleLocalSeek}
      ></video>
    </div>
  );
}
