import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';
import { getPresenceManager } from '@/space/presence';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { agentId, reason } = body;

    if (!agentId) {
      return NextResponse.json(
        { code: 1, error: { message: 'Missing agentId' } },
        { status: 400 }
      );
    }

    const spaceEngine = getSpaceEngine();
    const presenceManager = getPresenceManager();

    await spaceEngine.leaveSpace(id, agentId, reason);
    await presenceManager.leaveSpace(agentId);

    return NextResponse.json({
      code: 0,
      message: 'Left space successfully',
    });
  } catch (error) {
    console.error('Failed to leave space:', error);
    const message = error instanceof Error ? error.message : 'Failed to leave space';
    return NextResponse.json(
      { code: 1, error: { message } },
      { status: 500 }
    );
  }
}
