# AI Chat - Terminal-based AI Chat Application

A simple terminal-based AI chat application that supports multiple providers including Ollama and OpenRouter with streaming response support.

## Features

- 🚀 Simple REPL interface
- 🔄 Streaming responses (display tokens as they arrive)
- 💬 Conversation history within a session
- 🔌 Support for multiple providers (Ollama and OpenRouter)
- ⚙️ JSON-based configuration
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

- **ollama.baseUrl**: The URL of your Ollama instance (default: `http://localhost:11434`)
- **ollama.model**: The Ollama model to use (e.g., `llama2`, `mistral`, `codellama`)
- **openrouter.baseUrl**: The OpenRouter API URL (default: `https://openrouter.ai/api/v1`)
- **openrouter.model**: The OpenRouter model to use (e.g., `anthropic/claude-3.5-sonnet`)
- **openrouter.apiKey**: Your OpenRouter API key (required for OpenRouter)
- **defaults.provider**: Default provider to use (`ollama` or `openrouter`)

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
├── src/
│   ├── providers/
│   │   ├── base.ts          # Provider interface and types
│   │   ├── ollama.ts        # Ollama implementation
│   │   └── openrouter.ts    # OpenRouter implementation
│   ├── config/
│   │   └── manager.ts       # Configuration management
│   ├── cli/
│   │   ├── repl.ts          # REPL implementation
│   │   └── parser.ts        # CLI argument parsing
│   └── index.ts             # Application entry point
├── dist/                    # Compiled JavaScript (after build)
├── config.example.json      # Example configuration
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
