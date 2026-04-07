import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

export function LandingScreen() {
  const startQuiz = useGameStore((s) => s.startQuiz);
  const membershipTiers = useGameStore((s) => s.membershipTiers);
  const currentTier = useGameStore((s) => s.subscription.currentPlanId);
  const chooseMembership = useGameStore((s) => s.chooseMembership);
  const openBadgesView = useGameStore((s) => s.openBadgesView);

  return (
    <section className="screen-wrap relative flex flex-col items-center justify-between px-6 text-center">
      <div className="pointer-events-none absolute top-0 h-80 w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),rgba(142,130,255,0.18),transparent_72%)]" />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
        <motion.div
          initial={{ rotate: -2, scale: 0.96, opacity: 0.9 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          className="w-full max-w-[260px] sm:max-w-[320px]"
        >
          <div className="rounded-2xl border border-white/30 bg-white/85 px-4 py-3 shadow-[0_16px_40px_rgba(8,8,20,0.28)] backdrop-blur-sm sm:px-5 sm:py-4">
            <Image
              src="/branding/asi-logo.png"
              alt="Applied Strategy Inc. logo"
              width={1306}
              height={703}
              priority
              className="h-auto w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.22)]"
            />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">An Applied Strategy Inc. game</p>
        </motion.div>

        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple/40 bg-purple/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-light">
            <span aria-hidden>🛍️</span>
            <span>Spendthrift</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">SPENDTHRIFT</h1>
          <p className="mt-1 text-zinc-400">The Compulsive Shopping Card Game</p>
        </div>
        <p className="max-w-md border-l-2 border-purple pl-4 text-left text-sm text-zinc-500">
          &ldquo;The thrill of the purchase. None of the financial guilt.&rdquo;
        </p>

        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-bg-card/70 p-4 text-left">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-400">Choose Membership (Pre-Game)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {membershipTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => chooseMembership(tier.id)}
                className={`rounded-xl border p-4 transition ${
                  currentTier === tier.id ? 'border-purple bg-purple/15' : 'border-white/10 bg-black/20 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">{tier.name}</div>
                  <div className="text-sm text-coral">{tier.id === 'free' ? '$0' : '$9/mo'}</div>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                  {tier.perks.map((perk) => (
                    <li key={perk}>• {perk}</li>
                  ))}
                </ul>
                {currentTier === tier.id && <div className="mt-2 text-xs text-teal">Selected</div>}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-zinc-500">Free is default. Paid unlocks premium cards/features.</div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="pill bg-purple/20 text-purple-light">Membership First</span>
          <span className="pill border border-white/10 bg-white/5 text-zinc-300">Browser-First</span>
          <span className="pill bg-teal/20 text-teal">No Real Money</span>
          <span className="pill bg-amber/20 text-amber">Brand Ready</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button className="px-8 py-4 text-base" onClick={startQuiz}>Start Shopping →</Button>
          <Button
            variant="ghost"
            className="px-8 py-4 text-base"
            onClick={openBadgesView}
            aria-label="View badges"
          >
            View Badges 🏅
          </Button>
        </div>
      </div>
      <footer className="w-full border-t border-white/10 py-5 text-xs text-zinc-500">Team 7 · Strategy Class · v2.1 UX Pass</footer>
    </section>
  );
}
