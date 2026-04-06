import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { CheckoutModal } from './CheckoutModal';

type FlyChip = { id: number; emoji: string; label: string; x: number; y: number };

const panelVariants = {
  initial: { opacity: 0, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.995 },
};

export function GameScreen() {
  const s = useGameStore();
  const reducedMotion = useReducedMotion();
  const cartRef = useRef<HTMLDivElement | null>(null);
  const [flyChips, setFlyChips] = useState<FlyChip[]>([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [cartPulse, setCartPulse] = useState(0);

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
  const spendPct = Math.min(100, ((500 - s.budget) / 500) * 100);

  useEffect(() => {
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  const runAddToCart = (cardId: string, e: React.MouseEvent<HTMLButtonElement>, emoji: string, name: string) => {
    if (!reducedMotion) {
      setCartPulse((v) => v + 1);
    }

    if (reducedMotion || !cartRef.current) return s.addToCart(cardId);
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#222220] px-4 py-4 sm:px-6">
        <div className="font-extrabold tracking-wide text-purple-light">SPENDTHRIFT</div>
        <div className="flex flex-wrap gap-4 text-center text-xs sm:gap-5">
          <Stat label="💰 Budget" value={`$${s.budget}`} color="text-teal" pulseKey={s.budget} />
          <Stat label="⚡ Dopamine" value={`${s.dopamine}`} color="text-purple-light" pulseKey={s.dopamine} />
          <Stat label="😬 Regret" value={`${s.regret}%`} color="text-[#e07050]" pulseKey={s.regret} />
          <Stat label="🔄 Round" value={`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`} color="text-white" pulseKey={s.round} />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <MenuPill active={s.activeMenu === 'shop'} onClick={() => s.setActiveMenu('shop')} label="Shop/Game" />
          <MenuPill active={s.activeMenu === 'inventory'} onClick={() => s.setActiveMenu('inventory')} label="Inventory" />
          <MenuPill active={s.activeMenu === 'subscription'} onClick={() => s.setActiveMenu('subscription')} label="Subscription" />
        </div>
        <div className="h-2 overflow-hidden rounded bg-white/10">
          <motion.div
            animate={{ width: `${mood}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal"
          />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
          <motion.div
            animate={{ width: `${spendPct}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded bg-gradient-to-r from-teal via-purple to-[#e07050]"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          {s.activeMenu === 'shop' && (
            <motion.div key="menu-shop" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {s.hand.map((card) => {
                  const inCart = s.cart.some((c) => c.id === card.id);
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={reducedMotion ? undefined : { y: -2, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                      className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#403f3d] to-bg-card p-3 text-center shadow-[0_8px_26px_rgba(0,0,0,0.2)]"
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
                        <Button className="mt-2 w-full bg-coral text-xs text-white" onClick={() => s.playSpecial(card.id)}>Play Card</Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                key={cartPulse}
                ref={cartRef}
                animate={reducedMotion ? undefined : { boxShadow: ['0 0 0 rgba(83,74,183,0)', '0 0 0 2px rgba(83,74,183,0.35)', '0 0 0 rgba(83,74,183,0)'] }}
                transition={{ duration: 0.42, ease: [0.2, 0.9, 0.2, 1] }}
                className="rounded-2xl border border-white/10 bg-bg-card p-4"
              >
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5)</div>
                <div className="mb-3 flex min-h-10 flex-wrap gap-2">
                  {s.cart.length === 0 ? <span className="text-sm italic text-zinc-500">No items yet</span> : s.cart.map((c) => (
                    <motion.span layout key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">
                      {c.emoji} {c.name} (${c.paidPrice})
                      <button className="ml-1 opacity-80 hover:opacity-100" onClick={() => s.removeFromCart(c.id)}>×</button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={s.openCheckout} disabled={s.cart.length === 0}>Checkout →</Button>
                  <button className="text-sm text-zinc-500 transition hover:text-zinc-300" onClick={s.clearCart}>Clear Cart</button>
                  {s.cart.length > 0 && <span className="pill bg-purple/20 text-purple-light">+{cartD} dopamine</span>}
                </div>
              </motion.div>
            </motion.div>
          )}

          {s.activeMenu === 'inventory' && (
            <motion.div key="menu-inventory" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.22 }} className="rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="mb-2 text-sm font-semibold">Purchased Inventory (persistent)</div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <input className="rounded-md border border-white/10 bg-bg p-2 text-sm" placeholder="Search item" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select className="rounded-md border border-white/10 bg-bg p-2 text-sm" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                  {stores.map((store) => <option key={store} value={store}>{store === 'all' ? 'All stores' : store}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {filteredInventory.length === 0 && <div className="text-sm text-zinc-500">No inventory matches this filter.</div>}
                {filteredInventory.map((item) => (
                  <motion.div key={item.id} layout className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                    <div className="flex justify-between"><div>{item.emoji} {item.name}</div><div>Qty {item.quantity}</div></div>
                    <div className="text-xs text-zinc-400">Purchase ${item.lastPurchasePrice.toFixed(2)} • {new Date(item.lastPurchasedAt).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">Total spent ${item.totalSpent.toFixed(2)} • Original ${item.totalOriginalSpent.toFixed(2)}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {s.activeMenu === 'subscription' && (
            <motion.div key="menu-subscription" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.22 }} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="text-sm font-semibold">Subscription & Payments</div>
              <div className="flex flex-wrap gap-2">
                <button className={`pill ${s.paymentMode === 'real-display' ? 'bg-purple text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('real-display')}>Real pricing (display only)</button>
                <button className={`pill ${s.paymentMode === 'demo-free' ? 'bg-teal text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('demo-free')}>Demo free checkout</button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {s.subscriptionPlans.map((plan) => (
                  <motion.div key={plan.id} whileHover={reducedMotion ? undefined : { y: -2 }} className={`rounded-lg border p-3 ${s.subscription.currentPlanId === plan.id ? 'border-purple bg-purple/10' : 'border-white/10 bg-black/20'}`}>
                    <div className="text-lg font-bold">{plan.name}</div>
                    <div className="text-sm text-coral">${plan.price}/mo</div>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-400">{plan.perks.map((perk) => <li key={perk}>• {perk}</li>)}</ul>
                    <Button className="mt-3 w-full" onClick={() => s.buySubscription(plan.id)}>Choose Plan</Button>
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
              animate={{ x: toX, y: toY, opacity: 0.2, scale: 0.72 }}
              transition={{ duration: 0.6, ease: [0.18, 0.9, 0.3, 1] }}
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

function Stat({ label, value, color, pulseKey }: { label: string; value: string; color: string; pulseKey: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pulseKey}
          initial={{ y: 5, opacity: 0.45 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -4, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`text-lg font-bold ${color}`}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MenuPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`pill ${active ? 'bg-purple text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-zinc-100'}`}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}
