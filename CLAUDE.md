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

**IMPORTANT - Token Conservation:**
Do NOT run `pnpm install`, `pnpm build`, or other long-running build commands automatically. These commands consume many tokens due to verbose output. Instead:
1. After modifying `package.json` or source files, inform the user which command to run
2. Ask the user to run the command themselves
3. Wait for the user to confirm completion before continuing
4. Only run build/install commands if the user explicitly requests it

Example: "I've added the redis dependency to package.json. Please run `pnpm install` and let me know when it's complete so I can continue."

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
- `RedisMessageHistory` - Redis-based storage for persistent conversations using Redis Lists

**Redis Implementation Details:**
- Uses node-redis (v4+) client library
- Storage pattern: Redis List with key `session:{sessionName}:messages`
- Messages are JSON-serialized before storage
- Commands: RPUSH (add), LRANGE (retrieve), DEL (clear), EXPIRE (TTL)
- Connection is lazy-loaded on first operation
- Automatic connection management with proper error handling

**Storage Selection:**
Storage backend is selected at application startup in `src/index.ts:42-70`:
1. Check if Redis is enabled in config (or via `REDIS_ENABLED` env var)
2. If enabled, attempt to connect to Redis
3. On connection failure, gracefully fallback to in-memory storage with warning
4. If disabled, use in-memory storage

The REPL is initialized with the selected storage backend and uses it transparently throughout the session.

### Configuration System
`ConfigManager` (`src/config/manager.ts`) handles configuration loading with a two-tier priority:
1. Local `./config.json` (checked first)
2. Global `~/.config/ai-chat/config.json` (fallback)

Creates default config automatically on first run. Each provider section requires `baseUrl`, `model`, and optionally `apiKey`.

**Redis Configuration:**
The config now includes an optional `redis` section with connection details. The `getRedisConfig()` method:
- Returns the Redis config with environment variable overrides applied
- Supports all Redis connection parameters (host, port, password, username, database)
- Supports session naming and TTL configuration
- Environment variables take precedence over config file values

### Output/View Abstraction
The application abstracts output/display handling through the `OutputView` abstract class (`src/output/OutputView.ts`). This allows output to be directed to different destinations:

- `StdoutView` - Default implementation, outputs to terminal with colors using chalk
- Future: `SSEView` - Server-Sent Events for web interfaces
- Future: `FileView` - Write conversation logs to files

**OutputView Methods:**
The abstraction provides fine-grained methods for different output types:
- `displayWelcome()` - Startup message
- `displayHelp()` / `displayCommandHelp()` - Help text
- `displayPrompt()` - Prompt labels ("Assistant:")
- `streamChunk()` - Individual token streaming (real-time)
- `streamComplete()` - Newlines/spacing after streaming
- `displayError()` / `displayWarning()` / `displayInfo()` - Status messages
- `displaySystemMessage()` - App state changes (cleared, goodbye)

**Output Selection:**
The output backend is created in `src/index.ts:44` and passed to the REPL. Currently defaults to `StdoutView`. To use a different output backend, instantiate the desired `OutputView` implementation and pass it to the REPL constructor.

### REPL Interface
The `REPL` class (`src/cli/repl.ts`) manages the interactive chat loop:
- Uses Node.js `readline/promises` for user input
- Streams responses token-by-token using async generators
- Maintains conversation history via injected `MessageHistory` instance
- Outputs via injected `OutputView` instance
- Handles special commands (`/quit`, `/clear`, `/help`)

The provider's `chat()` method receives the full message history on each request, allowing the AI to maintain context throughout the conversation.

## Key Design Decisions

- **ESM modules**: Project uses `"type": "module"` in package.json
- **Streaming-first**: All provider implementations must support streaming via async generators
- **CLI-first design**: Built as a terminal application with readline interface, not a web service
- **Storage abstraction**: Message history is decoupled from the REPL, allowing different persistence strategies
- **Optional dependencies**: Redis is completely optional - app works without it, automatically falling back to in-memory storage

## Docker Development Workflow

The project uses Docker only for infrastructure dependencies (Redis), not for the application itself:

```bash
# Start Redis container
docker compose up -d

# Run application on host with Redis
REDIS_ENABLED=true pnpm dev

# Stop Redis when done
docker compose down
```

This approach keeps the development workflow simple while providing optional persistence. The `docker-compose.yml` configures:
- Redis 7 Alpine image (lightweight)
- Port 6379 exposed to host
- Named volume `redis-data` for persistence
- AOF (Append Only File) enabled for durability
- Health checks for connection verification
- No automatic restart (manual start/stop)

## Infrastructure Abstraction Philosophy

This codebase follows a pattern of abstracting infrastructure decisions behind interfaces. When implementing or extending infrastructure-level abstractions, **always ask the user for confirmation and present multiple options** rather than choosing an implementation unilaterally.

### Examples of Infrastructure Decisions Requiring User Input:

1. **Storage Backends**
   - Message history storage: Redis, PostgreSQL, MongoDB, in-memory, filesystem, etc.
   - Session management: Database, Redis, JWT, etc.
   - When implementing: Present options with trade-offs (persistence, performance, complexity, dependencies)
   - **Current abstraction**: `MessageHistory` (in-memory, Redis)

2. **Output Mechanisms**
   - Chat streaming output: stdout (current), WebSocket, Server-Sent Events, HTTP polling, file output
   - Logging: console, file, external service
   - When implementing: Consider the use case and present appropriate options
   - **Current abstraction**: `OutputView` (stdout only, designed for SSE and File)

3. **Input/Interface Layers**
   - User input: readline (current), HTTP API, WebSocket, gRPC
   - Configuration sources: JSON file (current), environment variables, database, remote config service

### Guidance for Implementation:

When working on features that involve infrastructure abstractions:
1. **Identify the abstraction**: Recognize when you're working at the infrastructure level
2. **Present options**: List 2-4 viable implementation options with brief pros/cons
3. **Ask for confirmation**: Use the AskUserQuestion tool to get the user's preference
4. **Design for extensibility**: Follow existing patterns (abstract classes/interfaces) to allow future alternatives
