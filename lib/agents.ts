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
    id: 'domainAgent',
    name: 'DomainAgent',
    description: 'Domain name brainstorming assistant',
    avatar: 'https://avatar.vercel.sh/domainAgent',
    modelId: 'agent-domain',
    systemInstruction: 'You are DomainAgent helping with domain ideas.',
  },
];
