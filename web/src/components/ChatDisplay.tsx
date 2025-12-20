'use client';

import { useEffect, useState, useRef } from 'react';
import type { OutputMessage } from '@/types/messages';

interface ChatMessage {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

export function ChatDisplay() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentChunk, setCurrentChunk] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[UI] SSE connection opened');
      setConnectionStatus('connected');
    };

    eventSource.onerror = (error) => {
      console.error('[UI] SSE error:', error);
      setConnectionStatus('disconnected');
    };

    eventSource.onmessage = (event) => {
      try {
        const message: OutputMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'welcome':
            setMessages((prev) => [
              ...prev,
              {
                id: `${message.timestamp}`,
                type: 'system',
                content: `Welcome to AI Chat - ${message.payload.providerName || 'Unknown Provider'}`,
                timestamp: message.timestamp,
              },
            ]);
            break;

          case 'prompt':
            setMessages((prev) => [
              ...prev,
              {
                id: `${message.timestamp}`,
                type: 'prompt',
                content: message.payload.promptText || '',
                timestamp: message.timestamp,
              },
            ]);
            break;

          case 'chunk':
            // Accumulate chunks for the current response
            setCurrentChunk((prev) => prev + (message.payload.content || ''));
            break;

          case 'complete':
            // Finalize the current response
            if (currentChunk) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `${message.timestamp}`,
                  type: 'assistant',
                  content: currentChunk,
                  timestamp: message.timestamp,
                },
              ]);
              setCurrentChunk('');
            }
            break;

          case 'error':
            setMessages((prev) => [
              ...prev,
              {
                id: `${message.timestamp}`,
                type: 'error',
                content: message.payload.content || 'An error occurred',
                timestamp: message.timestamp,
              },
            ]);
            break;

          case 'warning':
            setMessages((prev) => [
              ...prev,
              {
                id: `${message.timestamp}`,
                type: message.type,
                content: message.payload.content || '',
                timestamp: message.timestamp,
              },
            ]);
            break;

          case 'info':
          case 'system':
          case 'help':
          case 'commandHelp':
            // Skip help messages in web UI
            break;
        }
      } catch (err) {
        console.error('[UI] Failed to parse message:', err);
      }
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []); // Empty dependency array - only connect once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentChunk]);

  const getMessageStyles = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-l-4 border-blue-500';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-l-4 border-yellow-500';
      case 'info':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-gray-500';
      case 'prompt':
        return 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-l-4 border-green-500 font-semibold';
      case 'assistant':
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-purple-500';
      default:
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Chat - Live Stream</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
              }`}
            />
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
        <div className="container mx-auto max-w-4xl space-y-3">
          {messages.length === 0 && !currentChunk && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p className="text-lg">Waiting for messages...</p>
              <p className="text-sm mt-2">
                Start a conversation in your terminal to see it streamed here.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg shadow-sm ${getMessageStyles(message.type)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold uppercase opacity-75">
                  {message.type}
                </span>
                <span className="text-xs opacity-50">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          ))}

          {/* Current streaming chunk */}
          {currentChunk && (
            <div className="p-4 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-4 border-purple-500 animate-pulse">
              <div className="text-xs font-semibold uppercase opacity-75 mb-1">
                Assistant (streaming...)
              </div>
              <div className="whitespace-pre-wrap break-words">{currentChunk}</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-3 text-sm">
        Read-only view. Use the terminal to send messages.
      </footer>
    </div>
  );
}
