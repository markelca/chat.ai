# AI Chat - Terminal-based AI Chat Application

A simple terminal-based AI chat application that supports multiple providers including Ollama and OpenRouter with streaming response support.

## Features

- 🚀 Simple REPL interface
- 🔄 Streaming responses (display tokens as they arrive)
- 💬 Conversation history within a session
- 🔌 Support for multiple providers (Ollama and OpenRouter)
- 💾 Pluggable storage backends (in-memory or Redis)
- 🖥️ Pluggable output/view layer (stdout, Redis pub/sub, composite)
- 🌐 **Real-time web streaming** - View conversations in a web browser via SSE
- ⚙️ JSON-based configuration
- 🐳 Docker support for Redis and web app
- 🎨 Colored terminal output

## Installation

### Prerequisites

- Node.js 18+ (for native fetch support)
- pnpm package manager

### Setup

1. Clone the repository or download the source code

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm build
```

## Docker Setup

The project includes Docker support for running Redis and the web streaming application.

### Starting Services with Docker

```bash
# Start all services (Redis + Web app)
docker compose up -d

# Start only Redis
docker compose up -d redis

# Check services are running
docker compose ps

# View logs
docker compose logs -f         # All services
docker compose logs -f redis   # Redis only
docker compose logs -f web     # Web app only

# Stop all services
docker compose down
```

The Redis container will:
- Run on port 6379
- Persist data in a Docker volume named `redis-data`
- Use AOF (Append Only File) persistence for durability

The web container will:
- Run on port 3000
- Connect to Redis for message streaming
- Provide SSE endpoint at `/api/stream`

## Configuration

The application will create a default config file on first run at one of these locations:
- `./config.json` (local directory, checked first)
- `~/.config/ai-chat/config.json` (global config)

You can also copy `config.example.json` to `config.json` and modify it:

```json
{
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "llama2"
  },
  "openrouter": {
    "baseUrl": "https://openrouter.ai/api/v1",
    "model": "anthropic/claude-3.5-sonnet",
    "apiKey": "sk-or-v1-YOUR_API_KEY_HERE"
  },
  "defaults": {
    "provider": "ollama"
  }
}
```

### Configuration Options

#### Provider Settings
- **ollama.baseUrl**: The URL of your Ollama instance (default: `http://localhost:11434`)
- **ollama.model**: The Ollama model to use (e.g., `llama2`, `mistral`, `codellama`)
- **openrouter.baseUrl**: The OpenRouter API URL (default: `https://openrouter.ai/api/v1`)
- **openrouter.model**: The OpenRouter model to use (e.g., `anthropic/claude-3.5-sonnet`)
- **openrouter.apiKey**: Your OpenRouter API key (required for OpenRouter)
- **defaults.provider**: Default provider to use (`ollama` or `openrouter`)

#### Redis Storage Settings
- **redis.enabled**: Enable Redis for persistent conversation history (default: `false`)
- **redis.host**: Redis server hostname (default: `localhost`)
- **redis.port**: Redis server port (default: `6379`)
- **redis.password**: Redis password (optional)
- **redis.username**: Redis username for ACL (optional, Redis 6+)
- **redis.database**: Redis database number 0-15 (default: `0`)
- **redis.sessionName**: Unique name for the conversation session (default: `default-session`)
  - If set to `default-session` and no `REDIS_SESSION_NAME` env var, a unique session ID is auto-generated
  - To use named sessions, either set a custom value in config or use `REDIS_SESSION_NAME` env var
- **redis.ttl**: Time-to-live in seconds for conversation data (optional, no expiration if not set)

#### Environment Variable Overrides
All Redis settings can be overridden using environment variables:
- `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `REDIS_USERNAME`, `REDIS_DATABASE`, `REDIS_SESSION_NAME`, `REDIS_TTL`

See `.env.example` for a complete list with descriptions.

## Usage

### Development Mode

Run the application in development mode with hot-reload:

```bash
pnpm dev
```

### Production Mode

After building, run the compiled application:

```bash
pnpm start
```

Or use it globally after linking:

```bash
pnpm link --global
ai-chat
```

### Command Line Options

```bash
# Use a specific provider
ai-chat --provider ollama
ai-chat --provider openrouter

# Use a specific model (overrides config)
ai-chat --provider ollama --model codellama
ai-chat --provider openrouter --model anthropic/claude-3-opus

# Short options
ai-chat -p ollama -m llama2
```

### REPL Commands

Once in the chat:

- Type your message and press Enter to send
- `/quit` or `/exit` - Exit the application
- `/clear` - Clear conversation history
- `/help` - Show available commands

## Examples

### Using Ollama

Make sure Ollama is running locally:

```bash
ollama serve
```

Then start the chat:

```bash
ai-chat --provider ollama
```

### Using OpenRouter

Make sure you have set your API key in the config file, then:

```bash
ai-chat --provider openrouter
```

### Using Redis for Persistent Conversations

1. Start Redis using Docker:
```bash
docker compose up -d
```

2. Enable Redis in your `config.json`:
```json
{
  "redis": {
    "enabled": true,
    "host": "localhost",
    "port": 6379,
    "sessionName": "my-conversation"
  }
}
```

3. Run the application:
```bash
pnpm dev
```

Your conversation history will now persist in Redis. Stop and restart the application to see your history restored.

Alternatively, use environment variables without modifying config:
```bash
REDIS_ENABLED=true REDIS_SESSION_NAME=my-session pnpm dev
```

### Web Streaming (Real-time Browser View)

Stream your CLI conversation to a web browser in real-time using Server-Sent Events (SSE).

#### Architecture

The web streaming feature uses a dual-output architecture:
- **CLI app** broadcasts output to both terminal (stdout) AND Redis pub/sub
- **Web app** subscribes to Redis and streams to the browser via SSE
- Messages flow: CLI → Redis pub/sub → Web app → Browser (SSE)

#### Setup and Usage

1. Enable web streaming in your `config.json`:
```json
{
  "webStream": {
    "enabled": true,
    "redisChannel": "ai-chat:stream",
    "redisHost": "localhost",
    "redisPort": 6379
  }
}
```

2. Start Redis and the web app using Docker:
```bash
docker compose up -d
```

This starts:
- Redis server on port 6379
- Next.js web app on port 3000

3. Run the CLI app with web streaming enabled:
```bash
# Using config.json
pnpm dev

# Or using environment variables
WEB_STREAM_ENABLED=true pnpm dev
```

4. Open your browser to `http://localhost:3000` to view the live stream

5. Start chatting in the terminal - you'll see messages appear in real-time in the browser!

#### Web Streaming Configuration

**CLI App (.env or config.json):**
- `WEB_STREAM_ENABLED` - Enable/disable web streaming (default: `false`)
- `WEB_STREAM_REDIS_CHANNEL` - Redis pub/sub channel name (default: `ai-chat:stream`)
- `WEB_STREAM_REDIS_HOST` - Redis host (default: `localhost`)
- `WEB_STREAM_REDIS_PORT` - Redis port (default: `6379`)
- `WEB_STREAM_REDIS_PASSWORD` - Redis password (optional)

**Web App (web/.env):**
- `REDIS_HOST` - Redis server hostname
- `REDIS_PORT` - Redis server port
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_CHANNEL` - Redis pub/sub channel (must match CLI's `WEB_STREAM_REDIS_CHANNEL`)

See `web/README.md` for more details on the web application.

#### Features

- **Read-only display**: Web UI is view-only (no input), terminal is for interaction
- **Real-time streaming**: See AI responses as they're generated, character by character
- **Connection status**: Visual indicator shows connection state
- **Message types**: Different styling for prompts, responses, errors, info, warnings
- **Auto-scroll**: Messages automatically scroll as they arrive
- **Reconnection**: Automatically reconnects if connection is lost

#### Architecture Details

The web streaming implementation follows the project's abstraction philosophy:
- **MessageSubscriber** abstract class allows different message brokers (currently Redis)
- **CompositeView** pattern broadcasts to multiple outputs simultaneously
- **OutputView** async interface supports network I/O for Redis publishing

See `CLAUDE.md` for detailed architecture documentation.

## Providers

### Ollama

Ollama is a local AI model runner. Install it from [ollama.ai](https://ollama.ai/).

Available models can be found at [ollama.ai/library](https://ollama.ai/library).

### OpenRouter

OpenRouter provides access to various AI models through a unified API. Get your API key from [openrouter.ai](https://openrouter.ai/).

Available models can be found at [openrouter.ai/models](https://openrouter.ai/models).

## Project Structure

```
/
├── src/                     # CLI Application
│   ├── providers/
│   │   ├── base.ts          # Provider interface and types
│   │   ├── ollama.ts        # Ollama implementation
│   │   └── openrouter.ts    # OpenRouter implementation
│   ├── storage/
│   │   ├── MessageHistory.ts          # Abstract storage interface
│   │   ├── InMemoryMessageHistory.ts  # In-memory implementation
│   │   └── RedisMessageHistory.ts     # Redis implementation
│   ├── output/
│   │   ├── OutputView.ts          # Abstract output interface
│   │   ├── StdoutView.ts          # Terminal output implementation
│   │   ├── RedisPublisherView.ts  # Redis pub/sub output
│   │   ├── CompositeView.ts       # Composite pattern for dual output
│   │   └── types.ts               # Message types for pub/sub
│   ├── config/
│   │   └── manager.ts       # Configuration management
│   ├── cli/
│   │   ├── repl.ts          # REPL implementation
│   │   └── parser.ts        # CLI argument parsing
│   └── index.ts             # Application entry point
├── web/                     # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/stream/  # SSE endpoint
│   │   │   ├── layout.tsx   # Root layout
│   │   │   ├── page.tsx     # Main page
│   │   │   └── globals.css  # Global styles
│   │   ├── components/
│   │   │   └── ChatDisplay.tsx  # Chat UI component
│   │   ├── lib/
│   │   │   ├── MessageSubscriber.ts      # Abstract subscriber
│   │   │   ├── RedisMessageSubscriber.ts # Redis implementation
│   │   │   └── createSubscriber.ts       # Factory function
│   │   └── types/
│   │       └── messages.ts  # Shared message types
│   ├── Dockerfile           # Web app Docker build
│   ├── docker-compose.yml   # Standalone web + Redis
│   └── README.md            # Web app documentation
├── dist/                    # Compiled JavaScript (after build)
├── docker-compose.yml       # Combined Redis + Web setup
├── .env.example             # Environment variable examples
├── config.example.json      # Example configuration
├── CLAUDE.md                # Project guidance for Claude Code
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Scripts

- `pnpm dev` - Run in development mode with tsx
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run compiled application

### Adding a New Provider

1. Create a new file in `src/providers/` (e.g., `newprovider.ts`)
2. Implement the `Provider` interface from `base.ts`
3. Add configuration in `src/config/manager.ts`
4. Update the provider switch in `src/index.ts`

## License

ISC
