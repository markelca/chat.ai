/**
 * Abstract interface for output/display handling.
 * Implementations can output to stdout, SSE, files, or other backends.
 */
export abstract class OutputView {
  /**
   * Display welcome message when the application starts.
   * @param providerName The name of the AI provider being used
   */
  abstract displayWelcome(providerName: string): void;

  /**
   * Display help text showing available commands.
   */
  abstract displayHelp(): void;

  /**
   * Display command help (for /help command).
   */
  abstract displayCommandHelp(): void;

  /**
   * Display a prompt label (e.g., "Assistant:").
   * @param promptText The prompt text to display
   */
  abstract displayPrompt(promptText: string): void;

  /**
   * Stream a single chunk of text (token-by-token streaming).
   * @param chunk The text chunk to display
   */
  abstract streamChunk(chunk: string): void;

  /**
   * Called when streaming is complete (add spacing/newlines).
   */
  abstract streamComplete(): void;

  /**
   * Display an error message.
   * @param error The error message to display
   */
  abstract displayError(error: string): void;

  /**
   * Display an informational message.
   * @param message The message to display
   */
  abstract displayInfo(message: string): void;

  /**
   * Display a warning message.
   * @param message The warning message to display
   */
  abstract displayWarning(message: string): void;

  /**
   * Display a system message (e.g., "Conversation history cleared", "Goodbye").
   * @param message The system message to display
   */
  abstract displaySystemMessage(message: string): void;
}
