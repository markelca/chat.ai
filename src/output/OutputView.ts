/**
 * Abstract interface for output/display handling.
 * Implementations can output to stdout, SSE, files, or other backends.
 *
 * All methods are async to support network I/O and other async operations.
 */
export abstract class OutputView {
  /**
   * Display welcome message when the application starts.
   * @param providerName The name of the AI provider being used
   */
  abstract displayWelcome(providerName: string): Promise<void>;

  /**
   * Display help text showing available commands.
   */
  abstract displayHelp(): Promise<void>;

  /**
   * Display command help (for /help command).
   */
  abstract displayCommandHelp(): Promise<void>;

  /**
   * Display a prompt label (e.g., "Assistant:").
   * @param promptText The prompt text to display
   */
  abstract displayPrompt(promptText: string): Promise<void>;

  /**
   * Display a user message.
   * @param message The user's message
   */
  abstract displayUserMessage(message: string): Promise<void>;

  /**
   * Stream a single chunk of text (token-by-token streaming).
   * @param chunk The text chunk to display
   */
  abstract streamChunk(chunk: string): Promise<void>;

  /**
   * Called when streaming is complete (add spacing/newlines).
   */
  abstract streamComplete(): Promise<void>;

  /**
   * Display an error message.
   * @param error The error message to display
   */
  abstract displayError(error: string): Promise<void>;

  /**
   * Display an informational message.
   * @param message The message to display
   */
  abstract displayInfo(message: string): Promise<void>;

  /**
   * Display a warning message.
   * @param message The warning message to display
   */
  abstract displayWarning(message: string): Promise<void>;

  /**
   * Display a system message (e.g., "Conversation history cleared", "Goodbye").
   * @param message The system message to display
   */
  abstract displaySystemMessage(message: string): Promise<void>;

  /**
   * Signal that the conversation history has been cleared.
   * This allows web clients to reset their display.
   */
  abstract displayClear(): Promise<void>;
}
