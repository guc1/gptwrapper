import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { generateUUID } from '@/lib/utils';
import { getChatById, saveUserMessageWithLimit } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chat_id } = await request.json();
    if (!chat_id) {
      return new ChatSDKError('bad_request:api').toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const chat = await getChatById({ id: chat_id });
    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }
    if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const maxMessages = entitlementsByUserType[session.user.type].maxMessagesPerDay;
    const messageId = generateUUID();

    const userMessage = await saveUserMessageWithLimit({
      userId: session.user.id,
      chatId: chat_id,
      messageId,
      parts: [{ text: '[domain agent continue]' }],
      attachments: [],
      maxMessages,
    });

    if (!userMessage) {
      return new ChatSDKError('limit_exceeded:chat').toResponse();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /domainagent/chat/message failed:', err);
    if (err instanceof ChatSDKError) {
      return err.toResponse();
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
