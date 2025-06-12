export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'basic-model',
    name: 'BASIC MODEL',
    description: 'The fast and reliable model. Unlimited access.',
  },
  {
    id: 'plus-model',
    name: 'PLUS MODEL',
    description: 'Very good model capable of most tasks. Unlimited access.',
  },
  {
    id: 'top-model',
    name: 'TOP MODEL',
    description: 'State of the art model capable of everything. Unlimited access.',
  },
];
