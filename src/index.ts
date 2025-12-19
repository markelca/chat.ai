#!/usr/bin/env node

import { parseArguments } from './cli/parser.js';
import { ConfigManager } from './config/manager.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { REPL } from './cli/repl.js';
import type { Provider, ChatOptions } from './providers/base.js';

async function main() {
  try {
    const cliOptions = parseArguments();
    const configManager = new ConfigManager();
    const config = await configManager.load();

    const providerName = cliOptions.provider || configManager.getDefaultProvider();
    const providerConfig = configManager.getProviderConfig(providerName);

    let provider: Provider;

    switch (providerName) {
      case 'ollama':
        provider = new OllamaProvider(providerConfig);
        break;

      case 'openrouter':
        provider = new OpenRouterProvider(providerConfig);
        break;

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    const chatOptions: ChatOptions = {};
    if (cliOptions.model) {
      chatOptions.model = cliOptions.model;
    }

    const repl = new REPL(provider, chatOptions);
    await repl.start();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
