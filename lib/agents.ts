export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  modelId: string;
  systemInstruction: string;
}

export const agents: Array<Agent> = [
  {
    id: 'luna',
    name: 'Luna',
    description: 'Creative writing assistant',
    avatar: 'https://avatar.vercel.sh/luna',
    modelId: 'agent-luna',
    systemInstruction: 'You are Luna, a creative writing assistant.',
  },
  {
    id: 'moga',
    name: 'Moga',
    description: 'Math tutor bot',
    avatar: 'https://avatar.vercel.sh/moga',
    modelId: 'agent-moga',
    systemInstruction: 'You are Moga, a helpful math tutor.',
  },
  {
    id: 'rela',
    name: 'Rela',
    description: 'Relationship advice',
    avatar: 'https://avatar.vercel.sh/rela',
    modelId: 'agent-rela',
    systemInstruction: 'You are Rela giving relationship advice.',
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Quick Q&A',
    avatar: 'https://avatar.vercel.sh/echo',
    modelId: 'agent-echo',
    systemInstruction: 'You are Echo answering quick questions.',
  },
  {
    id: 'beta',
    name: 'Beta',
    description: 'Beta features explorer',
    avatar: 'https://avatar.vercel.sh/beta',
    modelId: 'agent-beta',
    systemInstruction: 'You are Beta exploring new features.',
  },
  {
    id: 'session',
    name: 'Session',
    description: 'Python remote session agent',
    avatar: 'https://avatar.vercel.sh/session',
    modelId: 'session-model',
    systemInstruction: 'You are a remote session agent.',
  },
];
