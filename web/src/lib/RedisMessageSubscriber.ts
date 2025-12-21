import { createClient, RedisClientType } from 'redis';
import { MessageSubscriber } from './MessageSubscriber';
import type { OutputMessage } from '@/types/messages';

export interface RedisSubscriberConfig {
  host: string;
  port: number;
  password?: string;
  channel: string;
}

/**
 * Redis implementation of MessageSubscriber.
 * Subscribes to Redis pub/sub channel and forwards messages.
 */
export class RedisMessageSubscriber extends MessageSubscriber {
  private client: RedisClientType;
  private channel: string;
  private errorHandler?: (error: Error) => void;
  private connected: boolean = false;

  constructor(config: RedisSubscriberConfig) {
    super();
    this.channel = config.channel;

    this.client = createClient({
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password || undefined,
    });

    this.client.on('error', (err) => {
      if (this.errorHandler) {
        this.errorHandler(err);
      }
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async subscribe(callback: (message: OutputMessage) => void): Promise<void> {
    await this.client.subscribe(this.channel, (message) => {
      try {
        const parsed = JSON.parse(message) as OutputMessage;
        callback(parsed);
      } catch (err) {
        if (this.errorHandler) {
          this.errorHandler(
            err instanceof Error ? err : new Error('Failed to parse message')
          );
        }
      }
    });
  }

  async unsubscribe(): Promise<void> {
    if (this.connected) {
      await this.client.unsubscribe(this.channel);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Static factory method to create RedisMessageSubscriber from environment variables.
   * Accepts optional config override or sessionName for session-specific channels.
   */
  static fromEnv(options?: { configOverride?: Partial<RedisSubscriberConfig>; sessionName?: string }): RedisMessageSubscriber {
    const baseChannel = process.env.REDIS_CHANNEL || 'ai-chat:stream';
    const channel = options?.sessionName ? `${baseChannel}:${options.sessionName}` : baseChannel;

    const config: RedisSubscriberConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      channel,
      ...options?.configOverride,
    };

    return new RedisMessageSubscriber(config);
  }
}
