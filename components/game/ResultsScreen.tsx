import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { getArchetype, getFinalScore, getTitleFromScore, useGameStore } from '@/store/useGameStore';

export function ResultsScreen() {
  const s = useGameStore();
  const { finalScore, regretPenalty, archetypeBonus } = getFinalScore(s.dopamine, s.regret, s.archetype);
  const title = getTitleFromScore(finalScore);
  const arch = getArchetype(s.archetype);

  return (
    <section className="screen-wrap relative flex flex-col items-center justify-center gap-7 px-6 py-10 text-center">
      <div className="pointer-events-none absolute top-0 h-64 w-full bg-[radial-gradient(circle_at_top,rgba(83,74,183,0.35),transparent_70%)]" />

      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Game Over — Final Score</p>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(83,74,183,0.25)] sm:text-9xl">{finalScore}</div>
        <div className="text-xl font-semibold text-purple-light">{title}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-[#3d3b38] to-bg-card p-6 text-left shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Score Breakdown</div>
          <span className="pill bg-purple/20 text-purple-light">{arch.emoji} {arch.title}</span>
        </div>
        <Row label="Total Dopamine" value={`+${s.dopamine}`} color="text-teal" />
        <Row label="Regret Penalty" value={`-${regretPenalty}`} color="text-[#e07050]" />
        <Row label="Archetype Bonus" value={`+${archetypeBonus}`} color="text-purple-light" />
        <Row label="Final Score" value={`${finalScore}`} color="text-amber" strong />
      </motion.div>

      <div className="flex gap-8">
        <Metric label="Rounds" value={`${Math.min(s.round - 1, s.maxRounds)}`} />
        <Metric label="Spent" value={`$${500 - s.budget}`} />
        <Metric label="Items" value={`${s.history.filter((h) => h.kind === 'cart' && h.text.startsWith('Added')).length}`} />
      </div>

      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-black/20 p-4 text-left">
        <div className="mb-2 text-[11px] uppercase tracking-widest text-zinc-500">Share Card Preview</div>
        <div className="rounded-lg border border-purple/30 bg-[#272532] p-4 text-sm text-zinc-200">
          I scored <strong className="text-purple-light">{finalScore}</strong> in <strong>SPENDTHRIFT</strong> as <strong>{arch.title}</strong>. Can you beat my haul?
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button className="px-7 py-3" onClick={s.startQuiz}>Play Again</Button>
        <Button
          variant="ghost"
          className="px-7 py-3"
          onClick={() => navigator.clipboard?.writeText(`I scored ${finalScore} in SPENDTHRIFT as ${arch.title}. Can you beat my haul?`)}
        >
          Share Score 📤
        </Button>
      </div>
    </section>
  );
}

function Row({ label, value, color, strong }: { label: string; value: string; color: string; strong?: boolean }) {
  return <div className={`flex justify-between border-b border-white/10 py-2 text-sm ${strong ? 'font-bold' : ''}`}><span className="text-zinc-400">{label}</span><span className={color}>{value}</span></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-2xl font-extrabold">{value}</div><div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div></div>;
}
