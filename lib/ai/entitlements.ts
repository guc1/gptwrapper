import type { UserType } from '@/lib/user-types';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 1,
    availableChatModelIds: ['chat-model'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 10,
    availableChatModelIds: ['chat-model'],
  },

  basic: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['basic-model'],
  },

  gemiddeld: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['gemiddeld-model'],
  },

  top: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['top-model'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

export function getAvailableChatModels(
  userType: UserType,
  purchasedModels: Array<ChatModel['id']> | undefined,
): Array<ChatModel['id']> {
  const defaults = entitlementsByUserType[userType].availableChatModelIds;
  if (!purchasedModels || purchasedModels.length === 0) return defaults;
  return Array.from(new Set(['chat-model', ...purchasedModels]));
}
