import { createSubscriber } from '@/lib/createSubscriber';
import type { OutputMessage } from '@/types/messages';

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint that subscribes to message broker and streams messages to the browser.
 * Messages are sent in the standard SSE format: "data: {json}\n\n"
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Create message subscriber from environment configuration
      const subscriber = createSubscriber();

      subscriber.onError((err) => {
        console.error('[SSE] Subscriber Error:', err);
        controller.error(err);
      });

      try {
        // Connect to message broker
        await subscriber.connect();
        console.log('[SSE] Connected to message broker');

        // Send initial connection message
        const connectionMessage: OutputMessage = {
          type: 'system',
          payload: { content: 'Connected to stream' },
          timestamp: Date.now(),
        };
        const data = `data: ${JSON.stringify(connectionMessage)}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Subscribe to messages
        await subscriber.subscribe((message: OutputMessage) => {
          try {
            // Forward the message to the SSE stream
            const data = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (err) {
            console.error('[SSE] Error encoding message:', err);
          }
        });

        console.log('[SSE] Client connected and subscribed');

        // Handle client disconnection
        request.signal.addEventListener('abort', async () => {
          console.log('[SSE] Client disconnected, cleaning up...');
          try {
            await subscriber.unsubscribe();
            await subscriber.disconnect();
            controller.close();
          } catch (err) {
            console.error('[SSE] Error during cleanup:', err);
          }
        });
      } catch (err) {
        console.error('[SSE] Failed to connect to message broker:', err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
