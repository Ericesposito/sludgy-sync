'use client';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import io from 'socket.io-client';
import { useParams } from 'next/navigation';

const socket = io('http://localhost:1247');

export default function WatchParty({ videoUrl }: { videoUrl: string }) {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current || hlsRef.current) return;

    const video = videoRef.current;
    const hls = new Hls();
    hlsRef.current = hls;

    // ✅ Only load the first available level
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('HLS Manifest Loaded:', hls.levels);
      hls.autoLevelCapping = 2;
      if (hls.levels.length > 0) {
        hls.currentLevel = 0; // Start with the lowest quality to prevent excessive requests
      }
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

    const tryPlay = (time: number) => {
      if (userInteracted && video.paused) {
        console.log('Received play request, playing video at: ', time);
        video.currentTime = time;
        video
          .play()
          .then(() => setLocalIsPlaying(true))
          .catch((err) => console.error('Autoplay blocked: ', err));
      }
    };

    const tryPause = (time: number) => {
      if (!video.paused) {
        console.log('Received pause request, pausing video at: ', time);
        video.currentTime = time;
        video.pause();
        setLocalIsPlaying(false);
      }
    };

    const trySeek = (time: number) => {
      if (Math.abs(video.currentTime - time) > 0.5) {
        video.currentTime = time;
        setLastSyncedTime(time);
      }
    };

    const trySync = ({
      videoIsPlaying,
      timestamp,
    }: {
      videoIsPlaying: boolean;
      timestamp: number;
    }) => {
      console.log('[WebSocket] Received sync event:', {
        videoIsPlaying,
        timestamp,
      });
      if (videoIsPlaying && !localIsPlaying) {
        tryPlay(timestamp);
      } else if (!videoIsPlaying && localIsPlaying) {
        tryPause(timestamp);
      }
    };

    socket.emit('joinRoom', roomId);

    socket.on('sync', trySync);
    socket.on('play', tryPlay);
    socket.on('pause', tryPause);
    socket.on('seek', trySeek);

    return () => {
      socket.off('play', tryPlay);
      socket.off('pause', tryPause);
      socket.off('seek', trySeek);
      socket.off('sync', trySync);
    };
  }, [videoUrl, userInteracted, localIsPlaying, roomId]);

  const handleUserInteraction = () => setUserInteracted(true);

  const handlePlay = () => {
    if (userInteracted && videoRef.current && !localIsPlaying) {
      console.log('Emitting play event at: ', videoRef.current.currentTime);
      socket.emit('play', videoRef.current.currentTime);
      setLocalIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (userInteracted && videoRef.current && localIsPlaying) {
      console.log('Emitting pause event at: ', videoRef.current.currentTime);
      socket.emit('pause', videoRef.current.currentTime);
      setLocalIsPlaying(false);
    }
  };

  const handleSeek = () => {
    if (userInteracted && videoRef.current) {
      const newTime = videoRef.current.currentTime;
      if (Math.abs(newTime - lastSyncedTime) > 0.5) {
        console.log('Emitting seek event at: ', newTime);
        socket.emit('seek', newTime);
        setLastSyncedTime(newTime);
      }
    }
  };

  return (
    <div onClick={handleUserInteraction} onKeyDown={handleUserInteraction}>
      <h1>Room ID: {roomId}</h1>
      <video
        ref={videoRef}
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeek}
      ></video>
      <button onClick={() => setIsHost(!isHost)}>Toggle Host</button>
    </div>
  );
}
