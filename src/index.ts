#!/usr/bin/env node

import { parseArguments } from "./cli/parser.js";
import { ConfigManager } from "./config/manager.js";
import { OllamaProvider } from "./providers/ollama.js";
import { OpenRouterProvider } from "./providers/openrouter.js";
import { REPL } from "./cli/repl.js";
import type { Provider, ChatOptions } from "./providers/base.js";
import { InMemoryMessageHistory } from "../shared/storage/InMemoryMessageHistory.js";
import { RedisMessageHistory } from "../shared/storage/RedisMessageHistory.js";
import type { MessageHistory } from "../shared/storage/MessageHistory.js";
import { RedisSessionStore } from "../shared/storage/RedisSessionStore.js";
import type { SessionStore } from "../shared/storage/SessionStore.js";
import {
  StdoutView,
  RedisPublisherView,
  CompositeView,
} from "./output/index.js";
import type { OutputView } from "./output/OutputView.js";

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
    const views: OutputView[] = [new StdoutView()];

    // Get Redis config for session name (needed for web streaming)
    const redisConfig = configManager.getRedisConfig();
    const sessionName = redisConfig?.sessionName;

    // Add Redis publisher if web streaming is enabled
    const webStreamConfig = configManager.getWebStreamConfig();
    if (webStreamConfig && webStreamConfig.enabled) {
      views.push(RedisPublisherView.fromWebStreamingConfig(webStreamConfig, sessionName));
    }

    const view = new CompositeView(views);

    // Setup message history storage and session store
    let messageHistory: MessageHistory;
    let sessionStore: SessionStore | null = null;

    if (redisConfig && redisConfig.enabled) {
      try {
        await view.displayInfo("Attempting to connect to Redis...");
        messageHistory = RedisMessageHistory.fromRedisConfig(redisConfig);
        // Test connection by trying to get all messages
        await messageHistory.getAll();

        // Create session store for metadata
        sessionStore = RedisSessionStore.fromRedisConfig(redisConfig);

        await view.displayInfo("Connected to Redis successfully.\n");
      } catch (error) {
        await view.displayWarning(
          `Warning: Could not connect to Redis: ${error}`,
        );
        await view.displayWarning("Falling back to in-memory storage.\n");
        messageHistory = new InMemoryMessageHistory();
        sessionStore = null;
      }
    } else {
      messageHistory = new InMemoryMessageHistory();
    }

    const repl = new REPL(provider, chatOptions, messageHistory, view, sessionName, sessionStore);
    await repl.start();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
