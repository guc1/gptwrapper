// lib/db/queries.ts
import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  inArray,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  userModel,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import type { UserType } from '../user-types';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined');
}
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

export async function transferChatOwnership(
  chatId: string,
  oldUserId: string, // This is the guestUserId
  newUserId: string,
) {
  try {
    if (!chatId || !oldUserId || !newUserId || oldUserId === newUserId) {
      console.warn(
        `Invalid parameters for chat transfer: chatId=${chatId}, oldUserId=${oldUserId}, newUserId=${newUserId}`,
      );
      return null;
    }

    // First, verify the chat exists and belongs to the oldUserId (guest)
    const [chatToTransfer] = await db
      .select({ id: chat.id, currentUserId: chat.userId })
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);

    if (!chatToTransfer) {
      console.warn(`Chat transfer: Chat ${chatId} not found.`);
      return null;
    }

    if (chatToTransfer.currentUserId !== oldUserId) {
      console.warn(
        `Chat transfer: Chat ${chatId} belongs to user ${chatToTransfer.currentUserId}, not guest ${oldUserId}. Cannot transfer.`,
      );
      return null;
    }

    const [updatedChat] = await db
      .update(chat)
      .set({ userId: newUserId })
      .where(and(eq(chat.id, chatId), eq(chat.userId, oldUserId))) // Double-check ownership during update
      .returning();

    if (updatedChat) {
      console.log(
        `Successfully transferred ownership of chat ${chatId} from guest ${oldUserId} to user ${newUserId}`,
      );
    } else {
      console.warn(
        `Failed to transfer ownership of chat ${chatId} from guest ${oldUserId} to user ${newUserId}. Update returned no rows.`,
      );
    }
    return updatedChat || null;
  } catch (error) {
    console.error(
      `Error during transferChatOwnership for chat ${chatId}:`,
      error,
    );
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to transfer chat ownership due to a database error.',
    );
  }
}

// ... (getUser, createUser, createGuestUser remain the same as your last provided version) ...
export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(
  email: string,
  password: string,
): Promise<User> {
  const hashedPassword = generateHashedPassword(password);

  try {
    const [createdUser] = await db
      .insert(user)
      .values({ email, password: hashedPassword, type: 'regular' })
      .returning();
    if (!createdUser) {
      throw new Error('User creation failed to return the created user.');
    }
    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser(
  id?: string,
): Promise<Array<Pick<User, 'id' | 'email'>>> {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db
      .insert(user)
      .values({
        ...(id ? { id } : {}),
        email,
        password,
        type: 'guest',
      })
      .returning({
        id: user.id,
        email: user.email,
      });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return foundUser ?? null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by id');
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  modelId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  modelId: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      modelId,
    });
  } catch (error) {
    console.error('Error saving chat:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

// ... (rest of queries: deleteChatById, getChatsByUserId, etc. remain the same)
export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
  modelId,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  modelId?: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const baseCondition = modelId ? and(eq(chat.modelId, modelId), eq(chat.userId, id)) : eq(chat.userId, id);
    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(whereCondition ? and(whereCondition, baseCondition) : baseCondition)
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const targetDate = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, targetDate),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
export async function saveUserMessageWithLimit({
  userId,
  chatId,
  messageId,
  parts,
  attachments,
  maxMessages,
}: {
  userId: string;
  chatId: string;
  messageId: string;
  parts: any;
  attachments: any;
  maxMessages: number;
}) {
  const targetDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`);

    const [stats] = await tx
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, userId),
          gte(message.createdAt, targetDate),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    if ((stats?.count ?? 0) >= maxMessages) {
      return null;
    }

    const [inserted] = await tx
      .insert(message)
      .values({
        id: messageId,
        chatId,
        role: 'user',
        parts,
        attachments,
        createdAt: new Date(),
      })
      .returning();

    return inserted;
  });
}

export async function addUserModel({
  userId,
  modelId,
  expiresAt,
}: {
  userId: string;
  modelId: string;
  expiresAt: Date;
}) {
  try {
    await db
      .insert(userModel)
      .values({ userId, modelId, expiresAt, canceled: false })
      .onConflictDoUpdate({
        target: [userModel.userId, userModel.modelId],
        set: { expiresAt, canceled: false },
      });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to add user model');
  }
}

export async function getUserModelIds({ userId }: { userId: string }) {
  try {
    const rows = await db
      .select({ modelId: userModel.modelId })
      .from(userModel)
      .where(
        and(
          eq(userModel.userId, userId),
          or(
            eq(userModel.canceled, false),
            gt(userModel.expiresAt, new Date()),
          ),
          or(isNull(userModel.expiresAt), gt(userModel.expiresAt, new Date())),
        ),
      );
    return rows.map((r) => r.modelId);
  } catch (error) {
    console.warn('Failed to get user models', error);
    return [];
  }
}

export async function getUserSubscriptions({ userId }: { userId: string }) {
  try {
    return await db
      .select({
        modelId: userModel.modelId,
        expiresAt: userModel.expiresAt,
        canceled: userModel.canceled,
      })
      .from(userModel)
      .where(eq(userModel.userId, userId));
  } catch (error) {
    console.warn('Failed to get subscriptions', error);
    return [];
  }
}

export async function cancelUserModel({
  userId,
  modelId,
}: {
  userId: string;
  modelId: string;
}) {
  try {
    await db
      .update(userModel)
      .set({ canceled: true })
      .where(and(eq(userModel.userId, userId), eq(userModel.modelId, modelId)));
  } catch (error) {
    console.warn('Failed to cancel subscription', error);
  }
}

export async function getUserTypeById({ userId }: { userId: string }) {
  try {
    const [row] = await db
      .select({ type: user.type })
      .from(user)
      .where(eq(user.id, userId));
    let currentType: UserType = (row?.type as UserType) ?? 'regular';

    if (
      currentType === 'basis' ||
      currentType === 'plus' ||
      currentType === 'top'
    ) {
      const active = await db
        .select({ modelId: userModel.modelId })
        .from(userModel)
        .where(
          and(
            eq(userModel.userId, userId),
            or(
              eq(userModel.canceled, false),
              gt(userModel.expiresAt, new Date()),
            ),
            or(
              isNull(userModel.expiresAt),
              gt(userModel.expiresAt, new Date()),
            ),
          ),
        )
        .limit(1);
      if (active.length === 0) {
        await db
          .update(user)
          .set({ type: 'regular' })
          .where(eq(user.id, userId));
        currentType = 'regular';
      }
    }

    return currentType;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user type');
  }
}
