import { motion } from 'framer-motion';

export function AgentCard({ name }: { name: string }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-row gap-5 p-[1.75rem_2rem] rounded-[24px] bg-white/12 backdrop-blur-[18px] backdrop-saturate-[180%] border border-white/28 transition-transform duration-150 ease-linear hover:shadow-lg"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-radial from-[#FFB98B] to-[#FFE3D2] text-2xl font-bold">
        {name.charAt(0)}
      </span>
      <span className="text-left flex flex-col justify-center">
        <h3 className="font-bold text-[clamp(1.1rem,0.9rem+0.6vw,1.35rem)]">{name}</h3>
      </span>
    </motion.button>
  );
}

