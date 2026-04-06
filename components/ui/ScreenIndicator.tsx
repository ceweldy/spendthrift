import { motion } from 'framer-motion';
import { Screen } from '@/types/game';

const order: Screen[] = ['landing', 'quiz', 'archetype', 'game', 'results'];

export function ScreenIndicator({ screen }: { screen: Screen }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-2 backdrop-blur">
      {order.map((s) => {
        const active = s === screen;
        return (
          <motion.span
            key={s}
            animate={{ width: active ? 22 : 6, opacity: active ? 1 : 0.55 }}
            className={`h-1.5 rounded-full ${active ? 'bg-purple' : 'bg-zinc-500'}`}
          />
        );
      })}
    </div>
  );
}
