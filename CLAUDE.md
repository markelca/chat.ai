# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development mode with hot-reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Run compiled application
pnpm start

# Link globally for system-wide usage
pnpm link --global
```

## Architecture Overview

### Provider Pattern
The application uses a pluggable provider system for AI chat backends. All providers must implement the `Provider` interface from `src/providers/base.ts`:
- `chat()` - Returns an async generator for streaming responses
- `listModels()` - Optional method to list available models

Current providers:
- `OllamaProvider` - Local AI models via Ollama API
- `OpenRouterProvider` - Cloud AI models via OpenRouter API

To add a new provider, implement the `Provider` interface and register it in the switch statement in `src/index.ts:21-32`.

### Message History Storage Abstraction
The application abstracts message history storage through the `MessageHistory` abstract class (`src/storage/MessageHistory.ts`). This allows conversation history to be stored in different backends:

- `InMemoryMessageHistory` - Default implementation, stores messages in memory (lost on process exit)
- `RedisMessageHistory` - Redis-based storage for persistent conversations (skeleton implementation, not yet complete)

The REPL accepts an optional `MessageHistory` instance in its constructor, defaulting to in-memory storage. To use a different storage backend, instantiate the desired `MessageHistory` implementation and pass it to the REPL constructor.

### Configuration System
`ConfigManager` (`src/config/manager.ts`) handles configuration loading with a two-tier priority:
1. Local `./config.json` (checked first)
2. Global `~/.config/ai-chat/config.json` (fallback)

Creates default config automatically on first run. Each provider section requires `baseUrl`, `model`, and optionally `apiKey`.

### REPL Interface
The `REPL` class (`src/cli/repl.ts`) manages the interactive chat loop:
- Uses Node.js `readline/promises` for user input
- Streams responses token-by-token using async generators
- Maintains conversation history via injected `MessageHistory` instance
- Handles special commands (`/quit`, `/clear`, `/help`)

The provider's `chat()` method receives the full message history on each request, allowing the AI to maintain context throughout the conversation.

## Key Design Decisions

- **ESM modules**: Project uses `"type": "module"` in package.json
- **Streaming-first**: All provider implementations must support streaming via async generators
- **CLI-first design**: Built as a terminal application with readline interface, not a web service
- **Storage abstraction**: Message history is decoupled from the REPL, allowing different persistence strategies

## Infrastructure Abstraction Philosophy

This codebase follows a pattern of abstracting infrastructure decisions behind interfaces. When implementing or extending infrastructure-level abstractions, **always ask the user for confirmation and present multiple options** rather than choosing an implementation unilaterally.

### Examples of Infrastructure Decisions Requiring User Input:

1. **Storage Backends**
   - Message history storage: Redis, PostgreSQL, MongoDB, in-memory, filesystem, etc.
   - Session management: Database, Redis, JWT, etc.
   - When implementing: Present options with trade-offs (persistence, performance, complexity, dependencies)

2. **Output Mechanisms**
   - Chat streaming output: stdout (current), WebSocket, Server-Sent Events, HTTP polling, file output
   - Logging: console, file, external service
   - When implementing: Consider the use case and present appropriate options

3. **Input/Interface Layers**
   - User input: readline (current), HTTP API, WebSocket, gRPC
   - Configuration sources: JSON file (current), environment variables, database, remote config service

### Guidance for Implementation:

When working on features that involve infrastructure abstractions:
1. **Identify the abstraction**: Recognize when you're working at the infrastructure level
2. **Present options**: List 2-4 viable implementation options with brief pros/cons
3. **Ask for confirmation**: Use the AskUserQuestion tool to get the user's preference
4. **Design for extensibility**: Follow existing patterns (abstract classes/interfaces) to allow future alternatives
