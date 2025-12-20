import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import chalk from 'chalk';
import type { Provider, ChatOptions } from '../providers/base.js';
import { MessageHistory } from '../storage/MessageHistory.js';
import { InMemoryMessageHistory } from '../storage/InMemoryMessageHistory.js';

export class REPL {
  private provider: Provider;
  private messageHistory: MessageHistory;
  private options?: ChatOptions;
  private rl: readline.Interface;

  constructor(provider: Provider, options?: ChatOptions, messageHistory?: MessageHistory) {
    this.provider = provider;
    this.options = options;
    this.messageHistory = messageHistory ?? new InMemoryMessageHistory();
    this.rl = readline.createInterface({ input, output });
  }

  async start(): Promise<void> {
    console.log(chalk.bold.cyan(`\nAI Chat - ${this.provider.name}`));
    console.log(chalk.gray('Type your message and press Enter. Special commands:'));
    console.log(chalk.gray('  /quit or /exit - Exit the chat'));
    console.log(chalk.gray('  /clear - Clear conversation history'));
    console.log(chalk.gray('  /help - Show this help message\n'));

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

        process.stdout.write(chalk.blue('Assistant: '));

        let assistantResponse = '';

        try {
          const messages = await this.messageHistory.getAll();
          for await (const chunk of this.provider.chat(messages, this.options)) {
            process.stdout.write(chunk);
            assistantResponse += chunk;
          }

          process.stdout.write('\n\n');

          await this.messageHistory.add({
            role: 'assistant',
            content: assistantResponse,
          });
        } catch (error) {
          console.error(chalk.red(`\n\nError: ${error}\n`));
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
        console.log(chalk.gray('Goodbye!'));
        this.rl.close();
        process.exit(0);

      case '/clear':
        await this.messageHistory.clear();
        console.log(chalk.gray('Conversation history cleared.\n'));
        return true;

      case '/help':
        console.log(chalk.gray('\nAvailable commands:'));
        console.log(chalk.gray('  /quit or /exit - Exit the chat'));
        console.log(chalk.gray('  /clear - Clear conversation history'));
        console.log(chalk.gray('  /help - Show this help message\n'));
        return true;

      default:
        if (input.startsWith('/')) {
          console.log(chalk.red(`Unknown command: ${input}`));
          console.log(chalk.gray('Type /help for available commands.\n'));
          return true;
        }
        return false;
    }
  }
}
