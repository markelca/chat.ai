import { NextResponse } from 'next/server';
import { createMessageHistory } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions/{sessionName}/messages
 * Returns all messages for a specific session.
 */
export async function GET(
  request: Request,
  { params }: { params: { sessionName: string } }
) {
  const { sessionName } = params;

  if (!sessionName) {
    return NextResponse.json(
      { error: 'Session name is required' },
      { status: 400 }
    );
  }

  const messageHistory = createMessageHistory(sessionName);

  try {
    const messages = await messageHistory.getAll();
    return NextResponse.json(messages);
  } catch (error) {
    console.error(`Failed to fetch messages for session ${sessionName}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
