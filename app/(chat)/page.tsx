import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
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
  const selectedModelIdParam =
    typeof resolvedSearchParams?.modelId === 'string'
      ? resolvedSearchParams.modelId
      : null;

  if (selectedModelIdParam === 'domain-agent') {
    redirect('/domain-agent');
  }

  if (success && planId && session?.user?.id) {
    const { PostCheckoutUpdater } = await import('@/components/post-checkout-updater');
    return <PostCheckoutUpdater userId={session.user.id} planId={planId} />;
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
  const baseModels = entitlementsByUserType[session.user.type].availableChatModelIds;
  const userModels = session.user.models ?? [];
  const availableModels = Array.from(new Set([...baseModels, ...userModels]));
  const desiredModelId = selectedModelIdParam ?? modelIdFromCookie?.value;
  const initialModelId =
    desiredModelId && availableModels.includes(desiredModelId)
      ? desiredModelId
      : DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialModelId}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
