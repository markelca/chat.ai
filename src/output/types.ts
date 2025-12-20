/**
 * Message types for output/view communication.
 * Used for Redis pub/sub and SSE streaming.
 */
export type MessageType =
  | 'welcome'
  | 'help'
  | 'prompt'
  | 'chunk'
  | 'complete'
  | 'error'
  | 'info'
  | 'warning'
  | 'system'
  | 'commandHelp';

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
