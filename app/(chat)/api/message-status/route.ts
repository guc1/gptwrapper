import { NextResponse } from 'next/server';
import { auth, type UserType } from '@/app/(auth)/auth';
import { getMessageCountByUserId } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { addHours, isAfter, subHours } from 'date-fns';
import { db } from '@/lib/db/drizzle-client'; // Assuming you'll create a central db client
import { message, chat } from '@/lib/db/schema';
import { and, eq, gte, asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const userType: UserType = session.user.type;
  const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;

  const messagesInLast24Hours = await getMessageCountByUserId({
    id: userId,
    differenceInHours: 24,
  });

  const messagesLeft = Math.max(0, maxMessages - messagesInLast24Hours);
  let nextResetTimestamp: number | null = null;

  if (userType === 'guest') {
    if (messagesInLast24Hours > 0) { // If any message was sent in the last 24h
      // Find the timestamp of the first message sent in the current 24-hour window
      const twentyFourHoursAgo = subHours(new Date(), 24);
      const firstMessageInWindow = await db
        .select({ createdAt: message.createdAt })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(
          and(
            eq(chat.userId, userId),
            eq(message.role, 'user'),
            gte(message.createdAt, twentyFourHoursAgo),
          ),
        )
        .orderBy(asc(message.createdAt))
        .limit(1)
        .execute(); // Drizzle uses execute()

      if (firstMessageInWindow.length > 0) {
        nextResetTimestamp = addHours(firstMessageInWindow[0].createdAt, 24).getTime();
      } else {
        // This case should ideally not be hit if messagesInLast24Hours > 0,
        // but as a fallback, set reset to now (meaning limit is available).
        nextResetTimestamp = Date.now();
      }
    } else {
      // Guest has not used their message yet
      nextResetTimestamp = Date.now(); // Reset is effectively now, message is available
    }
  } else {
    // For registered users, you might have a fixed daily reset time (e.g., midnight UTC)
    // For simplicity, we'll also use a rolling 24-hour window for them or just indicate "daily"
    // If they have messages, their "day" started with the oldest message in the window
    if (messagesInLast24Hours > 0) {
      const twentyFourHoursAgo = subHours(new Date(), 24);
      const firstMessageInWindow = await db
        .select({ createdAt: message.createdAt })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(
          and(
            eq(chat.userId, userId),
            eq(message.role, 'user'),
            gte(message.createdAt, twentyFourHoursAgo),
          ),
        )
        .orderBy(asc(message.createdAt))
        .limit(1)
        .execute();
      if (firstMessageInWindow.length > 0) {
         nextResetTimestamp = addHours(firstMessageInWindow[0].createdAt, 24).getTime();
      } else {
         nextResetTimestamp = Date.now();
      }
    } else {
      nextResetTimestamp = Date.now();
    }
  }

  return NextResponse.json({
    messagesLeft,
    maxMessages,
    nextResetTimestamp,
    userType,
  });
}