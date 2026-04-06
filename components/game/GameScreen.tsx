import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { CheckoutModal } from './CheckoutModal';

type FlyChip = {
  id: number;
  emoji: string;
  label: string;
  x: number;
  y: number;
};

export function GameScreen() {
  const s = useGameStore();
  const reducedMotion = useReducedMotion();
  const cartRef = useRef<HTMLDivElement | null>(null);
  const [flyChips, setFlyChips] = useState<FlyChip[]>([]);
  const [flash, setFlash] = useState(false);
  const prevDopa = useRef(s.dopamine);

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
  const spendPct = Math.min(100, ((500 - s.budget) / 500) * 100);

  useEffect(() => {
    if (s.dopamine > prevDopa.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 260);
      return () => clearTimeout(t);
    }
    prevDopa.current = s.dopamine;
  }, [s.dopamine]);

  useEffect(() => {
    prevDopa.current = s.dopamine;
  }, [s.dopamine]);

  useEffect(() => {
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  const progressLabel = useMemo(() => {
    if (mood > 75) return 'Peak retail euphoria';
    if (mood > 45) return 'Cruising';
    return 'Impulse danger zone';
  }, [mood]);

  const runAddToCart = (cardId: string, e: React.MouseEvent<HTMLButtonElement>, emoji: string, name: string) => {
    if (reducedMotion || !cartRef.current) {
      s.addToCart(cardId);
      return;
    }

    const source = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const chip: FlyChip = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      emoji,
      label: name,
      x: source.left + source.width / 2,
      y: source.top + source.height / 2,
    };

    setFlyChips((v) => [...v, chip]);
    s.addToCart(cardId);
    setTimeout(() => {
      setFlyChips((v) => v.filter((f) => f.id !== chip.id));
    }, 620);
  };

  return (
    <section className="screen-wrap relative overflow-hidden">
      <AnimatePresence>
        {flash && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(83,74,183,0.42),transparent_58%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#222220] px-6 py-4 backdrop-blur-sm">
        <div className="font-extrabold text-purple-light">SPENDTHRIFT</div>
        <div className="flex gap-5 text-center text-xs">
          <Stat label="💰 Budget" value={`$${s.budget}`} color="text-teal" />
          <Stat label="⚡ Dopamine" value={`${s.dopamine}`} color="text-purple-light" />
          <Stat label="😬 Regret" value={`${s.regret}%`} color="text-[#e07050]" />
          <Stat label="🔄 Round" value={`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`} color="text-white" />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-6 py-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Mood Meter</p>
          <p className="text-xs text-zinc-400">{progressLabel}</p>
        </div>
        <div className="h-2 overflow-hidden rounded bg-white/10">
          <motion.div
            animate={{ width: `${mood}%` }}
            transition={{ type: 'spring', stiffness: 130, damping: 20 }}
            className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal"
          />
        </div>
        <div className="mt-3">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">Budget burn</p>
          <div className="h-1.5 overflow-hidden rounded bg-white/10">
            <motion.div
              animate={{ width: `${spendPct}%` }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="h-full rounded bg-gradient-to-r from-teal via-purple to-[#e07050]"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div>
          <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Your Hand — Round {s.round}</h3>
          {s.flashSaleSecondsLeft > 0 && <div className="mb-2 text-xs text-amber">⚡ Flash Sale active: {s.flashSaleSecondsLeft}s</div>}
          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
            variants={{ show: { transition: { staggerChildren: reducedMotion ? 0 : 0.06 } } }}
            initial="hidden"
            animate="show"
            key={`round-${s.round}-${s.hand.map((h) => h.id).join('-')}`}
          >
            {s.hand.map((card) => {
              const inCart = s.cart.some((c) => c.id === card.id);
              return (
                <motion.div
                  key={card.id}
                  variants={{ hidden: { opacity: 0, y: 18, rotateX: -10 }, show: { opacity: 1, y: 0, rotateX: 0 } }}
                  whileHover={reducedMotion ? undefined : { y: -5 }}
                  className={`rounded-2xl border p-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition ${inCart ? 'border-teal bg-teal/10' : 'border-white/10 bg-gradient-to-b from-[#403f3d] to-bg-card hover:border-purple'}`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                    <span className="pill border border-white/10 bg-black/20">{card.store}</span>
                    <span className={`pill ${card.type === 'event' ? 'bg-coral/20 text-[#ffb8a1]' : 'bg-purple/20 text-purple-light'}`}>{card.type}</span>
                  </div>
                  <div className="mt-3 text-4xl">{card.emoji}</div>
                  <div className="mt-1 text-sm font-bold">{card.name}</div>
                  {card.type === 'product' ? (
                    <>
                      <div className="mt-2 text-lg font-bold text-[#e07050]">${card.price}</div>
                      <Button
                        className="mt-2 w-full text-xs"
                        disabled={inCart}
                        onClick={(e) => runAddToCart(card.id, e, card.emoji, card.name)}
                      >
                        {inCart ? 'In Cart ✓' : 'Add to Cart'}
                      </Button>
                    </>
                  ) : (
                    <Button className="mt-3 w-full bg-coral text-xs text-white hover:bg-[#7f3118]" onClick={() => s.playSpecial(card.id)}>Play Card</Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div ref={cartRef} className="rounded-2xl border border-white/10 bg-bg-card p-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5 items)</h3>
            {s.cart.length > 0 && <span className="pill bg-purple/20 text-purple-light">+{cartD} dopamine</span>}
          </div>
          <div className="mb-4 flex min-h-10 flex-wrap gap-2">
            {s.cart.length === 0 ? <span className="text-sm italic text-zinc-500">No items yet — add cards from your hand above ☝️</span> : s.cart.map((c) => (
              <motion.span layout key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">{c.emoji} {c.name} (${c.paidPrice}) <button className="ml-1 text-zinc-400" onClick={() => s.removeFromCart(c.id)}>×</button></motion.span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={s.openCheckout} disabled={s.cart.length === 0}>Checkout →</Button>
            <button className="text-sm text-zinc-500" onClick={s.clearCart}>Clear Cart</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#222220] p-4">
          <h4 className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Activity Log</h4>
          <div className="space-y-1 text-sm text-zinc-400">{s.activityLog.slice(0, 6).map((l, i) => <div key={`${l}-${i}`}>• {l}</div>)}</div>
        </div>
      </div>

      <AnimatePresence>
        {flyChips.map((chip) => {
          const targetRect = cartRef.current?.getBoundingClientRect();
          const toX = targetRect ? targetRect.left + targetRect.width / 2 : chip.x;
          const toY = targetRect ? targetRect.top + 20 : chip.y;

          return (
            <motion.div
              key={chip.id}
              className="pointer-events-none fixed z-[60] rounded-full border border-purple/40 bg-[#2b284d] px-3 py-1 text-xs text-purple-light shadow-lg"
              initial={{ x: chip.x, y: chip.y, opacity: 0.9, scale: 1 }}
              animate={{ x: toX, y: toY, opacity: 0.2, scale: 0.82 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.58, ease: 'easeInOut' }}
            >
              {chip.emoji} {chip.label}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <CheckoutModal />
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div><motion.div layout className={`text-lg font-bold ${color}`}>{value}</motion.div></div>;
}
