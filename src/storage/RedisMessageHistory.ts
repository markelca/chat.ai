import { Message } from '../providers/base.js';
import { MessageHistory } from './MessageHistory.js';

export interface RedisMessageHistoryOptions {
  /**
   * Unique name for this conversation session.
   */
  sessionName: string;

  /**
   * Optional TTL (time-to-live) in seconds.
   * If not specified, messages persist indefinitely.
   */
  ttl?: number;

  /**
   * Redis connection options (host, port, password, etc.)
   * TODO: Define specific Redis connection options based on the Redis client library
   */
  redisOptions?: any;
}

/**
 * Redis-based implementation of MessageHistory using Redis Lists.
 * Messages are stored in a Redis List with the key pattern: "session:{sessionName}:messages"
 *
 * Storage structure:
 * - Key: "session:{sessionName}:messages"
 * - Type: Redis List
 * - Value: JSON-serialized Message objects
 *
 * @example
 * const history = new RedisMessageHistory({
 *   sessionName: 'user-123-conversation',
 *   ttl: 3600, // 1 hour
 *   redisOptions: { host: 'localhost', port: 6379 }
 * });
 */
export class RedisMessageHistory extends MessageHistory {
  private readonly sessionName: string;
  private readonly ttl?: number;
  private readonly redisKey: string;
  // TODO: Add Redis client instance property
  // private redisClient: RedisClient;

  constructor(options: RedisMessageHistoryOptions) {
    super();
    this.sessionName = options.sessionName;
    this.ttl = options.ttl;
    this.redisKey = `session:${this.sessionName}:messages`;

    // TODO: Initialize Redis client with options.redisOptions
    // this.redisClient = createRedisClient(options.redisOptions);
  }

  /**
   * Adds a message to the Redis List.
   *
   * Implementation steps:
   * 1. Serialize the message to JSON
   * 2. Use RPUSH to append to the list (adds to the right/end)
   * 3. If TTL is set, use EXPIRE to set/refresh the TTL
   *
   * Redis commands:
   * - RPUSH session:{sessionName}:messages "{\"role\":\"user\",\"content\":\"...\"}"
   * - EXPIRE session:{sessionName}:messages {ttl} (if TTL is set)
   */
  async add(message: Message): Promise<void> {
    // TODO: Implement Redis RPUSH
    // const serialized = JSON.stringify(message);
    // await this.redisClient.rpush(this.redisKey, serialized);
    // if (this.ttl) {
    //   await this.redisClient.expire(this.redisKey, this.ttl);
    // }
    throw new Error('RedisMessageHistory.add() not implemented yet');
  }

  /**
   * Retrieves all messages from the Redis List.
   *
   * Implementation steps:
   * 1. Use LRANGE to get all items from the list (0 to -1 means all)
   * 2. Deserialize each JSON string back to Message object
   * 3. Return the array in chronological order
   *
   * Redis commands:
   * - LRANGE session:{sessionName}:messages 0 -1
   */
  async getAll(): Promise<Message[]> {
    // TODO: Implement Redis LRANGE
    // const serializedMessages = await this.redisClient.lrange(this.redisKey, 0, -1);
    // return serializedMessages.map(str => JSON.parse(str) as Message);
    throw new Error('RedisMessageHistory.getAll() not implemented yet');
  }

  /**
   * Clears all messages by deleting the Redis List.
   *
   * Implementation steps:
   * 1. Use DEL to remove the key entirely
   *
   * Redis commands:
   * - DEL session:{sessionName}:messages
   */
  async clear(): Promise<void> {
    // TODO: Implement Redis DEL
    // await this.redisClient.del(this.redisKey);
    throw new Error('RedisMessageHistory.clear() not implemented yet');
  }

  /**
   * Closes the Redis connection.
   * Call this when done with the message history to clean up resources.
   */
  async disconnect(): Promise<void> {
    // TODO: Implement Redis client disconnect
    // await this.redisClient.quit();
    throw new Error('RedisMessageHistory.disconnect() not implemented yet');
  }
}
