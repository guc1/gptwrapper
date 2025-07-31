import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  StreamData, // Use StreamData directly
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import type { UserType } from '@/lib/user-types';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveUserMessageWithLimit,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getTrailingMessageId,
  convertDBMessagesToUIMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after, type NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;
function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({ waitUntil: after });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(' > Resumable streams disabled: missing REDIS_URL');
      } else {
        console.error(error);
      }
    }
  }
  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;
  try {
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }
    const userType: UserType = session.user.type;

    const userModels = session.user.models ?? [];
    const baseModels =
      entitlementsByUserType[userType].availableChatModelIds;
    const availableModels = Array.from(new Set([...baseModels, ...userModels]));
    if (!availableModels.includes(selectedChatModel)) {
      return new ChatSDKError('forbidden_model:chat').toResponse();
    }

    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
        modelId: selectedChatModel,
      });
    } else if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const previousMessages = await getMessagesByChatId({ id });
    const messages = appendClientMessage({
      messages: convertDBMessagesToUIMessages(previousMessages),
      message,
    });

    const userMessage = await saveUserMessageWithLimit({
      userId: session.user.id,
      chatId: id,
      messageId: message.id,
      parts: message.parts,
      attachments: message.experimental_attachments ?? [],
      maxMessages: entitlementsByUserType[userType].maxMessagesPerDay,
    });

    if (!userMessage) {
      return new ChatSDKError(
        'limit_exceeded:chat',
        'Message limit reached for the day.',
      ).toResponse();
    }

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (msg) => msg.role === 'assistant',
                  ),
                });
                if (!assistantId) throw new Error('No assistant message found');
                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch {
                console.error('Failed to save assistant reply');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();
        result.mergeIntoDataStream(dataStream, { sendReasoning: true });
      },
      onError: (error) => {
        console.error('createDataStream error:', error);
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();
    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    }
    return new Response(stream);
  } catch (err) {
    console.error('POST /api/chat failed:', err);
    if (err instanceof ChatSDKError) {
      return err.toResponse();
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new ChatSDKError(
        'bad_request:api',
        'Chat ID is required.',
      ).toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatSDKError(
        'forbidden:chat',
        'You do not own this chat.',
      ).toResponse();
    }

    const deletedChat = await deleteChatById({ id });
    return NextResponse.json(deletedChat, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/chat failed:', err);
    if (err instanceof ChatSDKError) {
      return err.toResponse();
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const streamId = searchParams.get('streamId');

    if (!chatId) {
      return new ChatSDKError(
        'bad_request:api',
        'chatId is required.',
      ).toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }
    if (chat.visibility === 'private' && chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const streamContext = getStreamContext();
    if (!streamContext) {
      return new ChatSDKError(
        'bad_request:api',
        'Resumable streams not configured.',
      ).toResponse();
    }

    // The fallback function MUST return a Promise<ReadableStream | Response> or ReadableStream | Response
    const resumedStream = await streamContext.resumableStream(
      streamId || chatId,
      () => {
        const data = new StreamData();
        data.close(); // Close the StreamData instance, making its stream end.
        return data.stream; // This is a ReadableStream
      },
    );

    return new Response(resumedStream);
  } catch (err) {
    console.error('GET /api/chat (resume) failed:', err);
    if (err instanceof ChatSDKError) {
      return err.toResponse();
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
