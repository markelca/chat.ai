import chalk from "chalk";
import { OutputView } from "./OutputView.js";

/**
 * Standard output implementation using console and process.stdout.
 * Uses chalk for colored terminal output.
 *
 * Methods are async for interface compatibility but execute synchronously internally.
 */
export class StdoutView extends OutputView {
  async displayWelcome(providerName: string): Promise<void> {
    console.log(chalk.bold.cyan(`\nAI Chat - ${providerName}`));
    await this.displayHelp();
  }

  async displayHelp(): Promise<void> {
    console.log(
      chalk.gray("Type your message and press Enter. Special commands:"),
    );
    console.log(chalk.gray("  /quit or /exit - Exit the chat"));
    console.log(chalk.gray("  /clear - Clear conversation history"));
    console.log(chalk.gray("  /help - Show this help message\n"));
  }

  async displayCommandHelp(): Promise<void> {
    console.log(chalk.gray("\nAvailable commands:"));
    console.log(chalk.gray("  /quit or /exit - Exit the chat"));
    console.log(chalk.gray("  /clear - Clear conversation history"));
    console.log(chalk.gray("  /help - Show this help message\n"));
  }

  async displayPrompt(promptText: string): Promise<void> {
    process.stdout.write(chalk.blue(`${promptText}: `));
  }

  async displayUserMessage(_message: string): Promise<void> {
    // Not neccessary, since it's already in the readline
    // and it would duplicate it
  }

  async streamChunk(chunk: string): Promise<void> {
    process.stdout.write(chunk);
  }

  async streamComplete(): Promise<void> {
    process.stdout.write("\n\n");
  }

  async displayError(error: string): Promise<void> {
    console.error(chalk.red(`\n\nError: ${error}\n`));
  }

  async displayInfo(message: string): Promise<void> {
    console.log(message);
  }

  async displayWarning(message: string): Promise<void> {
    console.warn(message);
  }

  async displaySystemMessage(message: string): Promise<void> {
    console.log(chalk.gray(message));
  }

  async displayClear(): Promise<void> {
    // No-op for stdout - the clear message is already displayed via displaySystemMessage
  }
}
