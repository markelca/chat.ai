import chalk from 'chalk';
import { OutputView } from './OutputView.js';

/**
 * Standard output implementation using console and process.stdout.
 * Uses chalk for colored terminal output.
 */
export class StdoutView extends OutputView {
  displayWelcome(providerName: string): void {
    console.log(chalk.bold.cyan(`\nAI Chat - ${providerName}`));
    this.displayHelp();
  }

  displayHelp(): void {
    console.log(chalk.gray('Type your message and press Enter. Special commands:'));
    console.log(chalk.gray('  /quit or /exit - Exit the chat'));
    console.log(chalk.gray('  /clear - Clear conversation history'));
    console.log(chalk.gray('  /help - Show this help message\n'));
  }

  displayCommandHelp(): void {
    console.log(chalk.gray('\nAvailable commands:'));
    console.log(chalk.gray('  /quit or /exit - Exit the chat'));
    console.log(chalk.gray('  /clear - Clear conversation history'));
    console.log(chalk.gray('  /help - Show this help message\n'));
  }

  displayPrompt(promptText: string): void {
    process.stdout.write(chalk.blue(`${promptText}: `));
  }

  streamChunk(chunk: string): void {
    process.stdout.write(chunk);
  }

  streamComplete(): void {
    process.stdout.write('\n\n');
  }

  displayError(error: string): void {
    console.error(chalk.red(`\n\nError: ${error}\n`));
  }

  displayInfo(message: string): void {
    console.log(message);
  }

  displayWarning(message: string): void {
    console.warn(message);
  }

  displaySystemMessage(message: string): void {
    console.log(chalk.gray(message));
  }
}
