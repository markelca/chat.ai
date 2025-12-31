'use client';

import { useEffect, useState } from 'react';

interface Session {
  name: string;
  lastMessage: number;
  messageCount: number;
  createdAt: number;
  title?: string;
}

interface SessionListProps {
  activeSession: string | null;
  onSelectSession: (sessionName: string) => void;
}

export function SessionList({ activeSession, onSelectSession }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        setSessions(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col h-screen border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Chat Sessions</h2>
        <p className="text-xs text-gray-400 mt-1">{sessions.length} session(s)</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-400 text-center">
            <div className="animate-pulse">Loading sessions...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            <p>No sessions found</p>
            <p className="text-xs mt-2">Start a chat in the CLI to see sessions here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {sessions.map((session) => (
              <li
                key={session.name}
                onClick={() => onSelectSession(session.name)}
                className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                  activeSession === session.name ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <div className="font-semibold truncate text-sm">
                  {session.title || session.name}
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <span>{session.messageCount} msg</span>
                  <span>{formatRelativeTime(session.lastMessage)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <p className="text-xs text-gray-500 text-center">
          Sessions auto-refresh every 5s
        </p>
      </div>
    </aside>
  );
}
