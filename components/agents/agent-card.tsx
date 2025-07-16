import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export function AgentCard({ name }: { name: string }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }}>
      <Card className="p-4 text-center cursor-pointer select-none">
        {name}
      </Card>
    </motion.div>
  );
}
