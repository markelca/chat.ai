/**
 * Shared message types for CLI <-> Web communication via Redis pub/sub
 * These types match the OutputMessage types in the CLI app
 */

export type MessageType =
  | 'welcome'
  | 'help'
  | 'commandHelp'
  | 'prompt'
  | 'chunk'
  | 'complete'
  | 'error'
  | 'info'
  | 'warning'
  | 'system';

export interface OutputMessage {
  type: MessageType;
  payload: {
    content?: string;
    providerName?: string;
    promptText?: string;
  };
  timestamp: number;
}
