'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRoom() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    router.push(`/watch/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/watch/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Sludgy Sync</h1>
        <p className="text-lg text-gray-600">Watch videos together in sync</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <button
          onClick={handleCreateRoom}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create New Room
        </button>

        <div className="text-center">- or -</div>

        <form onSubmit={handleJoinRoom} className="flex flex-col gap-2">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
