import { createClient, RedisClientType } from "redis";
import { Message } from "../types/messages";
import { MessageHistory } from "./MessageHistory";
import { RedisConfig } from "../types/config";

export interface RedisConnectionOptions {
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  database?: number;
}

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
   */
  redisOptions?: RedisConnectionOptions;
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
  private redisClient: RedisClientType;
  private connected: boolean = false;

  constructor(options: RedisMessageHistoryOptions) {
    super();
    this.sessionName = options.sessionName;
    this.ttl = options.ttl;
    this.redisKey = `session:${this.sessionName}:messages`;

    const redisOptions = options.redisOptions || {};
    this.redisClient = createClient({
      socket: {
        host: redisOptions.host || "localhost",
        port: redisOptions.port || 6379,
      },
      password: redisOptions.password,
      username: redisOptions.username,
      database: redisOptions.database || 0,
    });

    this.redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });
  }

  static fromRedisConfig(config: RedisConfig): RedisMessageHistory {
    if (!config.sessionName) {
      throw new Error('Redis config sessionName is required but was not generated');
    }
    return new RedisMessageHistory({
      sessionName: config.sessionName,
      ttl: config.ttl,
      redisOptions: {
        host: config.host,
        port: config.port,
        password: config.password,
        username: config.username,
        database: config.database,
      },
    });
  }

  /**
   * Ensures the Redis client is connected before operations.
   */
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.redisClient.connect();
      this.connected = true;
    }
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
    await this.ensureConnected();
    const serialized = JSON.stringify(message);
    await this.redisClient.rPush(this.redisKey, serialized);
    if (this.ttl) {
      await this.redisClient.expire(this.redisKey, this.ttl);
    }
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
    await this.ensureConnected();
    const serializedMessages = await this.redisClient.lRange(
      this.redisKey,
      0,
      -1,
    );
    return serializedMessages.map((str) => JSON.parse(str) as Message);
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
    await this.ensureConnected();
    await this.redisClient.del(this.redisKey);
  }

  /**
   * Closes the Redis connection.
   * Call this when done with the message history to clean up resources.
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }
}
