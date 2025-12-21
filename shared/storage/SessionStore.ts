import { SessionMetadata } from '../types/sessions.js';

/**
 * Abstract class for managing chat session metadata.
 * Implementations handle listing, retrieving, and updating session information.
 */
export abstract class SessionStore {
  /**
   * List all available sessions, sorted by most recent activity.
   */
  abstract list(): Promise<SessionMetadata[]>;

  /**
   * Get metadata for a specific session.
   * Returns null if session doesn't exist.
   */
  abstract get(sessionName: string): Promise<SessionMetadata | null>;

  /**
   * Update session metadata (called when messages are added).
   */
  abstract update(sessionName: string, metadata: Partial<SessionMetadata>): Promise<void>;

  /**
   * Delete a session and its metadata.
   */
  abstract delete(sessionName: string): Promise<void>;
}
