import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/guest?redirectUrl=/introduction');
  }
  if (session.user.type !== 'guest') {
    redirect('/');
  }

  const initialMessages = [
    {
      id: generateUUID(),
      role: 'user' as const,
      content: 'What are your capabilities?',
      parts: [{ type: 'text', text: 'What are your capabilities?' }],
      createdAt: new Date(),
    },
    {
      id: generateUUID(),
      role: 'assistant' as const,
      content:
        'I am a demo assistant that can answer questions, summarize information and help with simple tasks.',
      parts: [
        {
          type: 'text',
          text: 'I am a demo assistant that can answer questions, summarize information and help with simple tasks.',
        },
      ],
      createdAt: new Date(),
    },
    {
      id: generateUUID(),
      role: 'user' as const,
      content: 'Could you tell me something about NLmodel?',
      parts: [
        { type: 'text', text: 'Could you tell me something about NLmodel?' },
      ],
      createdAt: new Date(),
    },
    {
      id: generateUUID(),
      role: 'assistant' as const,
      content:
        'NL model is a dutch company specialised in AI, offering both consumer and enterprise integrations for the dutch AI market.',
      parts: [
        {
          type: 'text',
          text: 'NL model is a dutch company specialised in AI, offering both consumer and enterprise integrations for the dutch AI market.',
        },
      ],
      createdAt: new Date(),
    },
  ];

  return (
    <Chat
      id="introduction"
      initialMessages={initialMessages}
      initialChatModel={DEFAULT_CHAT_MODEL}
      initialVisibilityType="public"
      isReadonly={true}
      session={session}
      autoResume={false}
    />
  );
}
