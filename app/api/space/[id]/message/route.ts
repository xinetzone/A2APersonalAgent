import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';
import { getRelationshipGraph } from '@/space/relationship';
import { getConnectionTrigger } from '@/space/trigger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { agentId, userId, userName, content, type } = body;

    if (!agentId || !userId || !content) {
      return NextResponse.json(
        { code: 1, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const spaceEngine = getSpaceEngine();

    const space = await spaceEngine.getSpace(id);
    if (!space) {
      return NextResponse.json(
        { code: 1, error: { message: 'Space not found' } },
        { status: 404 }
      );
    }

    const participant = space.participants.find((p) => p.agentId === agentId);
    if (!participant) {
      return NextResponse.json(
        { code: 1, error: { message: 'Not in space' } },
        { status: 403 }
      );
    }

    const message = await spaceEngine.sendMessage(id, {
      agentId,
      userId,
      userName: userName || userId,
      content,
      type: type || 'text',
    });

    const relationshipGraph = getRelationshipGraph();
    const participants = space.participants.filter((p) => p.agentId !== agentId);

    for (const p of participants) {
      const existingRelation = await relationshipGraph.getRelation(agentId, p.agentId);

      await relationshipGraph.createRelation({
        sourceAgentId: agentId,
        targetAgentId: p.agentId,
        type: 'discussed',
        sharedTopics: space.currentTopic ? [space.currentTopic] : [],
        metadata: { spaceId: id, messageId: message.id },
      });

      if (space.currentTopic) {
        const connectionTrigger = getConnectionTrigger(relationshipGraph);
        const matchScore = await connectionTrigger.calculateMatchScore(agentId, p.agentId);

        if (matchScore >= 70) {
          await connectionTrigger.createTrigger({
            type: 'topic',
            sourceAgentId: agentId,
            sourceUserId: userId,
            sourceUserName: userName || userId,
            targetAgentId: p.agentId,
            targetUserId: p.userId,
            targetUserName: p.userId,
            context: {
              spaceId: id,
              topic: space.currentTopic,
              matchScore,
              message: content.slice(0, 100),
            },
          });
        }
      }
    }

    return NextResponse.json({
      code: 0,
      data: message,
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json(
      { code: 1, error: { message } },
      { status: 500 }
    );
  }
}
