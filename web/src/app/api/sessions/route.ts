import { NextResponse } from 'next/server';
import { createSessionStore } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions
 * Returns a list of all chat sessions sorted by most recent activity.
 */
export async function GET() {
  const sessionStore = createSessionStore();

  try {
    const sessions = await sessionStore.list();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
