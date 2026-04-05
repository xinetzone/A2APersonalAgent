import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';
import { getPresenceManager } from '@/space/presence';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'dao-space' | 'market' | 'lounge' | null;
    const status = searchParams.get('status') as 'active' | 'idle' | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    const spaceEngine = getSpaceEngine();

    const spaces = await spaceEngine.listSpaces({
      type: type || undefined,
      status: status || undefined,
    });

    const limitedSpaces = spaces.slice(0, limit);

    return NextResponse.json(
      {
        code: 0,
        data: limitedSpaces,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Failed to list spaces:', error);
    return NextResponse.json(
      { code: 1, error: { message: 'Failed to list spaces' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      name,
      description,
      hostAgentId,
      hostUserId,
      hostName,
      maxParticipants = 20,
      isPrivate = false,
      initialTopic,
    } = body;

    if (!type || !name || !hostAgentId || !hostUserId) {
      return NextResponse.json(
        { code: 1, error: { message: 'Missing required fields: type, name, hostAgentId, hostUserId' } },
        { status: 400 }
      );
    }

    if (!['dao-space', 'market', 'lounge'].includes(type)) {
      return NextResponse.json(
        { code: 1, error: { message: 'Invalid space type' } },
        { status: 400 }
      );
    }

    if (name.trim().length < 2 || name.trim().length > 30) {
      return NextResponse.json(
        { code: 1, error: { message: 'Space name must be between 2 and 30 characters' } },
        { status: 400 }
      );
    }

    if (maxParticipants < 2 || maxParticipants > 100) {
      return NextResponse.json(
        { code: 1, error: { message: 'Max participants must be between 2 and 100' } },
        { status: 400 }
      );
    }

    const spaceEngine = getSpaceEngine();
    const presenceManager = getPresenceManager();

    const space = await spaceEngine.createSpace({
      type,
      name: name.trim(),
      description: description?.trim() || '',
      hostAgentId,
      hostUserId,
      hostName,
      maxParticipants,
      metadata: {
        isPrivate,
        ...(initialTopic && { topicId: initialTopic }),
      },
    });

    await presenceManager.setStatus(hostAgentId, hostUserId, 'online');
    await presenceManager.enterSpace(hostAgentId, space.id, type);

    if (initialTopic) {
      await spaceEngine.setTopic(space.id, initialTopic);
      space.currentTopic = initialTopic;
    }

    return NextResponse.json({
      code: 0,
      data: space,
    });
  } catch (error) {
    console.error('Failed to create space:', error);
    const message = error instanceof Error ? error.message : 'Failed to create space';
    return NextResponse.json(
      { code: 1, error: { message } },
      { status: 500 }
    );
  }
}
