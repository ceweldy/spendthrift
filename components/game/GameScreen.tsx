import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { getCardPricing } from '@/lib/game-engine';
import { CheckoutModal } from './CheckoutModal';
import { playSfx } from '@/lib/audio-manager';
import type { Card } from '@/types/game';

type FlyChip = { id: number; emoji: string; label: string; x: number; y: number };
type ImpactBurst = { id: number; text: string; tone: 'good' | 'warn' | 'neutral' };
type CheckoutConfettiPiece = {
  id: string;
  left: string;
  size: number;
  rotate: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const panelVariants = {
  initial: { opacity: 0, y: 28, scale: 0.94, rotateX: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -18, scale: 0.95, rotateX: -8, filter: 'blur(4px)' },
};

const rarityLabel: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function GameScreen() {
  const s = useGameStore();
  const reducedMotion = useReducedMotion();
  const cartRef = useRef<HTMLDivElement | null>(null);
  const [flyChips, setFlyChips] = useState<FlyChip[]>([]);
  const [impactBursts, setImpactBursts] = useState<ImpactBurst[]>([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [cartPulse, setCartPulse] = useState(0);
  const [checkoutConfetti, setCheckoutConfetti] = useState<CheckoutConfettiPiece[]>([]);
  const prevRoundRef = useRef(s.round);
  const prevAnnouncementRef = useRef<string | null>(s.announcement);
  const prevActivityHeadRef = useRef<string | undefined>(s.activityLog[0]);
  const mountedRef = useRef(false);

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
  const spendPct = Math.min(100, ((500 - s.budget) / 500) * 100);
  const minPriceInHand = Math.min(...s.hand.filter((c) => c.type === 'product').map((c) => getCardPricing(s, c).finalPrice), Number.POSITIVE_INFINITY);
  const cannotAffordAny = minPriceInHand !== Number.POSITIVE_INFINITY && s.budget < minPriceInHand;

  const pushImpact = useCallback((text: string, tone: ImpactBurst['tone']) => {
    if (reducedMotion) return;
    const burst = { id: Date.now() + Math.floor(Math.random() * 1000), text, tone };
    setImpactBursts((v) => [...v, burst]);
    setTimeout(() => setImpactBursts((v) => v.filter((b) => b.id !== burst.id)), 1150);
  }, [reducedMotion]);

  const buildCheckoutConfetti = useCallback((): CheckoutConfettiPiece[] => {
    const count = typeof window !== 'undefined' && window.innerWidth < 640 ? 64 : 110;
    return Array.from({ length: count }, (_, i) => {
      const hue = [36, 172, 262, 12, 206][i % 5];
      const spread = (i / count) * Math.PI - Math.PI / 2;
      return {
        id: `${Date.now()}-${i}`,
        left: `${5 + ((i * 13) % 90)}%`,
        size: 4 + (i % 5),
        rotate: -220 + Math.random() * 440,
        color: `hsl(${hue} 92% ${56 + (i % 3) * 8}%)`,
        driftX: Math.cos(spread) * (180 + Math.random() * 260),
        driftY: 130 + Math.random() * 200,
        duration: 1.15 + (i % 7) * 0.13,
        delay: (i % 9) * 0.01,
      };
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRoundRef.current = s.round;
      prevAnnouncementRef.current = s.announcement;
      prevActivityHeadRef.current = s.activityLog[0];
      return;
    }

    if (s.round > prevRoundRef.current) {
      const isPayday = Boolean(s.announcement && /payday/i.test(s.announcement));
      playSfx(isPayday ? 'payday' : 'roundTransition');
      if (!reducedMotion) pushImpact(isPayday ? 'PAYDAY +BUDGET' : 'NEXT ROUND', 'good');
      prevRoundRef.current = s.round;
    }

    if (s.announcement !== prevAnnouncementRef.current) {
      if (s.announcement && /payday/i.test(s.announcement) && s.round === prevRoundRef.current) {
        playSfx('payday');
      }
      prevAnnouncementRef.current = s.announcement;
    }

    const newestActivity = s.activityLog[0];
    const checkoutJustCompleted = newestActivity !== prevActivityHeadRef.current && /checkout complete:/i.test(newestActivity ?? '');
    if (checkoutJustCompleted) {
      playSfx('checkoutConfirm');
      if (!reducedMotion) {
        setCheckoutConfetti(buildCheckoutConfetti());
        pushImpact('ORDER PLACED! 🎉', 'good');
        setTimeout(() => setCheckoutConfetti([]), 1900);
      }
    }

    prevActivityHeadRef.current = newestActivity;
  }, [s.round, s.announcement, s.activityLog, reducedMotion, pushImpact, buildCheckoutConfetti]);

  const runAddToCart = (cardId: string, e: React.MouseEvent<HTMLButtonElement>, emoji: string, name: string) => {
    if (!reducedMotion) {
      setCartPulse((v) => v + 1);
      pushImpact(`${emoji} added`, 'good');
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

  const activityLines = useMemo(() => {
    if (s.activityLog.length > 0) return s.activityLog;
    if (s.history.length > 0) return s.history.map((entry) => entry.text);
    return ['No activity yet. Play a card or complete checkout to populate this feed.'];
  }, [s.activityLog, s.history]);

  return (
    <section className="screen-wrap relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#222220] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 font-extrabold tracking-wide text-purple-light"><span aria-hidden>🛍️</span><span>SPENDTHRIFT</span></div>
        <div className="flex flex-wrap gap-4 text-center text-xs sm:gap-5">
          <Stat label="💰 Budget" help="Money available to spend in this run." value={`$${s.budget}`} color="text-teal" pulseKey={s.budget} />
          <Stat label="⚡ Dopamine" help="Your score driver from purchases/events." value={`${s.dopamine}`} color="text-purple-light" pulseKey={s.dopamine} />
          <Stat label="😬 Regret" help="Higher regret lowers final score." value={`${s.regret}%`} color="text-[#ff8d69]" pulseKey={s.regret} />
          <Stat label="🔄 Round" help={`Every ${s.paydayEvery} rounds you get +$${s.paydayAmount} payday budget.`} value={`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`} color="text-white" pulseKey={s.round} />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <MenuPill active={s.activeMenu === 'shop'} onClick={() => s.setActiveMenu('shop')} label="Shop/Game" />
          <MenuPill active={s.activeMenu === 'inventory'} onClick={() => s.setActiveMenu('inventory')} label="Inventory" />
          <MenuPill active={s.activeMenu === 'activity'} onClick={() => s.setActiveMenu('activity')} label="Activity" />
        </div>
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300"><span>Mood Meter</span><span>{Math.round(mood)}%</span></div>
          <div title="Higher mood means your run is trending better." className="h-3 overflow-hidden rounded border border-white/20 bg-black/40">
            <motion.div
              animate={{ width: `${mood}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300"><span>Budget Used</span><span>{Math.round(spendPct)}%</span></div>
          <div title="How much of the starting $500 has been used this run." className="h-3 overflow-hidden rounded border border-white/20 bg-black/40">
            <motion.div
              animate={{ width: `${spendPct}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded bg-gradient-to-r from-teal via-purple to-[#e07050]"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        {s.announcement && <div className="announcement-pulse mb-4 rounded-lg border border-teal/40 bg-teal/15 p-3 text-sm font-semibold text-teal">{s.announcement}</div>}
        {s.activeMenu === 'shop' && <EffectStatePanel state={s} />}
        <AnimatePresence mode="sync" initial={false}>
          {s.activeMenu === 'shop' && (
            <motion.div key="menu-shop" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {s.hand.map((card) => {
                  const inCart = s.cart.some((c) => c.id === card.id);
                  const rarity = getCardRarity(card);
                  const isFoil = rarity === 'epic' || rarity === 'legendary';

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={reducedMotion ? undefined : { y: -14, scale: 1.08, rotateX: 13, rotateY: -12, rotateZ: -1.4 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      style={reducedMotion ? undefined : { transformStyle: 'preserve-3d', perspective: 1200 }}
                      className={`tcg-card rarity-${rarity}`}
                    >
                      <div className={`tcg-foil ${isFoil ? 'opacity-100' : 'opacity-0'}`} />
                      <div className="tcg-face tcg-front">
                          <div className="tcg-topline">
                            <span className={`tcg-rarity-badge rarity-${rarity}`}>{rarityLabel[rarity]}</span>
                            <span className="tcg-type">{card.type.toUpperCase()}</span>
                          </div>

                          <div className="tcg-art-frame">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getCardArtUrl(card)} alt={card.name} className="tcg-art-image" loading="lazy" onError={(e) => { e.currentTarget.src = getFallbackArt(card); }} />
                            <div className="tcg-art-vignette" />
                            <div className="tcg-emoji-badge">{card.emoji}</div>
                          </div>

                          <div className="mt-2 text-sm font-bold leading-tight">{card.name}</div>
                          <div className="text-[11px] text-zinc-400">{card.brand ?? card.store} • {card.category ?? card.store}</div>
                          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-300">{card.description ?? card.desc ?? 'No description provided.'}</p>

                          {card.type === 'product' ? (
                            (() => {
                              const pricing = getCardPricing(s, card);
                              const isOnSale = pricing.savings > 0;
                              const roundSaleRate = s.randomDiscountSecondsLeft > 0 ? s.randomDiscounts[card.id] : 0;

                              return (
                                <>
                                  {isOnSale ? (
                                    <div className="mt-1 inline-flex rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">SALE -{pricing.discountPercent}%</div>
                                  ) : null}
                                  <div className="mt-1 flex items-baseline gap-2">
                                    {isOnSale ? <span className="text-xs text-zinc-500 line-through">${pricing.basePrice}</span> : null}
                                    <div className="text-lg font-bold text-[#ffb18d]">${pricing.finalPrice}</div>
                                  </div>
                                  {!!pricing.applied.length && <div className="text-[10px] text-red-300">{pricing.applied.join(' • ')}</div>}
                                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-zinc-300">
                                    <span className="tcg-mini-pill">⚡ {card.dopamine ?? 0}</span>
                                    <span className="tcg-mini-pill">😬 {card.risk ?? 0}</span>
                                    {isOnSale && <span className="tcg-mini-pill">Save ${pricing.savings}</span>}
                                    {roundSaleRate ? <span className="tcg-mini-pill">⏳ {s.randomDiscountSecondsLeft}s</span> : null}
                                    {card.premiumOnly && <span className="tcg-mini-pill">👑 Premium</span>}
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-coral">{card.type}</div>
                          )}

                          <div className="mt-2 space-y-1">
                            {getCardEffectLines(card).map((line) => (
                              <div key={`${card.id}-${line}`} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-left text-[10px] leading-relaxed text-zinc-200">{line}</div>
                            ))}
                          </div>

                          {card.type === 'product' ? (
                            <Button className="mt-2 w-full text-xs" disabled={inCart} onClick={(e) => runAddToCart(card.id, e, card.emoji, card.name)}>
                              {inCart ? 'In Cart ✓' : 'Add to Cart'}
                            </Button>
                          ) : (
                            <Button className="mt-2 w-full bg-coral text-xs text-white" onClick={() => { s.playSpecial(card.id); pushImpact('effect triggered', 'neutral'); }}>Play Card</Button>
                          )}
                        </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                key={cartPulse}
                ref={cartRef}
                animate={reducedMotion ? undefined : { scale: [1, 1.035, 0.995, 1.02, 1], boxShadow: ['0 0 0 rgba(83,74,183,0)', '0 0 0 5px rgba(83,74,183,0.65)', '0 0 0 0 rgba(83,74,183,0)', '0 0 0 7px rgba(29,158,117,0.5)', '0 0 0 rgba(29,158,117,0)'] }}
                transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
                className="rounded-2xl border border-white/10 bg-bg-card p-4"
              >
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5)</div>
                <div className="mb-3 flex min-h-10 flex-wrap gap-2">
                  {s.cart.length === 0 ? <span className="text-sm italic text-zinc-500">No items yet</span> : s.cart.map((c) => (
                    <motion.span layout key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">
                      {c.emoji} {c.name} (${c.paidPrice})
                      <button className="ml-1 opacity-80 hover:opacity-100" onClick={() => { s.removeFromCart(c.id); pushImpact('removed', 'warn'); }}>×</button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={s.openCheckout} disabled={s.cart.length === 0}>Checkout →</Button>
                  <button className="text-sm text-zinc-500 transition hover:text-zinc-300" onClick={() => { s.clearCart(); pushImpact('cart cleared', 'warn'); }}>Clear Cart</button>
                  <button className="text-sm text-zinc-400 transition hover:text-zinc-200" onClick={() => { s.skipCurrentRound(); pushImpact('round skipped', 'neutral'); }}>Skip Round</button>
                  {s.cart.length > 0 && <span className="pill bg-purple/20 text-purple-light">+{cartD} dopamine</span>}
                </div>
                {cannotAffordAny && <div className="mt-2 text-xs text-amber">No affordable products in hand. Use Skip Round to cycle cards until payday.</div>}
              </motion.div>
            </motion.div>
          )}

          {s.activeMenu === 'inventory' && (
            <motion.div key="menu-inventory" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.22 }} className="rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="mb-2 text-sm font-semibold">Purchased Inventory (persistent)</div>
              <div className="mb-3 text-xs text-zinc-400">Items: {s.inventory.reduce((a, i) => a + i.quantity, 0)} • Paid Total: ${s.inventory.reduce((a, i) => a + i.totalSpent, 0).toFixed(2)} • Original Total: ${s.inventory.reduce((a, i) => a + i.totalOriginalSpent, 0).toFixed(2)}</div>
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

          {s.activeMenu === 'activity' && (
            <motion.div key="menu-activity" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.22 }} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="text-sm font-semibold">Activity & Payment Settings</div>
              <div className="flex flex-wrap gap-2">
                <button className={`pill ${s.paymentMode === 'real-display' ? 'bg-purple text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('real-display')}>Real pricing (display only)</button>
                <button className={`pill ${s.paymentMode === 'demo-free' ? 'bg-teal text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('demo-free')}>Demo free checkout</button>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Recent Activity</div>
                <div className="max-h-60 space-y-2 overflow-auto text-sm">
                  {activityLines.slice(0, 12).map((line, idx) => (
                    <div key={`${line}-${idx}`} className="border-b border-white/5 pb-1 text-zinc-300">• {line}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {impactBursts.map((burst) => (
          <motion.div
            key={burst.id}
            className={`pointer-events-none fixed left-1/2 top-28 z-[65] -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              burst.tone === 'good' ? 'bg-teal/20 text-teal' : burst.tone === 'warn' ? 'bg-[#e07050]/20 text-[#ff9f84]' : 'bg-purple/25 text-purple-light'
            }`}
            initial={{ y: 20, opacity: 0, scale: 0.7, rotate: -6 }}
            animate={{ y: -80, opacity: [0, 1, 1, 0], scale: [0.7, 1.25, 1.08, 0.95], rotate: [-6, 4, -3, 2], filter: ['blur(2px)', 'blur(0px)', 'blur(0px)', 'blur(2px)'] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.18, 0.9, 0.3, 1] }}
          >
            {burst.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {flyChips.map((chip) => {
          const targetRect = cartRef.current?.getBoundingClientRect();
          const toX = targetRect ? targetRect.left + targetRect.width / 2 : chip.x;
          const toY = targetRect ? targetRect.top + 20 : chip.y;
          return (
            <motion.div
              key={chip.id}
              className="pointer-events-none fixed z-[60] rounded-full border border-purple/40 bg-[#2b284d] px-3 py-1 text-xs text-purple-light"
              initial={{ x: chip.x, y: chip.y, scale: 0.75, rotate: -10, opacity: 0.95 }}
              animate={{ x: toX, y: toY, opacity: [1, 1, 0.25], scale: [0.75, 1.2, 0.62], rotate: [0, 16, -8] }}
              transition={{ duration: 0.82, ease: [0.18, 0.9, 0.3, 1] }}
              exit={{ opacity: 0 }}
            >
              {chip.emoji} {chip.label}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutConfetti.length > 0 && (
          <motion.div className="pointer-events-none fixed inset-0 z-[62] overflow-hidden" aria-hidden>
            {checkoutConfetti.map((piece) => (
              <motion.span
                key={piece.id}
                className="absolute -top-6 block rounded-[2px]"
                style={{
                  left: piece.left,
                  width: piece.size,
                  height: Math.max(4, piece.size * 0.66),
                  backgroundColor: piece.color,
                  boxShadow: '0 0 10px rgba(255,255,255,0.12)',
                }}
                initial={{ y: -20, x: 0, rotate: 0, opacity: 0 }}
                animate={{ y: piece.driftY, x: piece.driftX, rotate: piece.rotate, opacity: [0, 1, 1, 0] }}
                transition={{ duration: piece.duration, ease: 'easeOut', delay: piece.delay }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutModal />
    </section>
  );
}

function getCardRarity(card: Card): Rarity {
  if (card.type === 'power') return card.effect === 'designer' ? 'legendary' : 'epic';
  if (card.type === 'event') return ['cashback', 'stock-drop', 'loyalty-points'].includes(card.effect ?? '') ? 'rare' : 'uncommon';
  if (card.type === 'trap') return ['doom-scroll', 'future-remorse'].includes(card.effect ?? '') ? 'rare' : 'uncommon';
  if (card.premiumOnly) {
    if ((card.price ?? 0) >= 500) return 'legendary';
    if ((card.price ?? 0) >= 350) return 'epic';
    return 'rare';
  }
  if ((card.price ?? 0) >= 150 || (card.dopamine ?? 0) >= 20) return 'rare';
  if ((card.price ?? 0) >= 75 || (card.dopamine ?? 0) >= 12) return 'uncommon';
  return 'common';
}

function getCardArtUrl(card: Card) {
  if (card.imageUrl) return card.imageUrl;
  const seed = encodeURIComponent(`${card.id}-${card.name}-${card.store}`);
  return `https://picsum.photos/seed/${seed}/900/700`;
}

function getFallbackArt(card: Card) {
  const label = encodeURIComponent(card.name);
  const bg = card.type === 'product' ? '2d2a4a' : card.type === 'power' ? '3b2d12' : card.type === 'trap' ? '4a2323' : '233a3a';
  return `https://placehold.co/900x700/${bg}/f1efe8?text=${label}`;
}

function Stat({ label, help, value, color, pulseKey }: { label: string; help?: string; value: string; color: string; pulseKey: string | number }) {
  return (
    <div title={help}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</div>
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
      className={`pill ${active ? 'bg-purple text-white glow-pulse' : 'bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-zinc-100'}`}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}

type EffectPanelState = ReturnType<typeof useGameStore.getState>;

function EffectStatePanel({ state }: { state: EffectPanelState }) {
  const effects = getActiveEffectStates(state);

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 text-xs uppercase tracking-[0.16em] text-zinc-400">Armed / Active Effects</div>
      {effects.length === 0 ? (
        <div className="text-xs text-zinc-500">No temporary effects armed right now.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {effects.map((effect) => (
            <span key={effect.label} className={`pill border ${effect.active ? 'border-teal/60 bg-teal/20 text-teal' : 'border-amber/50 bg-amber/20 text-amber'}`}>
              {effect.active ? '🟢 Active' : '🟡 Armed'} · {effect.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getActiveEffectStates(state: EffectPanelState): Array<{ label: string; active: boolean }> {
  const out: Array<{ label: string; active: boolean }> = [];
  if (state.flashSaleSecondsLeft > 0) out.push({ label: `Flash Sale (${state.flashSaleSecondsLeft}s left)`, active: true });
  if (state.randomDiscountSecondsLeft > 0) {
    const saleCount = Object.keys(state.randomDiscounts ?? {}).length;
    out.push({ label: `Round SALE (${saleCount} item${saleCount === 1 ? '' : 's'} · ${state.randomDiscountSecondsLeft}s left)`, active: true });
  }
  if (state.nextDiscount > 0) out.push({ label: `Price Match (${Math.round(state.nextDiscount * 100)}% off next product)`, active: false });
  if (state.shippingDiscount > 0) out.push({ label: `Checkout discount -$${state.shippingDiscount}`, active: false });
  if (state.fomoBoost) out.push({ label: 'FOMO (+4 dopamine on next product)', active: false });
  if (state.quickBuy) out.push({ label: 'Quick Buy (+5 dopamine on next product)', active: false });
  if (state.cashbackRate > 0) out.push({ label: `Cashback (${Math.round(state.cashbackRate * 100)}% on checkout)`, active: false });
  if (state.roundDopamineBoost > 0) out.push({ label: `Round hype (+${state.roundDopamineBoost} dopamine this round)`, active: true });
  if (state.techDiscountRate > 0) out.push({ label: `Tech markdown (${Math.round(state.techDiscountRate * 100)}% this round)`, active: true });
  if (state.nextCheckoutRegret > 0) out.push({ label: `Checkout regret +${state.nextCheckoutRegret}`, active: false });
  if (state.halfRegretGain) out.push({ label: 'Regret gain halved on next checkout', active: false });
  state.pendingRegret.forEach((pending) => {
    const roundsLeft = pending.dueRound - state.round;
    out.push({ label: `${pending.source}: +${pending.amount} regret in ${Math.max(0, roundsLeft)} round${Math.abs(roundsLeft) === 1 ? '' : 's'}`, active: false });
  });
  return out;
}

function getCardEffectLines(card: Card): string[] {
  if (card.type === 'product') {
    return [
      `Now: Add to cart for current price (base $${card.price ?? 0}).`,
      `Checkout: Gain +${card.dopamine ?? 0} dopamine from this item.`,
      `Checkout: Adds risk ${card.risk ?? 0} into regret calculation.`,
    ];
  }

  switch (card.effect) {
    case 'flash-sale':
      return ['Now: Start Flash Sale immediately.', 'This round: All product prices are 30% off for 20 seconds.'];
    case 'declined':
      return ['Now: Lose 10 dopamine instantly.'];
    case 'refund':
      return ['Now: Gain $40 budget immediately.'];
    case 'fomo':
      return ['Now: Arm FOMO boost.', 'Next product added this round gets +4 dopamine, then effect clears.'];
    case 'gift':
      return ['Now: Gain +8 dopamine instantly.'];
    case 'cashback':
      return ['Now: Arm cashback.', 'Next checkout returns 10% of charged total.'];
    case 'influencer-hype':
      return ['Now: Apply round hype.', 'This round: Products added to cart gain +2 dopamine.'];
    case 'stock-drop':
      return ['Now: Apply tech markdown.', 'This round: Tech products are 15% cheaper.'];
    case 'cart-abandon':
      return ['Now: Arm checkout penalty.', 'Next checkout adds +5 regret.'];
    case 'loyalty-points':
      return ['Now: Gain +6 dopamine instantly.', 'Next checkout gets an extra -$10 discount.'];
    case 'ship15':
      return ['Now: Arm shipping discount.', 'Next checkout gets -$15 total.'];
    case 'price-match':
      return ['Now: Arm price match.', 'Next product added is 40% off.'];
    case 'quick-buy':
      return ['Now: Arm quick-buy boost.', 'Next product added gets +5 dopamine.'];
    case 'designer':
      return ['Now: Gain +60 dopamine instantly.'];
    case 'calm':
      return ['Now: Reduce current regret by 8 (minimum 0).'];
    case 'sub-trap':
      return ['Now: Arm trap.', 'Next checkout adds +8 regret.'];
    case 'future-remorse':
      return ['Now: Queue delayed remorse.', 'Next round: +10 regret when new hand is dealt.'];
    case 'impulse-auto':
      return ['Now: Auto-add cheapest product currently in hand to cart.'];
    case 'doom-scroll':
      return ['Now: Queue delayed regret.', 'In 2 rounds: +12 regret when new hand is dealt.'];
    case 'return-window':
      return ['Now: Queue delayed regret.', 'In 2 rounds: +8 regret when new hand is dealt.'];
    default:
      return ['Effect: No explicit effect text configured.'];
  }
}
