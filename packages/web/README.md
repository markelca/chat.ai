# AI Chat Web Streaming UI

A Next.js web application that displays real-time AI chat conversations from the CLI app via Server-Sent Events (SSE).

## Features

- 🌐 Real-time streaming of CLI conversations to browser
- 🔄 Server-Sent Events (SSE) for low-latency updates
- 🎨 Color-coded message types (prompts, responses, errors, warnings)
- 📡 Connection status indicator
- 🔄 Automatic reconnection on disconnect
- 📜 Auto-scrolling message display
- 🌙 Dark mode support
- 📱 Responsive design with Tailwind CSS

## Architecture

The web app subscribes to a Redis pub/sub channel where the CLI app publishes conversation messages. Messages are streamed to the browser via SSE.

**Message Flow:**
```
CLI App → Redis Pub/Sub → MessageSubscriber → SSE Endpoint → Browser (EventSource)
```

**Key Components:**

1. **MessageSubscriber** (`src/lib/MessageSubscriber.ts`)
   - Abstract class for message broker subscriptions
   - Allows swapping Redis for other brokers (RabbitMQ, Kafka, etc.)

2. **RedisMessageSubscriber** (`src/lib/RedisMessageSubscriber.ts`)
   - Redis implementation of MessageSubscriber
   - Subscribes to Redis pub/sub channel

3. **SSE Endpoint** (`src/app/api/stream/route.ts`)
   - Next.js API route that streams messages via SSE
   - Connects to Redis and forwards messages to browser
   - Handles client disconnections gracefully

4. **ChatDisplay** (`src/components/ChatDisplay.tsx`)
   - React component that consumes SSE stream
   - Displays messages with different styling per type
   - Buffers streaming chunks until completion

## Prerequisites

- Node.js 20+
- pnpm package manager
- Redis server (or Docker)

## Installation

From the web directory:

```bash
cd web
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CHANNEL=ai-chat:stream
```

**Important:** The `REDIS_CHANNEL` must match the CLI app's `WEB_STREAM_REDIS_CHANNEL` setting.

## Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

Build for production:

```bash
pnpm build
pnpm start
```

## Docker Deployment

### Using the web directory docker-compose.yml

```bash
# From the web/ directory
docker compose up -d
```

This starts:
- Redis on port 6379
- Next.js web app on port 3000

### Using the root docker-compose.yml

```bash
# From the project root directory
docker compose up -d
```

This starts both Redis and the web app together.

## Usage

1. Start the web app (development or production)
2. Run the CLI app with web streaming enabled:
   ```bash
   cd ..
   WEB_STREAM_ENABLED=true pnpm dev
   ```
3. Open http://localhost:3000 in your browser
4. Type messages in the CLI terminal
5. Watch them appear in real-time in the browser!

## Message Types

The web UI displays different message types with distinct styling:

| Type | Color | Description |
|------|-------|-------------|
| `welcome` | Blue | Welcome message on CLI startup |
| `prompt` | Green | User prompt or label |
| `chunk` | Purple | AI response being streamed |
| `complete` | Purple | AI response completed |
| `error` | Red | Error messages |
| `warning` | Yellow | Warning messages |
| `info` | Gray | Informational messages |
| `system` | Blue | System status messages |

## API Routes

### GET /api/stream

Server-Sent Events endpoint that streams messages from Redis.

**Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

**Message Format:**
```
data: {"type":"chunk","payload":{"content":"Hello"},"timestamp":1234567890}\n\n
```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/stream/
│   │   │   └── route.ts          # SSE endpoint
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main page
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── ChatDisplay.tsx       # Chat UI component
│   ├── lib/
│   │   ├── MessageSubscriber.ts      # Abstract subscriber
│   │   ├── RedisMessageSubscriber.ts # Redis implementation
│   │   └── createSubscriber.ts       # Factory function
│   └── types/
│       └── messages.ts           # Shared message types
├── Dockerfile                    # Production build
├── docker-compose.yml            # Docker setup with Redis
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── README.md
```

## Extending the Web App

### Adding a New Message Broker

To use a different message broker (e.g., RabbitMQ, Kafka):

1. Create a new implementation of `MessageSubscriber`:
   ```typescript
   export class RabbitMQMessageSubscriber extends MessageSubscriber {
     // Implement abstract methods
   }
   ```

2. Update `createSubscriber()` factory:
   ```typescript
   export function createSubscriber(): MessageSubscriber {
     const brokerType = process.env.MESSAGE_BROKER || 'redis';

     if (brokerType === 'rabbitmq') {
       return new RabbitMQMessageSubscriber(/* config */);
     }

     return RedisMessageSubscriber.fromEnv();
   }
   ```

3. No changes needed to the SSE endpoint or UI components!

### Customizing the UI

The ChatDisplay component uses Tailwind CSS for styling. Modify `src/components/ChatDisplay.tsx` to customize:
- Message colors and styling
- Layout and spacing
- Connection indicator
- Animations

## Troubleshooting

**Connection fails immediately:**
- Check Redis is running: `docker compose ps`
- Verify Redis host/port in `.env`
- Check Redis channel matches CLI config

**Messages not appearing:**
- Ensure CLI app has `WEB_STREAM_ENABLED=true`
- Verify channel name matches between CLI and web app
- Check browser console for errors
- Check web app logs: `docker compose logs -f web`

**Slow or laggy streaming:**
- Redis pub/sub is near-instant, check network
- Browser EventSource has built-in buffering
- Check CPU usage on machine running web app

## Architecture Details

See the main project's `CLAUDE.md` for detailed architecture documentation, including:
- Infrastructure abstraction philosophy
- MessageSubscriber pattern
- CompositeView pattern in CLI
- How the CLI and web app communicate

## License

ISC
