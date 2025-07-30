import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { generateUUID } from '@/lib/utils';
import {
  saveChat,
  saveUserMessageWithLimit,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const API_URL = process.env.DOMAIN_API_URL || 'http://161.35.152.9:8000';
const API_KEY = process.env.DOMAIN_API_KEY || 'alksdfjoij09U908FHSFJoidhf9s8dfh9g87buvweuih87329UFI';

export async function POST(request: NextRequest) {
  try {
    const { initial_brief } = await request.json();
    if (!initial_brief) {
      return new ChatSDKError('bad_request:api').toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userId = session.user.id;
    const userType = session.user.type;
    const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;

    const chatId = generateUUID();
    const messageId = generateUUID();

    const userMessage = await saveUserMessageWithLimit({
      userId,
      chatId,
      messageId,
      parts: [{ text: initial_brief }],
      attachments: [],
      maxMessages,
    });

    if (!userMessage) {
      return new ChatSDKError('limit_exceeded:chat').toResponse();
    }

    await saveChat({
      id: chatId,
      userId,
      title: initial_brief.slice(0, 80),
      visibility: 'private',
      modelId: 'domain-agent',
    });

    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ initial_brief }),
    });

    const text = await res.text();
    if (!res.ok) {
      return new NextResponse(text, { status: res.status });
    }

    return NextResponse.json({ chat_id: chatId, ...(JSON.parse(text)) });
  } catch (err) {
    console.error('POST /domainagent/chat/start failed:', err);
    if (err instanceof ChatSDKError) {
      return err.toResponse();
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
