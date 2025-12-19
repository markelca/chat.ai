import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { ProviderConfig } from '../providers/base.js';

export interface Config {
  ollama: ProviderConfig;
  openrouter: ProviderConfig;
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
}
