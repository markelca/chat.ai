import type { Provider, Message, ChatOptions, ProviderConfig } from './base.js';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
}

interface OllamaStreamResponse {
  message?: {
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements Provider {
  readonly name = 'ollama';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async *chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || this.config.model;
    const url = `${this.config.baseUrl}/api/chat`;

    const requestBody: OllamaRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (ending with \n)
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          try {
            const data: OllamaStreamResponse = JSON.parse(line);

            if (data.message?.content) {
              yield data.message.content;
            }

            if (data.done) {
              return;
            }
          } catch (error) {
            console.error('Failed to parse Ollama response:', error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to connect to Ollama: ${error}`);
    }
  }

  async listModels(): Promise<string[]> {
    const url = `${this.config.baseUrl}/api/tags`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      return data.models?.map((m) => m.name) || [];
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error}`);
    }
  }
}
