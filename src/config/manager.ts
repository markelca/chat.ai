import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { ProviderConfig } from '../providers/base.js';

export interface RedisConfig {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  username?: string;
  database?: number;
  sessionName: string;
  ttl?: number;
}

export interface Config {
  ollama: ProviderConfig;
  openrouter: ProviderConfig;
  redis?: RedisConfig;
  defaults: {
    provider: 'ollama' | 'openrouter';
  };
}

const DEFAULT_CONFIG: Config = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
    apiKey: '',
  },
  redis: {
    enabled: false,
    host: 'localhost',
    port: 6379,
    sessionName: 'default-session',
  },
  defaults: {
    provider: 'ollama',
  },
};

export class ConfigManager {
  private configPath: string;
  private config: Config | null = null;

  constructor() {
    const localConfig = './config.json';
    const globalConfigDir = join(homedir(), '.config', 'ai-chat');
    const globalConfig = join(globalConfigDir, 'config.json');

    this.configPath = existsSync(localConfig) ? localConfig : globalConfig;
  }

  async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    try {
      if (!existsSync(this.configPath)) {
        await this.createDefaultConfig();
      }

      const data = await readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(data);

      this.validateConfig(this.config!);
      return this.config!;
    } catch (error) {
      throw new Error(`Failed to load config from ${this.configPath}: ${error}`);
    }
  }

  private async createDefaultConfig(): Promise<void> {
    const dir = join(this.configPath, '..');

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    console.log(`Created default config at ${this.configPath}`);
    console.log('Please update the configuration file with your API keys if needed.');
  }

  private validateConfig(config: Config): void {
    if (!config.ollama || !config.openrouter || !config.defaults) {
      throw new Error('Invalid config: missing required sections');
    }

    if (!config.ollama.baseUrl || !config.ollama.model) {
      throw new Error('Invalid config: ollama section missing required fields');
    }

    if (!config.openrouter.baseUrl || !config.openrouter.model) {
      throw new Error('Invalid config: openrouter section missing required fields');
    }

    if (!['ollama', 'openrouter'].includes(config.defaults.provider)) {
      throw new Error('Invalid config: defaults.provider must be "ollama" or "openrouter"');
    }
  }

  getProviderConfig(provider: 'ollama' | 'openrouter'): ProviderConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }

    return this.config[provider];
  }

  getDefaultProvider(): 'ollama' | 'openrouter' {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }

    return this.config.defaults.provider;
  }

  getRedisConfig(): RedisConfig | null {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }

    if (!this.config.redis) {
      return null;
    }

    // Apply environment variable overrides
    const redisConfig = { ...this.config.redis };

    if (process.env.REDIS_ENABLED !== undefined) {
      redisConfig.enabled = process.env.REDIS_ENABLED === 'true';
    }
    if (process.env.REDIS_HOST) {
      redisConfig.host = process.env.REDIS_HOST;
    }
    if (process.env.REDIS_PORT) {
      redisConfig.port = parseInt(process.env.REDIS_PORT, 10);
    }
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
    if (process.env.REDIS_USERNAME) {
      redisConfig.username = process.env.REDIS_USERNAME;
    }
    if (process.env.REDIS_DATABASE) {
      redisConfig.database = parseInt(process.env.REDIS_DATABASE, 10);
    }
    if (process.env.REDIS_SESSION_NAME) {
      redisConfig.sessionName = process.env.REDIS_SESSION_NAME;
    }
    if (process.env.REDIS_TTL) {
      redisConfig.ttl = parseInt(process.env.REDIS_TTL, 10);
    }

    return redisConfig;
  }
}
