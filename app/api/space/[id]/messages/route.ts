import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEngine } from '@/space/engine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before')
      ? parseInt(searchParams.get('before')!)
      : undefined;

    const spaceEngine = getSpaceEngine();

    const messages = await spaceEngine.getMessages(id, {
      limit,
      before,
    });

    return NextResponse.json({
      code: 0,
      data: messages,
    });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json(
      { code: 1, error: { message: 'Failed to get messages' } },
      { status: 500 }
    );
  }
}
