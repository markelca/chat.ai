export interface SessionMetadata {
  /** Unique session identifier */
  name: string;

  /** Unix timestamp of last message */
  lastMessage: number;

  /** Total number of messages in session */
  messageCount: number;

  /** Unix timestamp when session was created */
  createdAt: number;

  /** Optional human-readable title (future: auto-generated from first message) */
  title?: string;
}
