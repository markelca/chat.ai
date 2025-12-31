import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import chalk from "chalk";
import type { Provider, ChatOptions } from "../providers/base";
import { MessageHistory } from "@ai-chat/shared/storage/MessageHistory";
import { InMemoryMessageHistory } from "@ai-chat/shared/storage/InMemoryMessageHistory";
import { SessionStore } from "@ai-chat/shared/storage/SessionStore";
import { OutputView } from "../output/OutputView";
import { StdoutView } from "../output/StdoutView";

export class REPL {
  private provider: Provider;
  private messageHistory: MessageHistory;
  private view: OutputView;
  private options?: ChatOptions;
  private rl: readline.Interface;
  private sessionName?: string;
  private sessionStore: SessionStore | null;

  constructor(
    provider: Provider,
    options?: ChatOptions,
    messageHistory?: MessageHistory,
    view?: OutputView,
    sessionName?: string,
    sessionStore?: SessionStore | null,
  ) {
    this.provider = provider;
    this.options = options;
    this.messageHistory = messageHistory ?? new InMemoryMessageHistory();
    this.view = view ?? new StdoutView();
    this.sessionName = sessionName;
    this.sessionStore = sessionStore ?? null;
    this.rl = readline.createInterface({ input, output });
  }

  async start(): Promise<void> {
    await this.view.displayWelcome(this.provider.name);

    while (true) {
      try {
        const userInput = await this.rl.question(chalk.green("You: "));

        if (!userInput.trim()) {
          continue;
        }

        if (await this.handleCommand(userInput.trim())) {
          continue;
        }

        await this.messageHistory.add({
          role: "user",
          content: userInput,
        });

        // Update session metadata
        if (this.sessionStore && this.sessionName) {
          await this.sessionStore.update(this.sessionName, {
            lastMessage: Date.now(),
          });
        }

        await this.view.displayUserMessage(userInput);

        await this.view.displayPrompt("Assistant");

        let assistantResponse = "";

        try {
          const messages = await this.messageHistory.getAll();
          for await (const chunk of this.provider.chat(
            messages,
            this.options,
          )) {
            await this.view.streamChunk(chunk);
            assistantResponse += chunk;
          }

          await this.view.streamComplete();

          await this.messageHistory.add({
            role: "assistant",
            content: assistantResponse,
          });

          // Update session metadata
          if (this.sessionStore && this.sessionName) {
            await this.sessionStore.update(this.sessionName, {
              lastMessage: Date.now(),
            });
          }
        } catch (error) {
          await this.view.displayError(String(error));
        }
      } catch (error) {
        if ((error as any).code === "ERR_USE_AFTER_CLOSE") {
          break;
        }
        throw error;
      }
    }
  }

  private async handleCommand(input: string): Promise<boolean> {
    const command = input.toLowerCase();

    switch (command) {
      case "/quit":
      case "/exit":
        await this.view.displaySystemMessage("Goodbye!");
        this.rl.close();
        process.exit(0);

      case "/clear":
        await this.messageHistory.clear();

        // Reset session metadata
        if (this.sessionStore && this.sessionName) {
          await this.sessionStore.reset(this.sessionName);
        }

        // Notify all views (including web) that history was cleared
        await this.view.displayClear();
        await this.view.displaySystemMessage("Conversation history cleared.\n");
        return true;

      case "/help":
        await this.view.displayCommandHelp();
        return true;

      default:
        if (input.startsWith("/")) {
          await this.view.displayError(`Unknown command: ${input}`);
          await this.view.displaySystemMessage(
            "Type /help for available commands.\n",
          );
          return true;
        }
        return false;
    }
  }
}
