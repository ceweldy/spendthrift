import { Button } from '@/components/ui/Button';
import { getArchetype, getFinalScore, getTitleFromScore, useGameStore } from '@/store/useGameStore';

export function ResultsScreen() {
  const s = useGameStore();
  const { finalScore, regretPenalty, archetypeBonus } = getFinalScore(s.dopamine, s.regret);
  const title = getTitleFromScore(finalScore);
  const arch = getArchetype(s.archetype);

  return (
    <section className="screen-wrap flex flex-col items-center justify-center gap-7 px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Game Over — Final Score</p>
      <div>
        <div className="text-8xl font-black tracking-tighter sm:text-9xl">{finalScore}</div>
        <div className="text-xl font-semibold text-purple-light">{title}</div>
      </div>

      <div className="w-full max-w-md rounded-xl border border-white/10 bg-bg-card p-6 text-left">
        <div className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Score Breakdown</div>
        <Row label="Total Dopamine" value={`+${s.dopamine}`} color="text-teal" />
        <Row label="Regret Penalty" value={`-${regretPenalty}`} color="text-[#e07050]" />
        <Row label="Archetype Bonus" value={`+${archetypeBonus}`} color="text-purple-light" />
        <Row label="Final Score" value={`${finalScore}`} color="text-amber" strong />
      </div>

      <span className="pill bg-purple/20 text-purple-light">{arch.emoji} {arch.title}</span>

      <div className="flex gap-8">
        <Metric label="Rounds" value={`${Math.min(s.round - 1, s.maxRounds)}`} />
        <Metric label="Spent" value={`$${500 - s.budget}`} />
        <Metric label="Items" value={`${s.logs.filter((l) => l.startsWith('Added')).length}`} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button className="px-7 py-3" onClick={s.startQuiz}>Play Again</Button>
        <Button variant="ghost" className="px-7 py-3" onClick={() => navigator.clipboard?.writeText(`I scored ${finalScore} in SPENDTHRIFT.`)}>Share Score 📤</Button>
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
