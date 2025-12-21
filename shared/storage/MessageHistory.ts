import { Message } from "../types/messages";

/**
 * Abstract interface for message history storage.
 * Implementations can store messages in memory, Redis, or other backends.
 */
export abstract class MessageHistory {
  /**
   * Adds a message to the conversation history.
   * @param message The message to add
   */
  abstract add(message: Message): Promise<void>;

  /**
   * Retrieves all messages in the conversation history.
   * @returns Array of messages in chronological order
   */
  abstract getAll(): Promise<Message[]>;

  /**
   * Clears all messages from the conversation history.
   */
  abstract clear(): Promise<void>;
}
