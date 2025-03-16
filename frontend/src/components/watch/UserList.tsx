'use client';
import { useEffect, useState } from 'react';
import socket from '@/utils/socket';

export default function UserList() {
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdateUsers = (updatedUsers: string[]) => {
      setUsers(updatedUsers);
    };

    socket.on('updateUsers', handleUpdateUsers);

    return () => {
      socket.off('updateUsers', handleUpdateUsers);
    };
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white">
      <h2 className="text-lg font-semibold mb-2 text-white">Connected Users</h2>
      <ul className="space-y-1">
        {users.map((user) => (
          <li
            key={user}
            className="bg-gray-700 px-3 py-2 rounded shadow-sm hover:bg-gray-600 transition-colors"
          >
            {user}
          </li>
        ))}
      </ul>
    </div>
  );
}
