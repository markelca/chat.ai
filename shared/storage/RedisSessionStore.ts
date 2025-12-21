import { createClient, RedisClientType } from "redis";
import { SessionStore } from "./SessionStore";
import { SessionMetadata } from "../types/sessions";
import { RedisConfig } from "../../src/config/manager";

export interface RedisSessionStoreOptions {
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  database?: number;
  /**
   * Optional TTL (time-to-live) in seconds.
   * If not specified, messages persist indefinitely.
   */
  ttl?: number;
}

export class RedisSessionStore extends SessionStore {
  private redisClient: RedisClientType;
  private connected: boolean = false;
  private readonly ttl?: number;

  constructor(options: RedisSessionStoreOptions = {}) {
    super();
    this.ttl = options.ttl;
    this.redisClient = createClient({
      socket: {
        host: options.host || "localhost",
        port: options.port || 6379,
      },
      password: options.password,
      username: options.username,
      database: options.database || 0,
    });

    this.redisClient.on("error", (err) => {
      console.error("Redis SessionStore Error:", err);
    });
  }

  static fromRedisConfig(config: RedisConfig): RedisSessionStore {
    // Note: SessionStore doesn't need sessionName - it manages all sessions
    return new RedisSessionStore({
      ttl: config.ttl,
      host: config.host,
      port: config.port,
      password: config.password,
      username: config.username,
      database: config.database,
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.redisClient.connect();
      this.connected = true;
    }
  }

  async list(): Promise<SessionMetadata[]> {
    await this.ensureConnected();
    const keys = await this.redisClient.keys("session:*:metadata");

    const sessions = await Promise.all(
      keys.map(async (key) => {
        const data = await this.redisClient.hGetAll(key);
        return {
          name: data.name,
          lastMessage: parseInt(data.lastMessage || "0"),
          messageCount: parseInt(data.messageCount || "0"),
          createdAt: parseInt(data.createdAt || "0"),
          title: data.title,
        } as SessionMetadata;
      }),
    );

    // Sort by most recent
    return sessions.sort((a, b) => b.lastMessage - a.lastMessage);
  }

  async get(sessionName: string): Promise<SessionMetadata | null> {
    await this.ensureConnected();
    const key = `session:${sessionName}:metadata`;
    const data = await this.redisClient.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      name: data.name,
      lastMessage: parseInt(data.lastMessage || "0"),
      messageCount: parseInt(data.messageCount || "0"),
      createdAt: parseInt(data.createdAt || "0"),
      title: data.title,
    };
  }

  async update(
    sessionName: string,
    metadata: Partial<SessionMetadata>,
  ): Promise<void> {
    await this.ensureConnected();
    const key = `session:${sessionName}:metadata`;

    // Ensure createdAt is set on first update
    const existing = await this.get(sessionName);
    if (!existing) {
      await this.redisClient.hSet(key, "createdAt", Date.now().toString());
      await this.redisClient.hSet(key, "name", sessionName);
      if (this.ttl) {
        await this.redisClient.expire(key, this.ttl);
      }
    }

    // Update provided fields
    if (metadata.lastMessage !== undefined) {
      await this.redisClient.hSet(
        key,
        "lastMessage",
        metadata.lastMessage.toString(),
      );
    }
    if (metadata.messageCount !== undefined) {
      await this.redisClient.hSet(
        key,
        "messageCount",
        metadata.messageCount.toString(),
      );
    }
    if (metadata.title !== undefined) {
      await this.redisClient.hSet(key, "title", metadata.title);
    }

    // Increment message count if not explicitly provided
    if (metadata.messageCount === undefined) {
      await this.redisClient.hIncrBy(key, "messageCount", 1);
    }
  }

  async delete(sessionName: string): Promise<void> {
    await this.ensureConnected();
    const key = `session:${sessionName}:metadata`;
    await this.redisClient.del(key);
  }

  async reset(sessionName: string): Promise<void> {
    await this.ensureConnected();
    const key = `session:${sessionName}:metadata`;

    // Reset message count and update timestamp
    await this.redisClient.hSet(key, "messageCount", "0");
    await this.redisClient.hSet(key, "lastMessage", Date.now().toString());

    // Refresh TTL if configured
    if (this.ttl) {
      await this.redisClient.expire(key, this.ttl);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }
}
