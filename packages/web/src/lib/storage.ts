import { SessionStore } from '@ai-chat/shared/storage/SessionStore';
import { RedisSessionStore } from '@ai-chat/shared/storage/RedisSessionStore';
import { MessageHistory } from '@ai-chat/shared/storage/MessageHistory';
import { RedisMessageHistory } from '@ai-chat/shared/storage/RedisMessageHistory';

export function createSessionStore(): SessionStore {
  return new RedisSessionStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });
}

export function createMessageHistory(sessionName: string): MessageHistory {
  return new RedisMessageHistory({
    sessionName,
    redisOptions: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  });
}
