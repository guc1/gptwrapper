'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function updateUserTypeAfterCheckout({
  userId,
  planId,
}: {
  userId: string;
  planId: string;
}) {
  const { db } = await import('@/lib/db/drizzle-client');
  const schemaModule = await import('@/lib/db/schema');
  const userTable = schemaModule.user;
  const { eq } = await import('drizzle-orm');
  const { unstable_update } = await import('@/app/(auth)/auth');
  const { addUserModel, getUserModelIds } = await import('@/lib/db/queries');

  const PLAN_MAP: Record<string, 'basic' | 'plus' | 'top' | undefined> = {
    'basic-model': 'basic',
    'plus-model': 'plus',
    'top-model': 'top',
  };

  const type = PLAN_MAP[planId];
  if (!type) return;

  await db.update(userTable).set({ type }).where(eq(userTable.id, userId));
  await addUserModel({ userId, modelId: planId });
  const models = await getUserModelIds({ userId });
  await unstable_update({ user: { type, models } });
  await saveChatModelAsCookie(planId);
}
