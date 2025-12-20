import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import chalk from 'chalk';
import type { Provider, ChatOptions } from '../providers/base.js';
import { MessageHistory } from '../storage/MessageHistory.js';
import { InMemoryMessageHistory } from '../storage/InMemoryMessageHistory.js';
import { OutputView } from '../output/OutputView.js';
import { StdoutView } from '../output/StdoutView.js';

export class REPL {
  private provider: Provider;
  private messageHistory: MessageHistory;
  private view: OutputView;
  private options?: ChatOptions;
  private rl: readline.Interface;

  constructor(provider: Provider, options?: ChatOptions, messageHistory?: MessageHistory, view?: OutputView) {
    this.provider = provider;
    this.options = options;
    this.messageHistory = messageHistory ?? new InMemoryMessageHistory();
    this.view = view ?? new StdoutView();
    this.rl = readline.createInterface({ input, output });
  }

  async start(): Promise<void> {
    this.view.displayWelcome(this.provider.name);

    while (true) {
      try {
        const userInput = await this.rl.question(chalk.green('You: '));

        if (!userInput.trim()) {
          continue;
        }

        if (await this.handleCommand(userInput.trim())) {
          continue;
        }

        await this.messageHistory.add({
          role: 'user',
          content: userInput,
        });

        this.view.displayPrompt('Assistant');

        let assistantResponse = '';

        try {
          const messages = await this.messageHistory.getAll();
          for await (const chunk of this.provider.chat(messages, this.options)) {
            this.view.streamChunk(chunk);
            assistantResponse += chunk;
          }

          this.view.streamComplete();

          await this.messageHistory.add({
            role: 'assistant',
            content: assistantResponse,
          });
        } catch (error) {
          this.view.displayError(String(error));
        }
      } catch (error) {
        if ((error as any).code === 'ERR_USE_AFTER_CLOSE') {
          break;
        }
        throw error;
      }
    }
  }

  private async handleCommand(input: string): Promise<boolean> {
    const command = input.toLowerCase();

    switch (command) {
      case '/quit':
      case '/exit':
        this.view.displaySystemMessage('Goodbye!');
        this.rl.close();
        process.exit(0);

      case '/clear':
        await this.messageHistory.clear();
        this.view.displaySystemMessage('Conversation history cleared.\n');
        return true;

      case '/help':
        this.view.displayCommandHelp();
        return true;

      default:
        if (input.startsWith('/')) {
          this.view.displayError(`Unknown command: ${input}`);
          this.view.displaySystemMessage('Type /help for available commands.\n');
          return true;
        }
        return false;
    }
  }
}
