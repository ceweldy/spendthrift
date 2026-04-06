import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { playSfx } from '@/lib/audio-manager';
import { useGameStore } from '@/store/useGameStore';
import { CheckoutModal } from './CheckoutModal';

type FlyChip = { id: number; emoji: string; label: string; x: number; y: number };

type FlashState = {
  budget: 'up' | 'down' | null;
  dopamine: 'up' | 'down' | null;
  regret: 'up' | 'down' | null;
};

export function GameScreen() {
  const s = useGameStore();
  const reducedMotion = useReducedMotion();
  const cartRef = useRef<HTMLDivElement | null>(null);
  const previousRound = useRef(s.round);
  const previousDopamine = useRef(s.dopamine);
  const previousHandSig = useRef('');
  const prevRef = useRef({ budget: s.budget, dopamine: s.dopamine, regret: s.regret });
  const [flyChips, setFlyChips] = useState<FlyChip[]>([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState<FlashState>({ budget: null, dopamine: null, regret: null });
  const [cartPulse, setCartPulse] = useState(false);

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
  const spendPct = Math.min(100, ((500 - s.budget) / 500) * 100);

  useEffect(() => {
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handSig = s.hand.map((card) => card.id).join('|');
    if (handSig && handSig !== previousHandSig.current) {
      playSfx('cardDeal');
      const hasRarePull = s.hand.some((card) => card.premiumOnly || (card.price ?? 0) >= 400 || card.effect === 'designer');
      if (hasRarePull) playSfx('rarePull');
    }
    previousHandSig.current = handSig;
  }, [s.hand]);

  useEffect(() => {
    if (s.round > previousRound.current) {
      playSfx('roundTransition');
    }
    previousRound.current = s.round;
  }, [s.round]);

  useEffect(() => {
    if (s.dopamine > previousDopamine.current) {
      playSfx('dopamineGain');
    }
    previousDopamine.current = s.dopamine;
  }, [s.dopamine]);

  useEffect(() => {
    const prev = prevRef.current;
    const next: FlashState = { budget: null, dopamine: null, regret: null };
    if (s.budget !== prev.budget) next.budget = s.budget > prev.budget ? 'up' : 'down';
    if (s.dopamine !== prev.dopamine) next.dopamine = s.dopamine > prev.dopamine ? 'up' : 'down';
    if (s.regret !== prev.regret) next.regret = s.regret > prev.regret ? 'up' : 'down';
    if (next.budget || next.dopamine || next.regret) {
      setFlash(next);
      const t = setTimeout(() => setFlash({ budget: null, dopamine: null, regret: null }), 320);
      return () => clearTimeout(t);
    }
    prevRef.current = { budget: s.budget, dopamine: s.dopamine, regret: s.regret };
  }, [s.budget, s.dopamine, s.regret]);

  useEffect(() => {
    prevRef.current = { budget: s.budget, dopamine: s.dopamine, regret: s.regret };
  }, [s.budget, s.dopamine, s.regret]);

  const triggerCartPulse = () => {
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 220);
  };

  const runAddToCart = (cardId: string, e: React.MouseEvent<HTMLButtonElement>, emoji: string, name: string) => {
    const before = useGameStore.getState().cart.length;

    if (reducedMotion || !cartRef.current) {
      s.addToCart(cardId);
      if (useGameStore.getState().cart.length > before) playSfx('addCart');
      triggerCartPulse();
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
    if (useGameStore.getState().cart.length > before) playSfx('addCart');
    triggerCartPulse();
    setTimeout(() => setFlyChips((v) => v.filter((f) => f.id !== chip.id)), 620);
  };

  const stores = useMemo(() => ['all', ...Array.from(new Set(s.inventory.map((i) => i.store)))], [s.inventory]);
  const filteredInventory = useMemo(
    () =>
      s.inventory.filter((item) => {
        const storeMatch = storeFilter === 'all' || item.store === storeFilter;
        const queryMatch = !query || item.name.toLowerCase().includes(query.toLowerCase());
        return storeMatch && queryMatch;
      }),
    [s.inventory, query, storeFilter],
  );

  return (
    <section className="screen-wrap relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#222220] px-6 py-4">
        <div className="font-extrabold text-purple-light">SPENDTHRIFT</div>
        <div className="flex gap-5 text-center text-xs">
          <Stat label="💰 Budget" value={`$${s.budget}`} color="text-teal" flash={flash.budget} />
          <Stat label="⚡ Dopamine" value={`${s.dopamine}`} color="text-purple-light" flash={flash.dopamine} />
          <Stat label="😬 Regret" value={`${s.regret}%`} color="text-[#e07050]" flash={flash.regret} />
          <Stat label="🔄 Round" value={`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`} color="text-white" />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-6 py-4">
        <div className="mb-3 flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
          {(['shop', 'inventory', 'subscription'] as const).map((menu) => {
            const active = s.activeMenu === menu;
            return (
              <motion.button
                key={menu}
                layout
                className={`relative pill haptic-tap flex-1 justify-center py-1.5 text-[11px] uppercase tracking-wide transition ${
                  active ? 'text-white' : 'text-zinc-300 hover:text-white'
                }`}
                onClick={() => s.setActiveMenu(menu)}
              >
                {active && <motion.span layoutId="menu-pill" className="absolute inset-0 rounded-full bg-purple" transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
                <span className="relative z-10">{menu === 'shop' ? 'Shop/Game' : menu}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="h-2 overflow-hidden rounded bg-white/10">
          <motion.div
            animate={{ width: `${mood}%` }}
            transition={{ type: 'spring', stiffness: 160, damping: 26, mass: 0.6 }}
            className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal"
          />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
          <motion.div
            animate={{ width: `${spendPct}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 24, mass: 0.7 }}
            className="h-full rounded bg-gradient-to-r from-teal via-purple to-[#e07050]"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl p-6">
        <AnimatePresence mode="wait" initial={false}>
          {s.activeMenu === 'shop' && (
            <motion.div key="menu-shop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
              <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {s.hand.map((card) => {
                  const inCart = s.cart.some((c) => c.id === card.id);
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className="card-press rounded-2xl border border-white/10 bg-gradient-to-b from-[#403f3d] to-bg-card p-3 text-center"
                    >
                      <div className="text-4xl">{card.emoji}</div>
                      <div className="text-sm font-bold">{card.name}</div>
                      {card.type === 'product' ? (
                        <>
                          <div className="text-lg font-bold text-[#e07050]">${card.price}</div>
                          <Button className="mt-2 w-full text-xs" disabled={inCart} onClick={(e) => runAddToCart(card.id, e, card.emoji, card.name)}>
                            {inCart ? 'In Cart ✓' : 'Add to Cart'}
                          </Button>
                        </>
                      ) : (
                        <Button className="mt-2 w-full bg-coral text-xs text-white" onClick={() => { playSfx('eventTrigger'); s.playSpecial(card.id); }}>Play Card</Button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div
                ref={cartRef}
                animate={cartPulse && !reducedMotion ? { scale: [1, 1.012, 1] } : undefined}
                transition={{ duration: 0.22 }}
                className="rounded-2xl border border-white/10 bg-bg-card p-4"
              >
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5)</div>
                <motion.div layout className="mb-3 flex min-h-10 flex-wrap gap-2">
                  {s.cart.length === 0 ? (
                    <span className="text-sm italic text-zinc-500">No items yet</span>
                  ) : (
                    s.cart.map((c) => (
                      <motion.span layout key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">
                        {c.emoji} {c.name} (${c.paidPrice})
                        <button className="ml-1 haptic-tap" onClick={() => { playSfx('removeCart'); s.removeFromCart(c.id); triggerCartPulse(); }}>×</button>
                      </motion.span>
                    ))
                  )}
                </motion.div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => { playSfx('checkoutOpen'); s.openCheckout(); }} disabled={s.cart.length === 0}>Checkout →</Button>
                  <button className="haptic-tap text-sm text-zinc-500 transition hover:text-zinc-300" onClick={() => { if (s.cart.length) playSfx('removeCart'); s.clearCart(); triggerCartPulse(); }}>Clear Cart</button>
                  {s.cart.length > 0 && <span className="pill bg-purple/20 text-purple-light">+{cartD} dopamine</span>}
                </div>
              </motion.div>
            </motion.div>
          )}

          {s.activeMenu === 'inventory' && (
            <motion.div key="menu-inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="mb-2 text-sm font-semibold">Purchased Inventory (persistent)</div>
              <div className="mb-3 flex gap-2">
                <input className="rounded-md border border-white/10 bg-bg p-2 text-sm transition focus:border-purple/60 focus:outline-none" placeholder="Search item" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select className="rounded-md border border-white/10 bg-bg p-2 text-sm transition focus:border-purple/60 focus:outline-none" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                  {stores.map((store) => <option key={store} value={store}>{store === 'all' ? 'All stores' : store}</option>)}
                </select>
              </div>
              <motion.div layout className="space-y-2">
                {filteredInventory.length === 0 && <div className="text-sm text-zinc-500">No inventory matches this filter.</div>}
                {filteredInventory.map((item) => (
                  <motion.div layout key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm transition hover:border-white/20">
                    <div className="flex justify-between"><div>{item.emoji} {item.name}</div><div>Qty {item.quantity}</div></div>
                    <div className="text-xs text-zinc-400">Purchase ${item.lastPurchasePrice.toFixed(2)} • {new Date(item.lastPurchasedAt).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">Total spent ${item.totalSpent.toFixed(2)} • Original ${item.totalOriginalSpent.toFixed(2)}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {s.activeMenu === 'subscription' && (
            <motion.div key="menu-subscription" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="text-sm font-semibold">Subscription & Payments</div>
              <div className="flex gap-2">
                <button className={`pill haptic-tap transition ${s.paymentMode === 'real-display' ? 'bg-purple text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`} onClick={() => s.setCheckoutMode('real-display')}>Real pricing (display only)</button>
                <button className={`pill haptic-tap transition ${s.paymentMode === 'demo-free' ? 'bg-teal text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`} onClick={() => s.setCheckoutMode('demo-free')}>Demo free checkout</button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {s.subscriptionPlans.map((plan) => (
                  <motion.div
                    layout
                    whileHover={reducedMotion ? undefined : { y: -2 }}
                    key={plan.id}
                    className={`card-press rounded-lg border p-3 transition ${s.subscription.currentPlanId === plan.id ? 'border-purple bg-purple/10' : 'border-white/10 bg-black/20'}`}
                  >
                    <div className="text-lg font-bold">{plan.name}</div>
                    <div className="text-sm text-coral">${plan.price}/mo</div>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-400">{plan.perks.map((perk) => <li key={perk}>• {perk}</li>)}</ul>
                    <Button className="mt-3 w-full" onClick={() => s.buySubscription(plan.id)}>
                      {s.subscription.currentPlanId === plan.id ? 'Subscribed ✓' : 'Choose Plan'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {flyChips.map((chip) => {
          const targetRect = cartRef.current?.getBoundingClientRect();
          const toX = targetRect ? targetRect.left + targetRect.width / 2 : chip.x;
          const toY = targetRect ? targetRect.top + 20 : chip.y;
          return (
            <motion.div
              key={chip.id}
              className="pointer-events-none fixed z-[60] rounded-full border border-purple/40 bg-[#2b284d] px-3 py-1 text-xs text-purple-light"
              initial={{ x: chip.x, y: chip.y, scale: 0.95 }}
              animate={{ x: toX, y: toY, opacity: 0.15, scale: 0.7 }}
              transition={{ duration: 0.58, ease: [0.2, 0.7, 0.1, 1] }}
              exit={{ opacity: 0 }}
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

function Stat({ label, value, color, flash }: { label: string; value: string; color: string; flash?: 'up' | 'down' | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <motion.div
        layout
        animate={flash ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 0.26 }}
        className={`text-lg font-bold ${color} ${flash === 'up' ? 'stat-glow-up' : flash === 'down' ? 'stat-glow-down' : ''}`}
      >
        {value}
      </motion.div>
    </div>
  );
}
