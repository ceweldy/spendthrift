import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useGameStore } from '@/store/useGameStore';
import { getCardPricing } from '@/lib/game-engine';
import { CheckoutModal } from './CheckoutModal';
import { playSfx } from '@/lib/audio-manager';
import { getAnimationDurationMultiplier, getUxSettings } from '@/lib/ux-settings';
import type { Card } from '@/types/game';

type FlyChip = { id: number; emoji: string; label: string; x: number; y: number };
type ImpactBurst = { id: number; text: string; tone: 'good' | 'warn' | 'neutral' };
type AddBurst = { id: number; x: number; y: number; emoji: string; dopamine: number };
type PullCeremony = { id: number; rarity: Extract<Rarity, 'rare' | 'legendary'>; names: string[] };
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
  const [addBursts, setAddBursts] = useState<AddBurst[]>([]);
  const [pullCeremony, setPullCeremony] = useState<PullCeremony | null>(null);
  const [storeFilter, setStoreFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [cartPulse, setCartPulse] = useState(0);
  const [checkoutConfetti, setCheckoutConfetti] = useState<CheckoutConfettiPiece[]>([]);
  const [animationPreset, setAnimationPreset] = useState(() => getUxSettings().animationPreset);
  const animationDuration = getAnimationDurationMultiplier(animationPreset, !!reducedMotion);
  const prevRoundRef = useRef(s.round);
  const prevAnnouncementRef = useRef<string | null>(s.announcement);
  const prevActivityHeadRef = useRef<string | undefined>(s.activityLog[0]);
  const prevHandIdsRef = useRef<string[]>(s.hand.map((c) => c.id));
  const mountedRef = useRef(false);

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
  const spendPct = Math.min(100, ((500 - s.budget) / 500) * 100);
  const minPriceInHand = Math.min(...s.hand.filter((c) => c.type === 'product').map((c) => getCardPricing(s, c).finalPrice), Number.POSITIVE_INFINITY);
  const cannotAffordAny = s.paymentMode !== 'demo-free' && minPriceInHand !== Number.POSITIVE_INFINITY && s.budget < minPriceInHand;
  const roundSaleCount = Object.keys(s.randomDiscounts ?? {}).length;
  const comboSaleActive = s.randomDiscountSecondsLeft > 0 && roundSaleCount >= 2;

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
    const syncSettings = (event: Event) => {
      const detail = (event as CustomEvent<{ animationPreset?: 'full' | 'balanced' | 'reduced' }>).detail;
      if (detail?.animationPreset) setAnimationPreset(detail.animationPreset);
    };

    window.addEventListener('spendthrift-ux-settings', syncSettings as EventListener);
    return () => window.removeEventListener('spendthrift-ux-settings', syncSettings as EventListener);
  }, []);

  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      return Boolean(element.closest('input, textarea, select, [contenteditable="true"]'));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target) || event.altKey || event.metaKey || event.ctrlKey) return;
      const key = event.key.toLowerCase();

      if (key === '1') s.setActiveMenu('shop');
      else if (key === '2') s.setActiveMenu('inventory');
      else if (key === '3') s.setActiveMenu('activity');
      else if (key === '4') s.setActiveMenu('badges');
      else if (key === 'c' && s.cart.length) s.openCheckout();
      else if (key === 'k') s.skipCurrentRound();
      else if (key === 'x' && s.cart.length) s.clearCart();
      else if (key === 'e' && event.shiftKey) s.endGame();
      else return;

      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [s]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRoundRef.current = s.round;
      prevAnnouncementRef.current = s.announcement;
      prevActivityHeadRef.current = s.activityLog[0];
      prevHandIdsRef.current = s.hand.map((c) => c.id);
      return;
    }

    const previousRound = prevRoundRef.current;
    if (s.round > previousRound) {
      const isPayday = Boolean(s.announcement && /payday/i.test(s.announcement));
      playSfx(isPayday ? 'payday' : 'roundTransition');
      if (!reducedMotion) pushImpact(isPayday ? 'PAYDAY +BUDGET' : 'NEXT ROUND', 'good');
      prevRoundRef.current = s.round;
    }

    if (s.announcement !== prevAnnouncementRef.current) {
      if (s.announcement && /payday/i.test(s.announcement) && s.round === previousRound) {
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

    const previousHandIds = prevHandIdsRef.current;
    const handChanged = previousHandIds.join('|') !== s.hand.map((card) => card.id).join('|');
    if (handChanged) {
      const pulled = s.hand.filter((card) => !previousHandIds.includes(card.id));
      const legendary = pulled.filter((card) => getCardRarity(card) === 'legendary');
      const rare = pulled.filter((card) => getCardRarity(card) === 'rare');
      if (legendary.length || rare.length) {
        const rarity = legendary.length ? 'legendary' : 'rare';
        const names = (legendary.length ? legendary : rare).map((card) => card.name);
        playSfx('rarePull');
        if (reducedMotion) {
          pushImpact(`${rarity.toUpperCase()} PULL: ${names[0]}`, 'good');
        } else {
          const ceremonyId = Date.now();
          setPullCeremony({ id: ceremonyId, rarity, names });
          pushImpact(`${rarity.toUpperCase()} PULL!`, 'good');
          setTimeout(() => setPullCeremony((active) => (active?.id === ceremonyId ? null : active)), 2200);
        }
      }
      prevHandIdsRef.current = s.hand.map((card) => card.id);
    }

    prevActivityHeadRef.current = newestActivity;
  }, [s.round, s.announcement, s.activityLog, s.hand, reducedMotion, pushImpact, buildCheckoutConfetti]);

  const runAddToCart = (cardId: string, e: React.MouseEvent<HTMLButtonElement>, emoji: string, name: string, dopamine: number) => {
    playSfx('addCart');
    setCartPulse((v) => v + 1);
    pushImpact(`${emoji} +${dopamine} dopamine`, 'good');

    const source = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const burstId = Date.now() + Math.floor(Math.random() * 1000);
    setAddBursts((v) => [...v, { id: burstId, x: source.left + source.width / 2, y: source.top + source.height / 2, emoji, dopamine }]);
    setTimeout(() => setAddBursts((v) => v.filter((b) => b.id !== burstId)), reducedMotion ? 200 : 760);

    if (reducedMotion || !cartRef.current) return s.addToCart(cardId);
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

  const unlockedBadgeIds = useMemo(() => new Set(s.achievements.unlocked.map((b) => b.id)), [s.achievements.unlocked]);
  const badgeCards = useMemo(() => {
    return ACHIEVEMENTS.map((badge) => {
      const progressRaw = badge.target(s, s.achievements);
      const progress = Math.min(1, progressRaw / badge.goal);
      return {
        ...badge,
        progressRaw,
        progress,
        unlocked: unlockedBadgeIds.has(badge.id),
      };
    });
  }, [s, unlockedBadgeIds]);

  return (
    <section className="screen-wrap relative flex h-dvh min-h-dvh flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#222220] px-4 py-3 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 font-extrabold tracking-wide text-purple-light"><span aria-hidden>🛍️</span><span>SPENDTHRIFT</span></div>
        <div className="flex flex-wrap gap-3 text-center text-xs sm:gap-4">
          <Stat label="💰 Budget" help="Money available to spend in this run." value={`$${s.budget}`} color="text-teal" pulseKey={s.budget} />
          <Stat label="⚡ Dopamine" help="Your score driver from purchases/events." value={`${s.dopamine}`} color="text-purple-light" pulseKey={s.dopamine} />
          <Stat label="😬 Regret" help="Higher regret lowers final score." value={`${s.regret}%`} color="text-[#ff8d69]" pulseKey={s.regret} />
          <Stat label="🔄 Round" help={`Every ${s.paydayEvery} rounds you get +$${s.paydayAmount} payday budget.`} value={`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`} color="text-white" pulseKey={s.round} />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-4 py-3 sm:px-6 sm:py-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <MenuPill active={s.activeMenu === 'shop'} onClick={() => s.setActiveMenu('shop')} label="Shop/Game" />
          <MenuPill active={s.activeMenu === 'inventory'} onClick={() => s.setActiveMenu('inventory')} label="Inventory" />
          <MenuPill active={s.activeMenu === 'activity'} onClick={() => s.setActiveMenu('activity')} label="Activity" />
          <MenuPill active={s.activeMenu === 'badges'} onClick={() => s.setActiveMenu('badges')} label="Badges" />
          <span className="text-[11px] text-zinc-300">Shortcuts: 1-4 tabs · C checkout · K skip · X clear · Shift+E end</span>
        </div>
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300"><span>Mood Meter</span><span>{Math.round(mood)}%</span></div>
          <div title="Higher mood means your run is trending better." className="h-3 overflow-hidden rounded border border-white/20 bg-black/40">
            <motion.div
              animate={{ width: `${mood}%` }}
              transition={{ duration: 0.35 * animationDuration, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-300"><span>Budget Used</span><span>{Math.round(spendPct)}%</span></div>
          <div title="How much of the starting $500 has been used this run." className="h-3 overflow-hidden rounded border border-white/20 bg-black/40">
            <motion.div
              animate={{ width: `${spendPct}%` }}
              transition={{ duration: 0.3 * animationDuration, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded bg-gradient-to-r from-teal via-purple to-[#e07050]"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        {s.announcement && <div aria-live="polite" className="announcement-pulse mb-4 rounded-lg border border-teal/40 bg-teal/15 p-3 text-sm font-semibold text-teal">{s.announcement}</div>}
        {comboSaleActive ? <div className="combo-sale-alert mb-3">⚡ Combo Sale Surge: {roundSaleCount} discounted cards this round</div> : null}
        {s.activeMenu === 'shop' && <EffectStatePanel state={s} />}
        <AnimatePresence mode="sync" initial={false}>
          {s.activeMenu === 'shop' && (
            <motion.div key="menu-shop" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.24 * animationDuration, ease: [0.22, 1, 0.36, 1] }} className="min-h-0 space-y-6 overflow-y-scroll overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {s.hand.map((card) => {
                  const inCart = s.cart.some((c) => c.id === card.id);
                  const rarity = getCardRarity(card);
                  const isFoil = rarity === 'epic' || rarity === 'legendary';

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={reducedMotion ? undefined : { y: -4, scale: 1.02, rotateX: 4, rotateY: -4, rotateZ: -0.3 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      style={reducedMotion ? undefined : { transformStyle: 'preserve-3d', perspective: 1200 }}
                      className={`tcg-card h-full rarity-${rarity}`}
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
                          <p className="mt-1 min-h-8 line-clamp-2 text-[11px] text-zinc-300">{card.description ?? card.desc ?? 'No description provided.'}</p>

                          {card.type === 'product' ? (
                            (() => {
                              const pricing = getCardPricing(s, card);
                              const isOnSale = pricing.savings > 0;
                              const roundSaleRate = s.randomDiscountSecondsLeft > 0 ? s.randomDiscounts[card.id] : 0;

                              return (
                                <div className="tcg-product-meta mt-1">
                                  <div className="min-h-5">
                                    {isOnSale ? (
                                      <div className="flex flex-wrap gap-1">
                                        <div className="inline-flex rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">SALE -{pricing.discountPercent}%</div>
                                        {pricing.applied.length >= 2 ? <div className="combo-sale-badge">Combo x{pricing.applied.length}</div> : null}
                                      </div>
                                    ) : <span className="inline-block h-[18px]" aria-hidden />}
                                  </div>
                                  <div className="flex min-h-7 items-baseline gap-2">
                                    {isOnSale ? <span className="text-xs text-zinc-500 line-through">${pricing.basePrice}</span> : null}
                                    <div className="text-lg font-bold text-[#ffb18d]">${pricing.finalPrice}</div>
                                  </div>
                                  <div className="min-h-4 text-[10px] text-red-300">{!!pricing.applied.length ? pricing.applied.join(' • ') : <span aria-hidden> </span>}</div>
                                  <div className="mt-1 flex min-h-8 flex-wrap content-start gap-1 text-[10px] text-zinc-300">
                                    <span className="tcg-mini-pill">⚡ {card.dopamine ?? 0}</span>
                                    <span className="tcg-mini-pill">😬 {card.risk ?? 0}</span>
                                    {isOnSale && <span className="tcg-mini-pill">Save ${pricing.savings}</span>}
                                    {roundSaleRate ? <span className="tcg-mini-pill">⏳ {s.randomDiscountSecondsLeft}s</span> : null}
                                    {card.premiumOnly && <span className="tcg-mini-pill">👑 Premium</span>}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="mt-1 min-h-20 text-[10px] font-semibold uppercase tracking-wide text-coral">{card.type}</div>
                          )}

                          <div className="mt-2 min-h-[90px] space-y-1">
                            {getCardEffectLines(card).map((line) => (
                              <div key={`${card.id}-${line}`} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-left text-[10px] leading-relaxed text-zinc-200">{line}</div>
                            ))}
                          </div>

                          <div className="mt-auto pt-2">
                            {card.type === 'product' ? (
                              <Button className="w-full text-xs" disabled={inCart} onClick={(e) => runAddToCart(card.id, e, card.emoji, card.name, card.dopamine ?? 0)}>
                                {inCart ? 'In Cart ✓' : 'Add to Cart'}
                              </Button>
                            ) : (
                              <Button className="w-full bg-coral text-xs text-white" onClick={() => { s.playSpecial(card.id); pushImpact('effect triggered', 'neutral'); }}>Play Card</Button>
                            )}
                          </div>
                        </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                key={cartPulse}
                ref={cartRef}
                animate={reducedMotion ? { scale: [1, 1.02, 1] } : { scale: [1, 1.06, 1.015, 1], boxShadow: ['0 0 0 rgba(83,74,183,0)', '0 0 0 8px rgba(83,74,183,0.42)', '0 0 0 3px rgba(83,74,183,0.26)', '0 0 0 rgba(83,74,183,0)'] }}
                transition={{ duration: reducedMotion ? 0.25 : 1.05, ease: [0.2, 0.9, 0.2, 1] }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-bg-card p-4"
              >
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5)</div>
                <div className="mb-3 flex min-h-10 flex-wrap gap-2">
                  {s.cart.length === 0 ? <span className="text-sm italic text-zinc-500">No items yet</span> : s.cart.map((c) => (
                    <motion.span layout key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">
                      {c.emoji} {c.name} (${c.paidPrice})
                      <button aria-label={`Remove ${c.name} from cart`} className="ml-1 rounded-sm opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-light" onClick={() => { s.removeFromCart(c.id); pushImpact('removed', 'warn'); }}>×</button>
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
            <motion.div key="menu-inventory" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 * animationDuration }} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="mb-2 text-sm font-semibold">Purchased Inventory (persistent)</div>
              <div className="mb-3 text-xs text-zinc-400">Items: {s.inventory.reduce((a, i) => a + i.quantity, 0)} • Paid Total: ${s.inventory.reduce((a, i) => a + i.totalSpent, 0).toFixed(2)} • Original Total: ${s.inventory.reduce((a, i) => a + i.totalOriginalSpent, 0).toFixed(2)}</div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="inventory-search">Search inventory item</label>
                <input id="inventory-search" aria-label="Search inventory item" className="rounded-md border border-white/20 bg-bg p-2 text-sm text-zinc-100" placeholder="Search item" value={query} onChange={(e) => setQuery(e.target.value)} />
                <label className="sr-only" htmlFor="inventory-store-filter">Filter by store</label>
                <select id="inventory-store-filter" aria-label="Filter inventory by store" className="rounded-md border border-white/20 bg-bg p-2 text-sm text-zinc-100" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                  {stores.map((store) => <option key={store} value={store}>{store === 'all' ? 'All stores' : store}</option>)}
                </select>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
            <motion.div key="menu-activity" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 * animationDuration }} className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="text-sm font-semibold">Activity & Payment Settings</div>
              <div className="flex flex-wrap gap-2">
                <button className={`pill ${s.paymentMode === 'real-display' ? 'bg-purple text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('real-display')}>Real pricing (display only)</button>
                <button className={`pill ${s.paymentMode === 'demo-free' ? 'bg-teal text-black' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`} onClick={() => s.setCheckoutMode('demo-free')}>Demo free checkout</button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Recent Activity</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto text-sm">
                  {activityLines.slice(0, 12).map((line, idx) => (
                    <div key={`${line}-${idx}`} className="border-b border-white/5 pb-1 text-zinc-300">• {line}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {s.activeMenu === 'badges' && (
            <motion.div key="menu-badges" variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 * animationDuration }} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card p-4">
              <div className="mb-1 text-sm font-semibold">Badges & Milestones</div>
              <div className="mb-3 text-xs text-zinc-400">Unlocked {s.achievements.unlocked.length}/{ACHIEVEMENTS.length} • Bonus dopamine earned: +{s.achievements.totalRewardDopamine}</div>
              <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {badgeCards.map((badge) => {
                  const isHiddenLocked = Boolean(badge.hidden && !badge.unlocked);
                  return (
                    <div key={badge.id} className={`rounded-xl border p-3 ${badge.unlocked ? 'border-amber/50 bg-amber/10' : 'border-white/10 bg-black/20'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{isHiddenLocked ? '❓ ???' : `${badge.icon} ${badge.title}`}</div>
                        <span className={`pill ${badge.unlocked ? 'bg-teal/25 text-teal' : 'bg-white/10 text-zinc-400'}`}>{badge.unlocked ? 'Unlocked' : isHiddenLocked ? 'Secret' : 'Locked'}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-300">{isHiddenLocked ? 'Hidden badge. Keep playing to reveal unlock conditions.' : badge.description}</div>
                      <div className="mt-2 h-2 overflow-hidden rounded bg-black/40">
                        <motion.div className={`h-full ${badge.unlocked ? 'bg-teal' : 'bg-purple'}`} animate={{ width: `${Math.max(4, isHiddenLocked ? 0 : badge.progress * 100)}%` }} transition={{ duration: 0.35 * animationDuration }} />
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-400">{isHiddenLocked ? `Progress: Hidden/${badge.goal} • Reward +${badge.reward} dopamine` : `Progress: ${Math.min(badge.goal, Math.round(badge.progressRaw))}/${badge.goal} • Reward +${badge.reward} dopamine`}</div>
                    </div>
                  );
                })}
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
        {addBursts.map((burst) => (
          <motion.div
            key={burst.id}
            className="pointer-events-none fixed z-[61] text-sm font-black text-amber-200 drop-shadow-[0_0_12px_rgba(255,186,95,0.7)]"
            initial={reducedMotion ? { x: burst.x - 10, y: burst.y - 16, opacity: 0.9 } : { x: burst.x - 20, y: burst.y - 10, opacity: 0, scale: 0.6, rotate: -12 }}
            animate={reducedMotion ? { x: burst.x, y: burst.y - 28, opacity: 1 } : { x: [burst.x - 20, burst.x + 8, burst.x - 6], y: [burst.y - 10, burst.y - 56, burst.y - 92], opacity: [0, 1, 1, 0], scale: [0.6, 1.35, 1.05, 0.92], rotate: [-12, 8, -4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.76, ease: [0.18, 0.9, 0.3, 1] }}
          >
            {burst.emoji} +{burst.dopamine}
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

      <AnimatePresence>
        {pullCeremony ? (
          <motion.div
            key={pullCeremony.id}
            className="pull-ceremony"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.34 }}
          >
            <div className={`pull-ceremony-card ${pullCeremony.rarity === 'legendary' ? 'is-legendary' : 'is-rare'}`}>
              <div className="pull-ceremony-title">{pullCeremony.rarity === 'legendary' ? '🌟 LEGENDARY PULL!' : '✨ RARE PULL!'}</div>
              <div className="pull-ceremony-name">{pullCeremony.names[0]}</div>
              {pullCeremony.names.length > 1 ? <div className="pull-ceremony-sub">+{pullCeremony.names.length - 1} more high-rarity draw{pullCeremony.names.length - 1 === 1 ? '' : 's'}</div> : null}
            </div>
          </motion.div>
        ) : null}
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
      type="button"
      whileTap={{ scale: 0.97 }}
      className={`pill ${active ? 'bg-purple text-white glow-pulse' : 'bg-white/10 text-zinc-200 hover:bg-white/15 hover:text-zinc-100'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-light`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Open ${label} tab`}
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
    const comboSuffix = saleCount >= 2 ? ' · Combo!' : '';
    out.push({ label: `Round SALE (${saleCount} item${saleCount === 1 ? '' : 's'} · ${state.randomDiscountSecondsLeft}s left${comboSuffix})`, active: true });
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
      `Now: Add to cart at current price (base $${card.price ?? 0}).`,
      `Checkout: +${card.dopamine ?? 0} dopamine.`,
      `Trade-off: Risk ${card.risk ?? 0} adds to regret.`,
    ];
  }

  switch (card.effect) {
    case 'flash-sale':
      return ['Now: Start Flash Sale.', 'This round: 30% off all products for 20s.'];
    case 'declined':
      return ['Now: Lose 10 dopamine.'];
    case 'refund':
      return ['Now: Gain $40 budget.'];
    case 'fomo':
      return ['Now: Arm FOMO.', 'Next product added this round gets +4 dopamine.'];
    case 'gift':
      return ['Now: Gain +8 dopamine.'];
    case 'cashback':
      return ['Now: Arm cashback.', 'Next checkout returns 10% of charged total.'];
    case 'influencer-hype':
      return ['Now: Apply hype.', 'This round: Products added get +2 dopamine.'];
    case 'stock-drop':
      return ['Now: Mark down Tech.', 'This round: Tech products are 15% off.'];
    case 'cart-abandon':
      return ['Now: Arm penalty.', 'Next checkout adds +5 regret.'];
    case 'loyalty-points':
      return ['Now: Gain +6 dopamine.', 'Next checkout gets an extra -$10.'];
    case 'ship15':
      return ['Now: Arm shipping discount.', 'Next checkout gets -$15 total.'];
    case 'price-match':
      return ['Now: Arm price match.', 'Next product added is 40% off.'];
    case 'quick-buy':
      return ['Now: Arm quick buy.', 'Next product added gets +5 dopamine.'];
    case 'designer':
      return ['Now: Gain +60 dopamine.'];
    case 'calm':
      return ['Now: Reduce current regret by 8 (minimum 0).'];
    case 'sub-trap':
      return ['Now: Arm trap.', 'Next checkout adds +8 regret.'];
    case 'future-remorse':
      return ['Now: Queue delayed regret.', 'Next hand deal: +10 regret.'];
    case 'impulse-auto':
      return ['Now: Auto-buy the cheapest product currently in hand.'];
    case 'doom-scroll':
      return ['Now: Queue delayed regret.', 'In 2 rounds: +12 regret at hand deal.'];
    case 'return-window':
      return ['Now: Queue delayed regret.', 'In 2 rounds: +8 regret at hand deal.'];
    default:
      return ['Effect: No explicit effect text configured.'];
  }
}
