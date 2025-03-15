# Sludgy Sync
A self-hosted watch party platform that lets users upload, stream, and watch videos together in sync. One person hosts the video, and others join to stream it simultaneously, with real-time playback control using WebSockets.

✨ Features:
Upload & Stream – Store videos on Cloudflare R2 and stream via HLS.
Real-time Sync – Stay in sync with friends using WebSockets (Socket.io).
Adaptive Streaming – Supports HLS (.m3u8) for smooth playback.
Host or Shared Controls – Choose whether one person controls playback or everyone can.
CDN-Powered Delivery – Uses Cloudflare CDN for scalable, free video distribution.

🛠 Tech Stack:
Frontend: React (Next.js) + hls.js
Backend: Node.js (Express) + Socket.io
Storage: Cloudflare R2 (10GB free)
Streaming: HLS (FFmpeg for encoding)
Database (Optional): Supabase (PostgreSQL)

🚀 Perfect for movie nights, remote viewing parties, and group video streaming!
