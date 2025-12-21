import { Message } from '../types/messages.js';
import { MessageHistory } from './MessageHistory.js';

/**
 * In-memory implementation of MessageHistory.
 * Messages are stored in a simple array and lost when the process ends.
 */
export class InMemoryMessageHistory extends MessageHistory {
  private messages: Message[] = [];

  async add(message: Message): Promise<void> {
    this.messages.push(message);
  }

  async getAll(): Promise<Message[]> {
    return [...this.messages];
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}
