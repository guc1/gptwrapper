// components/chat.tsx
'use client';

import type { Attachment, UIMessage, ChatRequestOptions as CoreChatRequestOptions } from 'ai';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { useLoginSignupPopup } from '@/hooks/use-login-signup-popup';
import type { UserType } from '@/app/(auth)/auth';

type ChatRequestOptions = CoreChatRequestOptions;

interface MessageStatus {
  messagesLeft: number;
  maxMessages: number;
  nextResetTimestamp: number | null;
  userType: UserType;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session, // This session prop comes from the Server Component page
  autoResume,
  initialInput: propInitialInput,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session; // Session is now guaranteed by the page
  autoResume: boolean;
  initialInput?: string;
}) {
  const { mutate: mutateGlobal } = useSWRConfig();
  const { openPopup: openLoginSignupPopup } = useLoginSignupPopup();
  const hasSetInitialInputRef = useRef(false);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  // SWR key for messageStatus uses the session.user.id from the props.
  // This is critical: if `session` prop updates correctly after login, this key will change.
  const messageStatusSWRKey = session?.user?.id ? `/api/message-status?userId=${session.user.id}` : null;
  const { data: messageStatus, mutate: mutateMessageStatus } = useSWR<MessageStatus>(
    messageStatusSWRKey,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
    },
  );
  
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const {
    messages,
    setMessages,
    handleSubmit: internalUseChatHandleSubmit, // Renamed from useChat
    input,
    setInput,
    append: internalUseChatAppend, // Renamed from useChat
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialInput: propInitialInput,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: visibilityType,
    }),
    onFinish: () => {
      mutateGlobal(unstable_serialize(getChatHistoryPaginationKey));
      mutateMessageStatus();
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (error.type === 'limit_exceeded' && error.surface === 'chat') {
           if (session.user?.id) {
             openLoginSignupPopup({
               chatId: id,
               guestUserId: session.user.id,
               unsentPrompt: input,
             });
           }
          return;
        }
        toast({
          type: 'error',
          description: error.message,
        });
      } else {
        toast({
          type: 'error',
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get('query');
  const promptFromAuthRedirect = searchParams.get('prompt');

  useEffect(() => {
    const promptToUse = propInitialInput || promptFromAuthRedirect || queryFromUrl;
    if (promptToUse && !hasSetInitialInputRef.current && status === 'ready') {
      const lastMessage = messages.at(-1);
      if (!(lastMessage?.role === 'user' && lastMessage.content === promptToUse)) {
        setInput(promptToUse);
      }
      hasSetInitialInputRef.current = true;
      const newUrl = new URL(window.location.href);
      if (promptFromAuthRedirect) newUrl.searchParams.delete('prompt');
      if (queryFromUrl) newUrl.searchParams.delete('query');
      if (newUrl.searchParams.toString() !== new URL(window.location.href).searchParams.toString()) {
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propInitialInput, promptFromAuthRedirect, queryFromUrl, setInput, status, messages.length]);


   const handleSubmit: UseChatHelpers['handleSubmit'] = useCallback(
    (eOrForm, chatRequestOptions) => {
    // Allow calling without an event when submitting programmatically
    eOrForm?.preventDefault?.();
    
    if (messageStatus?.userType === 'guest' && (messageStatus.messagesLeft <= 0 && input.trim() !== '')) {
      if (session.user?.id) {
        openLoginSignupPopup({
          chatId: id,
          guestUserId: session.user.id,
          unsentPrompt: input,
        });
      }
      return;
    }
    
    const currentPath = `/chat/${id}`;
    if (window.location.pathname !== currentPath || window.location.search !== '') {
      window.history.replaceState({}, '', currentPath);
    }

    const optionsWithAttachments: ChatRequestOptions = {
      ...chatRequestOptions,
      experimental_attachments: attachments,
    };
    // The first argument to useChat's handleSubmit can be an event or options.
    // If eOrForm is an event, it's passed. If it's undefined (programmatic call), pass undefined.
    internalUseChatHandleSubmit(eOrForm, optionsWithAttachments);
  }, [messageStatus, openLoginSignupPopup, internalUseChatHandleSubmit, id, attachments, input, session.user?.id]);


  const append: UseChatHelpers['append'] = useCallback(
    async (message, chatRequestOptions) => {
    if (messageStatus?.userType === 'guest' && (messageStatus.messagesLeft <= 0)) {
       if (session.user?.id) {
         openLoginSignupPopup({
           chatId: id,
           guestUserId: session.user.id,
           unsentPrompt: typeof message.content === 'string' ? message.content : input,
         });
       }
      return null;
    }
    const currentPath = `/chat/${id}`;
    if (window.location.pathname !== currentPath || window.location.search !== '') {
        window.history.replaceState({}, '', currentPath);
    }
    return internalUseChatAppend(message, chatRequestOptions);
  // Dependencies for the outer useCallback wrapper for `append`
  }, [messageStatus?.userType, messageStatus?.messagesLeft, session?.user?.id, openLoginSignupPopup, id, input, internalUseChatAppend]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={visibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form
          // The `handleSubmit` from `useChat` (now `internalUseChatHandleSubmit`)
          // is designed to be used directly as a form's onSubmit handler.
          // Our wrapped `handleSubmit` also supports this.
          onSubmit={handleSubmit}
          className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
        >
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit} // Pass the component's memoized handleSubmit
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit} // Pass the component's memoized handleSubmit
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}