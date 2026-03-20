import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';
import { getPresenceManager } from '@/space/presence';
import { getRelationshipGraph } from '@/space/relationship';
import { getConnectionTrigger } from '@/space/trigger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const spaceEngine = getSpaceEngine();

    const space = await spaceEngine.getSpace(id);

    if (!space) {
      return NextResponse.json(
        { code: 1, error: { message: 'Space not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      data: space,
    });
  } catch (error) {
    console.error('Failed to get space:', error);
    return NextResponse.json(
      { code: 1, error: { message: 'Failed to get space' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, agentId, userId, userName, content } = body;

    const spaceEngine = getSpaceEngine();
    const presenceManager = getPresenceManager();

    if (action === 'join') {
      if (!agentId || !userId) {
        return NextResponse.json(
          { code: 1, error: { message: 'Missing agentId or userId' } },
          { status: 400 }
        );
      }

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
      });

      return NextResponse.json({
        code: 0,
        data: participant,
      });
    }

    if (action === 'leave') {
      if (!agentId) {
        return NextResponse.json(
          { code: 1, error: { message: 'Missing agentId' } },
          { status: 400 }
        );
      }

      await spaceEngine.leaveSpace(id, agentId);
      await presenceManager.leaveSpace(agentId);

      return NextResponse.json({
        code: 0,
        message: 'Left space successfully',
      });
    }

    if (action === 'message') {
      if (!agentId || !userId || !content) {
        return NextResponse.json(
          { code: 1, error: { message: 'Missing required fields' } },
          { status: 400 }
        );
      }

      const space = await spaceEngine.getSpace(id);
      if (!space) {
        return NextResponse.json(
          { code: 1, error: { message: 'Space not found' } },
          { status: 404 }
        );
      }

      const message = await spaceEngine.sendMessage(id, {
        agentId,
        userId,
        userName: userName || userId,
        content,
        type: 'text',
      });

      const participants = space.participants.filter(p => p.agentId !== agentId);
      for (const participant of participants) {
        const relationshipGraph = getRelationshipGraph();
        const existingRelation = await relationshipGraph.getRelation(agentId, participant.agentId);

        if (existingRelation) {
          await relationshipGraph.createRelation({
            sourceAgentId: agentId,
            targetAgentId: participant.agentId,
            type: 'discussed',
            sharedTopics: space.currentTopic ? [space.currentTopic] : [],
            metadata: { spaceId: id, messageId: message.id },
          });
        }

        if (space.currentTopic) {
          const connectionTrigger = getConnectionTrigger(relationshipGraph);
          const matchScore = await connectionTrigger.calculateMatchScore(agentId, participant.agentId);

          if (matchScore >= 70) {
            await connectionTrigger.createTrigger({
              type: 'topic',
              sourceAgentId: agentId,
              sourceUserId: userId,
              sourceUserName: userName || userId,
              targetAgentId: participant.agentId,
              targetUserId: participant.userId,
              targetUserName: participant.userId,
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
    }

    if (action === 'topic') {
      if (!content) {
        return NextResponse.json(
          { code: 1, error: { message: 'Missing topic content' } },
          { status: 400 }
        );
      }

      await spaceEngine.setTopic(id, content);

      return NextResponse.json({
        code: 0,
        message: 'Topic updated successfully',
      });
    }

    return NextResponse.json(
      { code: 1, error: { message: 'Invalid action' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to perform action:', error);
    return NextResponse.json(
      { code: 1, error: { message: 'Failed to perform action' } },
      { status: 500 }
    );
  }
}
