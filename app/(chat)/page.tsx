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
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [session, cookieStore] = await Promise.all([auth(), cookies()]);

  const success = resolvedSearchParams?.success === 'true';
  const planId =
    typeof resolvedSearchParams?.planId === 'string'
      ? resolvedSearchParams.planId
      : null;

  if (success && planId && session?.user?.id) {
    const { updateUserTypeAfterCheckout } = await import('./actions');
    await updateUserTypeAfterCheckout({
      userId: session.user.id,
      planId,
    });

    redirect('/');
  }

  if (!session) {
    redirect('/api/auth/guest');
  }
  const chatIdToResume =
    typeof resolvedSearchParams?.chatIdToResume === 'string'
      ? resolvedSearchParams.chatIdToResume
      : null;
  const guestUserId =
    typeof resolvedSearchParams?.guestUserId === 'string'
      ? resolvedSearchParams.guestUserId
      : null;
  const unsentPrompt =
    typeof resolvedSearchParams?.unsentPrompt === 'string'
      ? resolvedSearchParams.unsentPrompt
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
