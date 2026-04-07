import { useEffect, useState, type ReactNode } from 'react';
import { motion, useMotionValue, animate, useTransform, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { getArchetype, getFinalScore, getTitleFromScore, useGameStore } from '@/store/useGameStore';
import { playSfx } from '@/lib/audio-manager';
import { ACHIEVEMENTS } from '@/lib/achievements';

export function ResultsScreen() {
  const s = useGameStore();
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [recapCopied, setRecapCopied] = useState(false);
  const { finalScore, regretPenalty, archetypeBonus } = getFinalScore(s.dopamine, s.regret, s.archetype);
  const title = getTitleFromScore(finalScore);
  const arch = getArchetype(s.archetype);

  const scoreMV = useMotionValue(reducedMotion ? finalScore : 0);
  const dopamineMV = useMotionValue(reducedMotion ? s.dopamine : 0);
  const penaltyMV = useMotionValue(reducedMotion ? regretPenalty : 0);
  const bonusMV = useMotionValue(reducedMotion ? archetypeBonus : 0);

  const scoreText = useTransform(scoreMV, (v) => Math.round(v));
  const dopamineText = useTransform(dopamineMV, (v) => Math.round(v));
  const penaltyText = useTransform(penaltyMV, (v) => Math.round(v));
  const bonusText = useTransform(bonusMV, (v) => Math.round(v));

  useEffect(() => {
    playSfx('resultsReveal');
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const controls = [
      animate(scoreMV, finalScore, { duration: 1.1, ease: [0.16, 1, 0.3, 1] }),
      animate(dopamineMV, s.dopamine, { duration: 0.65, delay: 0.08 }),
      animate(penaltyMV, regretPenalty, { duration: 0.65, delay: 0.16 }),
      animate(bonusMV, archetypeBonus, { duration: 0.65, delay: 0.24 }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [finalScore, s.dopamine, regretPenalty, archetypeBonus, reducedMotion, scoreMV, dopamineMV, penaltyMV, bonusMV]);

  const demoSavings = Math.max(0, s.stats.totalOriginalSpent - s.stats.totalSpent);
  const purchasedItems = s.inventory.reduce((acc, item) => acc + item.quantity, 0);
  const runSpent = s.history
    .filter((entry) => entry.kind === 'checkout')
    .reduce((total, entry) => {
      const match = entry.text.match(/paid \$([0-9]+(?:\.[0-9]+)?)/i);
      return total + (match ? Number(match[1]) : 0);
    }, 0);
  const runSavings = s.history
    .filter((entry) => entry.kind === 'checkout' && /discount savings captured/i.test(entry.text))
    .reduce((total, entry) => {
      const match = entry.text.match(/\$([0-9]+(?:\.[0-9]+)?)/i);
      return total + (match ? Number(match[1]) : 0);
    }, 0);
  const unlockedBadges = s.achievements.unlocked.length;
  const roundsPlayed = Math.min(s.round - 1, s.maxRounds);

  const recapText = [
    '🧾 SPENDTHRIFT Run Recap',
    `Score: ${finalScore} (${title})`,
    `Archetype: ${arch.emoji} ${arch.title}`,
    `Rounds: ${roundsPlayed}/${s.maxRounds}`,
    `Run Spend: $${runSpent.toFixed(2)}`,
    `Run Savings: $${runSavings.toFixed(2)}`,
    `Dopamine / Regret: ${s.dopamine} / ${s.regret}%`,
    `Items Purchased: ${purchasedItems} (${s.inventory.length} distinct)`,
    `Badges Unlocked: ${unlockedBadges}/${ACHIEVEMENTS.length}`,
  ].join('\n');

  const onShare = async () => {
    const message = `I scored ${finalScore} in SPENDTHRIFT as ${arch.title}. Can you beat my haul?`;
    await navigator.clipboard?.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onExportRecap = async () => {
    await navigator.clipboard?.writeText(recapText);
    setRecapCopied(true);
    setTimeout(() => setRecapCopied(false), 1600);
  };

  return (
    <section className="screen-wrap relative flex flex-col items-center justify-center gap-7 px-6 py-10 text-center">
      <div className="pointer-events-none absolute top-0 h-64 w-full bg-[radial-gradient(circle_at_top,rgba(83,74,183,0.35),transparent_70%)]" />
      {!reducedMotion && <div className="pointer-events-none absolute inset-0 score-grid-glow opacity-40" />}

      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Game Over — Final Score</p>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }}>
        <motion.div
          className="text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(83,74,183,0.25)] sm:text-9xl"
          animate={reducedMotion ? undefined : { textShadow: ['0 0 16px rgba(83,74,183,0.1)', '0 0 36px rgba(83,74,183,0.5)', '0 0 22px rgba(83,74,183,0.2)'] }}
          transition={{ duration: 1.15 }}
        >
          <motion.span>{scoreText}</motion.span>
        </motion.div>
        <div className="text-xl font-semibold text-purple-light">{title}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: reducedMotion ? 0 : 0.24 }}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-b from-[#3d3b38] to-bg-card p-6 text-left shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Score Breakdown</div>
          <span className="pill bg-purple/20 text-purple-light">{arch.emoji} {arch.title}</span>
        </div>
        <Row label="Total Dopamine" value={<><span>+</span><motion.span>{dopamineText}</motion.span></>} color="text-teal" />
        <Row label="Regret Penalty" value={<><span>-</span><motion.span>{penaltyText}</motion.span></>} color="text-[#e07050]" />
        <Row label="Archetype Bonus" value={<><span>+</span><motion.span>{bonusText}</motion.span></>} color="text-purple-light" />
        <Row label="Final Score" value={<motion.span>{scoreText}</motion.span>} color="text-amber" strong />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: reducedMotion ? 0 : 0.2 }} className="flex flex-wrap justify-center gap-8">
        <Metric label="Rounds" value={`${Math.min(s.round - 1, s.maxRounds)}`} />
        <Metric label="Run Spent" value={`$${runSpent.toFixed(2)}`} />
        <Metric label="Lifetime Spent" value={`$${s.stats.totalSpent.toFixed(2)}`} />
        <Metric label="Original Value" value={`$${s.stats.totalOriginalSpent.toFixed(2)}`} />
        <Metric label="Demo Savings" value={`$${demoSavings.toFixed(2)}`} />
      </motion.div>

      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-black/20 p-4 text-left">
        <div className="mb-2 text-[11px] uppercase tracking-widest text-zinc-500">Purchased Items Summary</div>
        <div className="mb-2 text-sm text-zinc-300">Total Items: {purchasedItems} • Distinct: {s.inventory.length}</div>
        <div className="max-h-44 space-y-2 overflow-auto text-sm">
          {s.inventory.length === 0 && <div className="text-zinc-500">No purchases recorded.</div>}
          {s.inventory.slice(0, 20).map((item) => (
            <motion.div key={item.id} layout className="flex items-center justify-between rounded border border-white/10 bg-black/30 px-2 py-1">
              <span>{item.emoji} {item.name} × {item.quantity}</span>
              <span className="text-zinc-300">${item.totalSpent.toFixed(2)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {s.subscription.currentPlanId === 'free' && (
        <div className="w-full max-w-xl rounded-xl border border-purple/30 bg-purple/10 p-4 text-left">
          <div className="text-sm font-bold text-purple-light">Upgrade to Paid</div>
          <div className="mt-1 text-xs text-zinc-300">Unlock premium cards/features before your next run from the landing screen.</div>
        </div>
      )}

      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-black/20 p-4 text-left">
        <div className="mb-2 text-[11px] uppercase tracking-widest text-zinc-500">Run Recap Card</div>
        <div className="rounded-lg border border-purple/30 bg-[#272532] p-4 text-sm text-zinc-200">
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">{arch.emoji} {arch.title} • {title}</div>
          <div className="grid gap-1 text-sm sm:grid-cols-2">
            <div>Final Score: <strong className="text-purple-light">{finalScore}</strong></div>
            <div>Rounds: <strong>{roundsPlayed}/{s.maxRounds}</strong></div>
            <div>Run Spend: <strong>${runSpent.toFixed(2)}</strong></div>
            <div>Run Savings: <strong>${runSavings.toFixed(2)}</strong></div>
            <div>Dopamine/Regret: <strong>{s.dopamine}/{s.regret}%</strong></div>
            <div>Badges: <strong>{unlockedBadges}/{ACHIEVEMENTS.length}</strong></div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" className="px-4 py-2 text-xs" onClick={onShare}>{copied ? 'Score Copied ✓' : 'Share Score 📤'}</Button>
          <Button variant="ghost" className="px-4 py-2 text-xs" onClick={onExportRecap}>{recapCopied ? 'Recap Copied ✓' : 'Export Recap Copy 🧾'}</Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button className="px-7 py-3" onClick={s.startQuiz}>Play Again</Button>
        <Button variant="ghost" className="px-7 py-3" onClick={s.resetAll}>Back to Home</Button>
      </div>
    </section>
  );
}

function Row({ label, value, color, strong }: { label: string; value: ReactNode; color: string; strong?: boolean }) {
  return <div className={`flex justify-between border-b border-white/10 py-2 text-sm ${strong ? 'font-bold' : ''}`}><span className="text-zinc-400">{label}</span><span className={`inline-flex items-center gap-0.5 ${color}`}>{value}</span></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-2xl font-extrabold">{value}</div><div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div></div>;
}
