import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { saveChat, saveUserMessageWithLimit } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { UserType } from '@/lib/user-types';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { VisibilityType } from '@/components/visibility-selector';

interface RequestBody {
  action: 'start' | 'continue';
  brief?: string;
  chatId?: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const userType: UserType = session.user.type;
  const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;

  if (body.action === 'start') {
    const chatId = generateUUID();
    const title = body.brief?.slice(0, 80) || 'DomainAgent';
    try {
      await saveChat({
        id: chatId,
        userId: session.user.id,
        title,
        visibility: 'private' as VisibilityType,
        modelId: 'domain-agent',
      });
      const saved = await saveUserMessageWithLimit({
        userId: session.user.id,
        chatId,
        messageId: generateUUID(),
        parts: [{ text: 'start' }],
        attachments: [],
        maxMessages,
      });
      if (!saved) {
        return NextResponse.json({ error: 'limit_exceeded' }, { status: 403 });
      }
      return NextResponse.json({ chatId });
    } catch (err) {
      console.error('domainagent start error', err);
      return NextResponse.json({ error: 'Failed to start chat' }, { status: 500 });
    }
  }

  if (body.action === 'continue') {
    if (!body.chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }
    try {
      const saved = await saveUserMessageWithLimit({
        userId: session.user.id,
        chatId: body.chatId,
        messageId: generateUUID(),
        parts: [{ text: 'continue' }],
        attachments: [],
        maxMessages,
      });
      if (!saved) {
        return NextResponse.json({ error: 'limit_exceeded' }, { status: 403 });
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error('domainagent continue error', err);
      return NextResponse.json({ error: 'Failed to record message' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
