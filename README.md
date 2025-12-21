# AI Chat - Terminal-based AI Chat Application

A simple terminal-based AI chat application that supports multiple providers including Ollama and OpenRouter with streaming response support.

## Features

- 🚀 Simple REPL interface
- 🔄 Streaming responses (display tokens as they arrive)
- 💬 Conversation history within a session
- 📋 **Session Management** - Create, resume, and navigate between multiple chat sessions
- 🔌 Support for multiple providers (Ollama and OpenRouter)
- 💾 Pluggable storage backends (in-memory or Redis)
- 🖥️ Pluggable output/view layer (stdout, Redis pub/sub, composite)
- 🌐 **Real-time web streaming** - View conversations in a web browser via SSE
- 🎯 **Web UI with session navigation** - Browse all sessions with sidebar navigation
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

# Resume or create a named session
ai-chat --session my-project
ai-chat --session frontend-work

# Combine options
ai-chat -p ollama -m llama2 -s research

# Short options
ai-chat -p ollama -m llama2 -s my-session
```

#### Session Management

The `--session` (or `-s`) flag allows you to create, resume, and manage multiple chat sessions. See the [Session Management guide](https://github.com/markelca/chat.ai/wiki/Session-Management) for detailed information.

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

## Web Streaming

Stream your CLI conversation to a web browser in real-time using Server-Sent Events (SSE).

For setup instructions and configuration details, see the [Web Streaming guide](https://github.com/markelca/chat.ai/wiki/Web-Streaming).
## License

ISC
