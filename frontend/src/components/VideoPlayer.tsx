'use client';
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import io from 'socket.io-client';

const socket = io('http://localhost:1247');

export default function WatchParty({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const hls = new Hls();
    hls.loadSource(videoUrl);
    hls.attachMedia(video);

    const tryPlay = (time: number) => {
      if (userInteracted && !isPlaying) {
        video.currentTime = time;
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error('Autoplay blocked:', err));
      }
    };

    const tryPause = (time: number) => {
      if (isPlaying) {
        video.currentTime = time;
        video.pause();
        setIsPlaying(false);
      }
    };

    const trySeek = (time: number) => {
      if (Math.abs(video.currentTime - time) > 0.5) {
        video.currentTime = time;
        setLastSyncedTime(time);
      }
    };

    socket.on('sync', ({ isPlaying, timestamp }) => {
      // video.currentTime = timestamp;
      if (isPlaying && userInteracted) {
        tryPlay(timestamp);
      } else {
        tryPause(timestamp);
      }
    });

    socket.on('play', tryPlay);
    socket.on('pause', tryPause);
    socket.on('seek', trySeek);

    return () => {
      socket.off('play', tryPlay);
      socket.off('pause', tryPause);
      socket.off('seek', trySeek);
    };
  }, [videoUrl, userInteracted, isPlaying]);

  const handleUserInteraction = () => setUserInteracted(true);

  const handlePlay = () => {
    if (!isPlaying && userInteracted && videoRef.current) {
      socket.emit('play', videoRef.current?.currentTime);
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (isPlaying && userInteracted && videoRef.current) {
      socket.emit('pause', videoRef.current?.currentTime);
      setIsPlaying(false);
    }
  };

  const handleSeek = () => {
    if (userInteracted && videoRef.current) {
      const newTime = videoRef.current.currentTime;
      if (Math.abs(newTime - lastSyncedTime) > 0.5) {
        socket.emit('seek', newTime);
        setLastSyncedTime(newTime);
      }
    }
  };

  return (
    <div onClick={handleUserInteraction} onKeyDown={handleUserInteraction}>
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
