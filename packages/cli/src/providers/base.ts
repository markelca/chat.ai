// Re-export Message from shared types
export type { Message } from '../../shared/types/messages.js';

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Provider {
  readonly name: string;

  chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;

  listModels?(): Promise<string[]>;
}

export interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}
