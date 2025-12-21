'use client';

import { useState } from 'react';
import { SessionList } from '@/components/SessionList';
import { ChatDisplay } from '@/components/ChatDisplay';

export default function Home() {
  const [activeSession, setActiveSession] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <SessionList
        activeSession={activeSession}
        onSelectSession={setActiveSession}
      />
      <div className="flex-1">
        {activeSession ? (
          <ChatDisplay sessionName={activeSession} />
        ) : (
          <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Chat</h2>
              <p className="text-lg mb-4">Select a session from the sidebar to view the conversation</p>
              <div className="text-sm bg-blue-100 dark:bg-blue-900 p-4 rounded-lg max-w-md mx-auto">
                <p className="font-semibold mb-2">Getting Started:</p>
                <ol className="text-left list-decimal list-inside space-y-1">
                  <li>Start the CLI with Redis and web streaming enabled</li>
                  <li>Begin a conversation in your terminal</li>
                  <li>Your session will appear in the sidebar</li>
                  <li>Click on a session to view and follow the conversation</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
