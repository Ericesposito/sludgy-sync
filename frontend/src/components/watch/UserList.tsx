'use client';
import { useEffect, useState } from 'react';
import socket from '@/utils/socket';

interface User {
  id: string;
  username: string;
  ready: boolean;
}

interface UpdateUsersEvent {
  users: User[];
  allUsersReady: boolean;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsersReady, setAllUsersReady] = useState(false);

  useEffect(() => {
    const handleUpdateUsers = ({ users, allUsersReady }: UpdateUsersEvent) => {
      setUsers(users);
      setAllUsersReady(allUsersReady);
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
            key={user.id}
            className="bg-gray-700 px-3 py-2 rounded shadow-sm hover:bg-gray-600 transition-colors flex justify-between items-center"
          >
            <span>{user.username}</span>
            <span
              className={`text-sm ${
                user.ready ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {user.ready ? 'Ready' : 'Not Ready'}
            </span>
          </li>
        ))}
      </ul>
      {allUsersReady ? (
        <p className="mt-4 text-green-400 text-sm">All users are ready!</p>
      ) : (
        <p className="mt-4 text-yellow-400 text-sm">
          Waiting for all users to be ready...
        </p>
      )}
    </div>
  );
}
