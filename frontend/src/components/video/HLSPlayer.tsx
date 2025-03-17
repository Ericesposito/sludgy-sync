'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function HLSPlayer({ videoUrl, videoRef }: HLSPlayerProps) {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current || hlsRef.current) return;

    const video = videoRef.current;
    const hls = new Hls();
    hlsRef.current = hls;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
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
  }, [videoUrl, videoRef]);

  return null;
}
