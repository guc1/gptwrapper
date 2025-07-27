import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAgentPopup } from '@/hooks/use-agent-popup';
import type { Agent } from '@/lib/agents';

export interface AgentCardProps {
  agent: Agent;
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function AgentCard({ agent }: AgentCardProps) {
  const { openPopup } = useAgentPopup();
  return (
    <motion.button
      variants={cardVariants}
      whileHover={{ translateY: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="ripple relative flex items-start gap-5 rounded-[24px] border border-white/30 bg-white/10 px-[2rem] py-[1.75rem] backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform shadow-sm hover:shadow-md focus:outline-none overflow-hidden"
      onClick={() => openPopup(agent)}
    >
      <span
        className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'radial-gradient(circle at 30% 30%, var(--brand-accent), #FFE3D2)' }}
      >
        <Image src={agent.avatar} alt="" width={64} height={64} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
      </span>
      <span className="text-left">
        <h3 className="font-bold [font-size:clamp(1.1rem,0.9rem+0.6vw,1.35rem)]">{agent.name}</h3>
        <p className="[font-size:clamp(.85rem,.75rem+.4vw,1rem)] opacity-80">{agent.description}</p>
      </span>
    </motion.button>
  );
}
