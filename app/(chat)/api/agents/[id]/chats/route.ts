import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByAgentId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = request.nextUrl;
  const limit = Number.parseInt(searchParams.get('limit') || '5');
  const cursor = searchParams.get('cursor');

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const result = await getChatsByAgentId({ agentId: params.id, limit, cursor });
  return Response.json(result);
}
