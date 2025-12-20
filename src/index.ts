#!/usr/bin/env node

import { parseArguments } from "./cli/parser.js";
import { ConfigManager } from "./config/manager.js";
import { OllamaProvider } from "./providers/ollama.js";
import { OpenRouterProvider } from "./providers/openrouter.js";
import { REPL } from "./cli/repl.js";
import type { Provider, ChatOptions } from "./providers/base.js";
import { InMemoryMessageHistory } from "./storage/InMemoryMessageHistory.js";
import { RedisMessageHistory } from "./storage/RedisMessageHistory.js";
import type { MessageHistory } from "./storage/MessageHistory.js";
import { StdoutView } from "./output/StdoutView.js";

async function main() {
  try {
    const cliOptions = parseArguments();
    const configManager = new ConfigManager();
    await configManager.load();

    const providerName =
      cliOptions.provider || configManager.getDefaultProvider();
    const providerConfig = configManager.getProviderConfig(providerName);

    let provider: Provider;

    switch (providerName) {
      case "ollama":
        provider = new OllamaProvider(providerConfig);
        break;

      case "openrouter":
        provider = new OpenRouterProvider(providerConfig);
        break;

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    const chatOptions: ChatOptions = {};
    if (cliOptions.model) {
      chatOptions.model = cliOptions.model;
    }

    // Setup output view
    const view = new StdoutView();

    // Setup message history storage
    let messageHistory: MessageHistory;
    const redisConfig = configManager.getRedisConfig();

    if (redisConfig && redisConfig.enabled) {
      try {
        view.displayInfo("Attempting to connect to Redis...");
        messageHistory = RedisMessageHistory.fromRedisConfig(redisConfig);
        // Test connection by trying to get all messages
        await messageHistory.getAll();
        view.displayInfo("Connected to Redis successfully.\n");
      } catch (error) {
        view.displayWarning(`Warning: Could not connect to Redis: ${error}`);
        view.displayWarning("Falling back to in-memory storage.\n");
        messageHistory = new InMemoryMessageHistory();
      }
    } else {
      messageHistory = new InMemoryMessageHistory();
    }

    const repl = new REPL(provider, chatOptions, messageHistory, view);
    await repl.start();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
