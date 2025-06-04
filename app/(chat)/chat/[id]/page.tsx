// app/(chat)/chat/[id]/page.tsx
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: chatId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialPromptFromQuery =
    typeof resolvedSearchParams?.prompt === 'string'
      ? resolvedSearchParams.prompt
      : undefined;
  
  const chat = await getChatById({ id: chatId });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    const redirectBase = process.env.AUTH_URL || 'http://localhost:3000';
    const currentPath = `/chat/${chatId}`;
    let redirectUrlQuery = '';
    if (initialPromptFromQuery) {
      redirectUrlQuery = `?prompt=${encodeURIComponent(initialPromptFromQuery)}`;
    }
    
    const fullRedirectUrl = `${redirectBase}${currentPath}${redirectUrlQuery}`;
    
    const guestAuthUrl = new URL('/api/auth/guest', redirectBase);
    guestAuthUrl.searchParams.set('redirectUrl', fullRedirectUrl);
    
    redirect(guestAuthUrl.toString());
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      // This should have been caught by the !session check above, but for safety
      notFound();
    }

    if (session.user.id !== chat.userId) {
      notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id: chatId,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      content: (message.parts as Array<{type: string, text?: string}>)?.find(p => p.type === 'text')?.text || '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  const chatComponentProps = {
    id: chat.id,
    initialMessages: convertToUIMessages(messagesFromDb),
    initialChatModel: chatModelFromCookie?.value || DEFAULT_CHAT_MODEL,
    initialVisibilityType: chat.visibility,
    isReadonly: session?.user?.id !== chat.userId,
    session: session, // session is guaranteed here
    autoResume: true,
    initialInput: initialPromptFromQuery,
  };

  return (
    <>
      <Chat {...chatComponentProps} />
      <DataStreamHandler id={chatId} /> {/* Ensure consistent use of chatId */}
    </>
  );
}