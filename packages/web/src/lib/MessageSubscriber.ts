import type { OutputMessage } from '@/types/messages';

/**
 * Abstract class for message subscription.
 * Implementations provide different message broker backends (Redis, RabbitMQ, Kafka, etc.)
 */
export abstract class MessageSubscriber {
  /**
   * Connect to the message broker.
   */
  abstract connect(): Promise<void>;

  /**
   * Subscribe to messages and invoke callback for each message received.
   * @param callback Function called for each message
   */
  abstract subscribe(callback: (message: OutputMessage) => void): Promise<void>;

  /**
   * Unsubscribe from messages.
   */
  abstract unsubscribe(): Promise<void>;

  /**
   * Disconnect from the message broker and clean up resources.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Handle errors that occur during subscription.
   * @param handler Error handler function
   */
  abstract onError(handler: (error: Error) => void): void;
}
