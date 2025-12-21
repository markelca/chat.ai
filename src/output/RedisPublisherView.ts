import { createClient, RedisClientType } from "redis";
import { OutputView } from "./OutputView.js";
import type { OutputMessage } from "../../shared/types/output.js";
import { WebStreamConfig } from "../config/manager.js";

export interface RedisPublisherOptions {
  host?: string;
  port?: number;
  password?: string;
  channel?: string;
  sessionName?: string;
}

/**
 * OutputView implementation that publishes messages to Redis pub/sub.
 * Used to broadcast conversation output to web clients via SSE.
 */
export class RedisPublisherView extends OutputView {
  private redisClient: RedisClientType;
  private channel: string;
  private connected: boolean = false;

  constructor(options: RedisPublisherOptions = {}) {
    super();
    const baseChannel = options.channel || "ai-chat:stream";
    this.channel = options.sessionName
      ? `${baseChannel}:${options.sessionName}`
      : baseChannel;

    this.redisClient = createClient({
      socket: {
        host: options.host || "localhost",
        port: options.port || 6379,
      },
      password: options.password,
    });

    this.redisClient.on("error", (err) => {
      console.error("Redis Publisher Error:", err);
    });
  }

  static fromWebStreamingConfig(config: WebStreamConfig, sessionName?: string): RedisPublisherView {
    return new RedisPublisherView({
      channel: config.redisChannel,
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      sessionName,
    });
  }

  /**
   * Ensure Redis connection is established.
   */
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.redisClient.connect();
      this.connected = true;
    }
  }

  /**
   * Publish a message to Redis channel.
   */
  private async publish(message: OutputMessage): Promise<void> {
    await this.ensureConnected();
    await this.redisClient.publish(this.channel, JSON.stringify(message));
  }

  async displayWelcome(providerName: string): Promise<void> {
    await this.publish({
      type: "welcome",
      payload: { providerName },
      timestamp: Date.now(),
    });
  }

  async displayHelp(): Promise<void> {
    await this.publish({
      type: "help",
      payload: {},
      timestamp: Date.now(),
    });
  }

  async displayCommandHelp(): Promise<void> {
    await this.publish({
      type: "commandHelp",
      payload: {},
      timestamp: Date.now(),
    });
  }

  async displayPrompt(promptText: string): Promise<void> {
    await this.publish({
      type: "prompt",
      payload: { promptText },
      timestamp: Date.now(),
    });
  }

  async displayUserMessage(message: string): Promise<void> {
    await this.publish({
      type: "user",
      payload: { content: message },
      timestamp: Date.now(),
    });
  }

  async streamChunk(chunk: string): Promise<void> {
    await this.publish({
      type: "chunk",
      payload: { content: chunk },
      timestamp: Date.now(),
    });
  }

  async streamComplete(): Promise<void> {
    await this.publish({
      type: "complete",
      payload: {},
      timestamp: Date.now(),
    });
  }

  async displayError(error: string): Promise<void> {
    await this.publish({
      type: "error",
      payload: { content: error },
      timestamp: Date.now(),
    });
  }

  async displayInfo(message: string): Promise<void> {
    await this.publish({
      type: "info",
      payload: { content: message },
      timestamp: Date.now(),
    });
  }

  async displayWarning(message: string): Promise<void> {
    await this.publish({
      type: "warning",
      payload: { content: message },
      timestamp: Date.now(),
    });
  }

  async displaySystemMessage(message: string): Promise<void> {
    await this.publish({
      type: "system",
      payload: { content: message },
      timestamp: Date.now(),
    });
  }

  async displayClear(): Promise<void> {
    await this.publish({
      type: "clear",
      payload: {},
      timestamp: Date.now(),
    });
  }

  /**
   * Disconnect from Redis.
   * Call this when shutting down to clean up resources.
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }
}
