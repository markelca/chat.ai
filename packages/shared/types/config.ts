/**
 * Redis configuration options used across packages.
 */
export interface RedisConfig {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  username?: string;
  database?: number;
  sessionName?: string;
  ttl?: number;
}
