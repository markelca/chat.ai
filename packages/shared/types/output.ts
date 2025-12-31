/**
 * Shared message types for CLI <-> Web communication via Redis pub/sub.
 * Used by both the CLI OutputView and the web app MessageSubscriber.
 */

export type MessageType =
  | 'welcome'
  | 'help'
  | 'commandHelp'
  | 'prompt'
  | 'user'
  | 'chunk'
  | 'complete'
  | 'error'
  | 'info'
  | 'warning'
  | 'system'
  | 'clear';

/**
 * Output message format for serialization.
 * Messages are sent via Redis pub/sub and SSE.
 */
export interface OutputMessage {
  type: MessageType;
  payload: {
    content?: string;
    providerName?: string;
    promptText?: string;
  };
  timestamp: number;
}
