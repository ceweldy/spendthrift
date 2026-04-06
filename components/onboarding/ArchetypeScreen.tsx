import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { getArchetype, useGameStore } from '@/store/useGameStore';

export function ArchetypeScreen() {
  const archetypeKey = useGameStore((s) => s.archetype);
  const startGame = useGameStore((s) => s.startGame);
  const archetype = getArchetype(archetypeKey);

  return (
    <section className="screen-wrap flex flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Your Shopper DNA is...</p>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border-2 border-purple bg-bg-card px-8 py-10 shadow-[0_0_60px_rgba(83,74,183,0.25)]"
      >
        <div className="text-6xl">{archetype.emoji}</div>
        <h2 className="mt-4 text-3xl font-extrabold">{archetype.title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{archetype.desc}</p>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-2">
        {archetype.bonuses.map((b) => <span key={b} className="pill border border-white/10 bg-white/5 text-zinc-300">{b}</span>)}
      </div>
      <Button className="px-8 py-4 text-base" onClick={startGame}>Start Game →</Button>
    </section>
  );
}
