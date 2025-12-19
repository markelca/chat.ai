import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import chalk from 'chalk';
import type { Provider, Message, ChatOptions } from '../providers/base.js';

export class REPL {
  private provider: Provider;
  private conversationHistory: Message[] = [];
  private options?: ChatOptions;
  private rl: readline.Interface;

  constructor(provider: Provider, options?: ChatOptions) {
    this.provider = provider;
    this.options = options;
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

        this.conversationHistory.push({
          role: 'user',
          content: userInput,
        });

        process.stdout.write(chalk.blue('Assistant: '));

        let assistantResponse = '';

        try {
          for await (const chunk of this.provider.chat(this.conversationHistory, this.options)) {
            process.stdout.write(chunk);
            assistantResponse += chunk;
          }

          process.stdout.write('\n\n');

          this.conversationHistory.push({
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
        this.conversationHistory = [];
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
