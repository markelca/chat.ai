import type { Provider, Message, ChatOptions, ProviderConfig } from './base.js';

interface OpenRouterMessage {
  role: string;
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

export class OpenRouterProvider implements Provider {
  readonly name = 'openrouter';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('OpenRouter requires an API key. Please set it in the config file.');
    }
  }

  async *chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || this.config.model;
    const url = `${this.config.baseUrl}/chat/completions`;

    const requestBody: OpenRouterRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    if (options?.maxTokens !== undefined) {
      requestBody.max_tokens = options.maxTokens;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://github.com/ai-chat-terminal',
          'X-Title': 'AI Chat Terminal',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() && line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace(/^data: /, '').trim();

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed: OpenRouterStreamChunk = JSON.parse(data);

            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }

            if (parsed.choices?.[0]?.finish_reason) {
              return;
            }
          } catch (error) {
            console.error('Failed to parse OpenRouter response:', error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to connect to OpenRouter: ${error}`);
    }
  }
}
