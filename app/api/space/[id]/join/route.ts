import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';
import { getPresenceManager } from '@/space/presence';
import { getRelationshipGraph } from '@/space/relationship';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { agentId, userId, userName } = body;

    if (!agentId || !userId) {
      return NextResponse.json(
        { code: 1, error: { message: 'Missing agentId or userId' } },
        { status: 400 }
      );
    }

    const spaceEngine = getSpaceEngine();
    const presenceManager = getPresenceManager();

    const space = await spaceEngine.getSpace(id);
    if (!space) {
      return NextResponse.json(
        { code: 1, error: { message: 'Space not found' } },
        { status: 404 }
      );
    }

    await presenceManager.setStatus(agentId, userId, 'online');
    const participant = await spaceEngine.joinSpace(id, agentId, userId, userName);
    await presenceManager.enterSpace(agentId, id, space.type);

    const relationshipGraph = getRelationshipGraph();
    await relationshipGraph.createRelation({
      sourceAgentId: space.hostAgentId,
      targetAgentId: agentId,
      type: 'met',
      sharedTopics: space.currentTopic ? [space.currentTopic] : [],
      initialScore: 20,
      metadata: { spaceId: id },
    });

    return NextResponse.json({
      code: 0,
      data: participant,
    });
  } catch (error) {
    console.error('Failed to join space:', error);
    const message = error instanceof Error ? error.message : 'Failed to join space';
    return NextResponse.json(
      { code: 1, error: { message } },
      { status: 500 }
    );
  }
}
