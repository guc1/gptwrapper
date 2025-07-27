import type { UserType } from '@/lib/user-types';
import type { ChatModel } from './models';
import { agents } from '@/lib/agents';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

const agentModelIds = agents.map((a) => a.modelId);

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
    availableChatModelIds: ['free-model', ...agentModelIds],
  },

  basis: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['basis-model', 'free-model', ...agentModelIds],
  },

  plus: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['plus-model', 'free-model', ...agentModelIds],
  },

  top: {
    maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
    availableChatModelIds: ['top-model', 'free-model', ...agentModelIds],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
