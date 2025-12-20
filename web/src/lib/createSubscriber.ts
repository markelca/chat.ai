import { MessageSubscriber } from './MessageSubscriber';
import { RedisMessageSubscriber } from './RedisMessageSubscriber';

/**
 * Factory function to create a MessageSubscriber based on environment configuration.
 * Currently supports Redis, but can be extended to support other message brokers.
 */
export function createSubscriber(): MessageSubscriber {
  // In the future, this could check an env var like MESSAGE_BROKER_TYPE
  // For now, Redis is the only implementation
  return RedisMessageSubscriber.fromEnv();
}
