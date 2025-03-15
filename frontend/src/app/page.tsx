import React from 'react';
import VideoPlayer from '@/components/VideoPlayer';

export default function Home() {
  return (
    <VideoPlayer videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" />
  );
}
