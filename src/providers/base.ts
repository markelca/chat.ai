export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
