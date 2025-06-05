import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const chatIdToResume =
    typeof searchParams?.chatIdToResume === 'string'
      ? searchParams.chatIdToResume
      : null;
  const guestUserId =
    typeof searchParams?.guestUserId === 'string'
      ? searchParams.guestUserId
      : null;
  const unsentPrompt =
    typeof searchParams?.unsentPrompt === 'string'
      ? searchParams.unsentPrompt
      : null;

  if (chatIdToResume && guestUserId && session.user?.id) {
    const { transferChatOwnership } = await import('@/lib/db/queries');
    await transferChatOwnership(chatIdToResume, guestUserId, session.user.id);
    const promptSuffix = unsentPrompt
      ? `?prompt=${encodeURIComponent(unsentPrompt)}`
      : '';
    redirect(`/chat/${chatIdToResume}${promptSuffix}`);
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
