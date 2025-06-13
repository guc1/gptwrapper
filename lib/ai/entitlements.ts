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
    availableChatModelIds: ['free-model'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 10,
    availableChatModelIds: ['free-model'],
  },

  basis: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['basis-model', 'free-model'],
  },

  plus: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['plus-model', 'free-model'],
  },

  top: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['top-model', 'free-model'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
