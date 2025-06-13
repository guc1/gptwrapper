export const DEFAULT_CHAT_MODEL: string = 'free-model';

import type { TranslationKey } from '@/lib/i18n';

export interface ChatModel {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'free-model',
    nameKey: 'freeModelName',
    descriptionKey: 'freeModelDescription',
  },
  {
    id: 'chat-model-reasoning',
    nameKey: 'reasoningModelName',
    descriptionKey: 'reasoningModelDescription',
  },
  {
    id: 'basis-model',
    nameKey: 'basisModelName',
    descriptionKey: 'basisModelDescription',
  },
  {
    id: 'plus-model',
    nameKey: 'plusModelName',
    descriptionKey: 'plusModelDescription',
  },
  {
    id: 'top-model',
    nameKey: 'topModelName',
    descriptionKey: 'topModelDescription',
  },
];
