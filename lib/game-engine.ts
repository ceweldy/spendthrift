import { ALL_CARDS } from '@/lib/game-data';
import { drawUniqueWeighted, drawWeighted, getArchetypeBonus, getEventWeight, getProductWeight } from '@/lib/card-utils';
import {
  ActivityEntry,
  ArchetypeKey,
  Card,
  CardEffect,
  CartItem,
  InventoryItem,
  MembershipTierId,
  PaymentMode,
  PendingRegret,
  PremiumState,
  PurchaseLine,
  RunStats,
  SubscriptionState,
} from '@/types/game';

export type EngineState = {
  archetype: ArchetypeKey | null;
  budget: number;
  dopamine: number;
  regret: number;
  round: number;
  maxRounds: number;
  hand: Card[];
  cart: CartItem[];
  activityLog: string[];
  history: ActivityEntry[];
  flashSaleSecondsLeft: number;
  randomDiscounts: Record<string, number>;
  randomDiscountSecondsLeft: number;
  nextDiscount: number;
  shippingDiscount: number;
  fomoBoost: boolean;
  quickBuy: boolean;
  cashbackRate: number;
  roundDopamineBoost: number;
  techDiscountRate: number;
  nextCheckoutRegret: number;
  halfRegretGain: boolean;
  pendingRegret: PendingRegret[];
  premium: PremiumState;
  paymentMode: PaymentMode;
  inventory: InventoryItem[];
  purchaseHistory: PurchaseLine[];
  subscription: SubscriptionState;
  stats: RunStats;
  paydayEvery: number;
  paydayAmount: number;
  lastPaydayRound: number | null;
  announcement: string | null;
};

const STARTING_BUDGET = 500;
const PAYDAY_EVERY_ROUNDS = 3;
const PAYDAY_AMOUNT = 180;
const RANDOM_DISCOUNT_SECONDS = 25;
const RANDOM_DISCOUNT_MIN_PRODUCTS = 1;
const RANDOM_DISCOUNT_MAX_PRODUCTS = 3;
const logCap = 30;

export type CheckoutTotals = {
  subtotal: number;
  shippingCut: number;
  total: number;
  cashback: number;
  dopamineGain: number;
  regretGain: number;
};

const nextId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const applyPaymentMode = (amount: number, mode: PaymentMode) => (mode === 'demo-free' ? 0 : amount);

const nowPlusThirtyDays = (now: number) => now + 30 * 24 * 60 * 60 * 1000;

const canUseCard = (card: Card, premium: PremiumState) => !card.premiumOnly || premium.unlocks.premiumCards;

const getArchetype = (state: EngineState): ArchetypeKey => state.archetype ?? 'impulse_king';

const productsPool = (state: EngineState) => ALL_CARDS.filter((c) => c.type === 'product' && canUseCard(c, state.premium));
const eventPool = (state: EngineState) =>
  ALL_CARDS.filter((c) => c.type !== 'product' && canUseCard(c, state.premium) && !(getArchetype(state) === 'comfort_seeker' && c.type === 'trap'));

const pushHistory = (state: EngineState, kind: ActivityEntry['kind'], text: string): EngineState => {
  const entry: ActivityEntry = { id: nextId(), round: state.round, timestamp: Date.now(), kind, text };
  return {
    ...state,
    activityLog: [text, ...state.activityLog].slice(0, logCap),
    history: [entry, ...state.history],
  };
};

type PricingBreakdown = {
  basePrice: number;
  finalPrice: number;
  savings: number;
  discountPercent: number;
  applied: string[];
};

export const getCardPricing = (state: EngineState, card: Card): PricingBreakdown => {
  const basePrice = card.price ?? 0;
  const modifiers: Array<{ label: string; rate: number }> = [];

  const randomRate = state.randomDiscountSecondsLeft > 0 ? state.randomDiscounts[card.id] ?? 0 : 0;
  if (randomRate > 0) modifiers.push({ label: `Round SALE ${Math.round(randomRate * 100)}%`, rate: randomRate });
  if (state.flashSaleSecondsLeft > 0) modifiers.push({ label: 'Flash Sale 30%', rate: 0.3 });
  if (state.nextDiscount > 0) modifiers.push({ label: `Price Match ${Math.round(state.nextDiscount * 100)}%`, rate: state.nextDiscount });
  if (state.techDiscountRate > 0 && card.store === 'Tech') modifiers.push({ label: `Tech Drop ${Math.round(state.techDiscountRate * 100)}%`, rate: state.techDiscountRate });

  const multiplier = modifiers.reduce((acc, mod) => acc * (1 - mod.rate), 1);
  const finalPrice = Math.max(0, Math.round(basePrice * multiplier));
  const savings = Math.max(0, basePrice - finalPrice);
  const discountPercent = basePrice > 0 ? Math.round((savings / basePrice) * 100) : 0;

  return {
    basePrice,
    finalPrice,
    savings,
    discountPercent,
    applied: modifiers.map((mod) => mod.label),
  };
};

const effectivePrice = (state: EngineState, card: Card) => getCardPricing(state, card).finalPrice;

const applyRandomRoundDiscounts = (state: EngineState, hand: Card[]): EngineState => {
  const products = hand.filter((card) => card.type === 'product');
  if (!products.length) return { ...state, randomDiscounts: {}, randomDiscountSecondsLeft: 0 };

  const maxByPool = Math.max(RANDOM_DISCOUNT_MIN_PRODUCTS, Math.ceil(products.length * 0.6));
  const discountedCount = Math.min(
    products.length,
    Math.max(
      RANDOM_DISCOUNT_MIN_PRODUCTS,
      RANDOM_DISCOUNT_MIN_PRODUCTS + Math.floor(Math.random() * (Math.min(RANDOM_DISCOUNT_MAX_PRODUCTS, maxByPool) - RANDOM_DISCOUNT_MIN_PRODUCTS + 1)),
    ),
  );

  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, discountedCount);
  const rates = [0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4];

  const randomDiscounts = picked.reduce<Record<string, number>>((acc, card) => {
    acc[card.id] = rates[Math.floor(Math.random() * rates.length)];
    return acc;
  }, {});

  let next = { ...state, randomDiscounts, randomDiscountSecondsLeft: RANDOM_DISCOUNT_SECONDS };
  const label = picked.map((card) => `${card.name} ${Math.round((randomDiscounts[card.id] ?? 0) * 100)}% off`).join(', ');
  next = pushHistory(next, 'effect', `Round SALE live (${RANDOM_DISCOUNT_SECONDS}s): ${label}.`);
  if (picked.length >= 2) {
    next = pushHistory(next, 'effect', `Combo discount event: ${picked.length} products discounted together.`);
  }
  return next;
};

const applyDelayedRegret = (state: EngineState): EngineState => {
  const due = state.pendingRegret.filter((item) => item.dueRound === state.round);
  if (!due.length) return state;

  const total = due.reduce((acc, item) => acc + item.amount, 0);
  const reduced = state.pendingRegret.filter((item) => item.dueRound !== state.round);

  let next = { ...state, regret: Math.min(100, state.regret + total), pendingRegret: reduced };
  due.forEach((item) => {
    next = pushHistory(next, 'effect', `Delayed remorse: +${item.amount} regret (${item.source})`);
  });
  return next;
};

export const createInitialEngineState = (archetype: ArchetypeKey, premiumEnabled = false): EngineState => ({
  archetype,
  budget: STARTING_BUDGET,
  dopamine: 0,
  regret: 0,
  round: 1,
  maxRounds: 10,
  hand: [],
  cart: [],
  activityLog: ['Game initialized.'],
  history: [
    {
      id: nextId(),
      round: 1,
      timestamp: Date.now(),
      kind: 'system',
      text: 'Game initialized.',
    },
  ],
  flashSaleSecondsLeft: 0,
  randomDiscounts: {},
  randomDiscountSecondsLeft: 0,
  nextDiscount: 0,
  shippingDiscount: 0,
  fomoBoost: false,
  quickBuy: false,
  cashbackRate: 0,
  roundDopamineBoost: 0,
  techDiscountRate: 0,
  nextCheckoutRegret: 0,
  halfRegretGain: false,
  pendingRegret: [],
  premium: {
    enabled: premiumEnabled,
    unlocks: {
      premiumCards: premiumEnabled,
      analytics: premiumEnabled,
      noAds: premiumEnabled,
    },
  },
  paymentMode: 'real-display',
  inventory: [],
  purchaseHistory: [],
  subscription: {
    currentPlanId: premiumEnabled ? 'paid' : 'free',
    startedAt: premiumEnabled ? Date.now() : null,
    renewalAt: premiumEnabled ? nowPlusThirtyDays(Date.now()) : null,
  },
  stats: {
    ordersCompleted: 0,
    itemsPurchased: 0,
    totalSpent: 0,
    totalOriginalSpent: 0,
    subscriptionPurchases: 0,
  },
  paydayEvery: PAYDAY_EVERY_ROUNDS,
  paydayAmount: PAYDAY_AMOUNT,
  lastPaydayRound: null,
  announcement: null,
});

export const drawHandForRound = (state: EngineState): EngineState => {
  const archetype = getArchetype(state);
  const products = drawUniqueWeighted(productsPool(state), 4, (card) => getProductWeight(card, archetype));
  const event = drawWeighted(eventPool(state), (card) => getEventWeight(card, archetype));
  const hand = event ? [event, ...products] : products;
  let next: EngineState = { ...state, hand };
  next = applyDelayedRegret(next);
  next = applyRandomRoundDiscounts(next, hand);
  return pushHistory(next, 'draw', `Round ${next.round} dealt: ${hand.map((c) => c.name).join(', ')}`);
};

const applyProductArchetypeBonuses = (state: EngineState, card: Card, dopamine: number): number => {
  let total = dopamine;
  const archetype = getArchetype(state);
  if (archetype === 'status_flexer' && card.store === 'Luxury') total += 8;
  if (archetype === 'bargain_hawk' && effectivePrice(state, card) < (card.price ?? 0)) total += 3;
  if (archetype === 'comfort_seeker' && (card.tags ?? []).some((tag) => ['comfort', 'home', 'food'].includes(tag))) total += 2;
  return total;
};

export const addCardToCart = (state: EngineState, cardId: string): EngineState => {
  if (state.cart.length >= 5) return state;
  const card = state.hand.find((c) => c.id === cardId);
  if (!card || card.type !== 'product') return state;
  if (state.cart.some((c) => c.id === cardId)) return state;

  const pricing = getCardPricing(state, card);
  const paidPrice = pricing.finalPrice;
  if (state.paymentMode !== 'demo-free') {
    const projectedSubtotal = state.cart.reduce((sum, item) => sum + item.paidPrice, 0) + paidPrice;
    const projectedShippingCut = Math.min(projectedSubtotal, state.shippingDiscount);
    const projectedTotal = Math.max(0, projectedSubtotal - projectedShippingCut);
    if (projectedTotal > state.budget) return pushHistory(state, 'cart', `${card.name} skipped: insufficient budget.`);
  }

  let finalDopamine = (card.dopamine ?? 0) + state.roundDopamineBoost;
  if (state.fomoBoost) finalDopamine += 4;
  if (state.quickBuy) finalDopamine += 5;
  finalDopamine = applyProductArchetypeBonuses(state, card, finalDopamine);

  const cartItem: CartItem = {
    ...card,
    paidPrice,
    finalDopamine,
    originalPrice: pricing.basePrice,
    savings: pricing.savings,
    discountPercent: pricing.discountPercent,
    discountTags: pricing.applied,
  };

  const next = {
    ...state,
    cart: [...state.cart, cartItem],
    nextDiscount: 0,
    quickBuy: false,
    fomoBoost: false,
  };

  const savingsNote = pricing.savings > 0 ? ` (saved $${pricing.savings}${pricing.applied.length ? ` via ${pricing.applied.join(' + ')}` : ''})` : '';
  return pushHistory(next, 'cart', `Added ${card.name} ($${paidPrice}) to cart.${savingsNote}`);
};

const scheduleRegret = (state: EngineState, source: string, amount: number, delayRounds: number): EngineState => {
  const pending: PendingRegret = { id: nextId(), source, amount, dueRound: state.round + delayRounds };
  return {
    ...state,
    pendingRegret: [...state.pendingRegret, pending],
  };
};

export const playSpecialCard = (state: EngineState, cardId: string): EngineState => {
  const card = state.hand.find((c) => c.id === cardId);
  if (!card || card.type === 'product') return state;
  if (!card.effect) return state;

  const nextHand = state.hand.filter((h) => h.id !== cardId);
  let next: EngineState = { ...state, hand: nextHand };

  const effect = card.effect as CardEffect;
  switch (effect) {
    case 'flash-sale':
      next.flashSaleSecondsLeft = 20;
      next = pushHistory(next, 'effect', 'Flash sale started: 30% off for 20 seconds.');
      break;
    case 'declined':
      next.dopamine = Math.max(0, next.dopamine - 10);
      next = pushHistory(next, 'effect', 'Card declined: -10 dopamine.');
      break;
    case 'refund':
      next.budget += 40;
      next = pushHistory(next, 'effect', 'Refund processed: +$40 budget.');
      break;
    case 'fomo':
      next.fomoBoost = true;
      next = pushHistory(next, 'effect', 'FOMO active: next product +4 dopamine.');
      break;
    case 'gift':
      next.dopamine += 8;
      next = pushHistory(next, 'effect', 'Mystery gift: +8 dopamine.');
      break;
    case 'cashback':
      next.cashbackRate = 0.1;
      next = pushHistory(next, 'effect', 'Cashback armed: 10% of checkout total returned.');
      break;
    case 'influencer-hype':
      next.roundDopamineBoost += 2;
      next = pushHistory(next, 'effect', 'Influencer hype: products are +2 dopamine this round.');
      break;
    case 'stock-drop':
      next.techDiscountRate = 0.15;
      next = pushHistory(next, 'effect', 'Stock drop: Tech products 15% off this round.');
      break;
    case 'cart-abandon':
      next.nextCheckoutRegret += 5;
      next = pushHistory(next, 'effect', 'Cart nudge: next checkout gains +5 regret.');
      break;
    case 'loyalty-points':
      next.dopamine += 6;
      next.shippingDiscount += 10;
      next = pushHistory(next, 'effect', 'Loyalty points: +6 dopamine and -$10 checkout.');
      break;
    case 'ship15':
      next.shippingDiscount += 15;
      next = pushHistory(next, 'effect', 'Shipping power ready: -$15 checkout.');
      break;
    case 'price-match':
      next.nextDiscount = 0.4;
      next = pushHistory(next, 'effect', 'Price Match: next item 40% off.');
      break;
    case 'quick-buy':
      next.quickBuy = true;
      next = pushHistory(next, 'effect', 'Quick Buy active: next product +5 dopamine.');
      break;
    case 'designer':
      next.dopamine += 60;
      next = pushHistory(next, 'effect', 'Designer Card: +60 dopamine.');
      break;
    case 'calm':
      next.regret = Math.max(0, next.regret - 8);
      next = pushHistory(next, 'effect', 'Calm mode: -8 regret.');
      break;
    case 'sub-trap':
      next.nextCheckoutRegret += 8;
      next = pushHistory(next, 'effect', 'Subscription trap armed: +8 regret at checkout.');
      break;
    case 'future-remorse':
      next = scheduleRegret(next, 'Buyer Remorse', 10, 1);
      next = pushHistory(next, 'effect', 'Buyer Remorse queued: +10 regret next round.');
      break;
    case 'impulse-auto': {
      const cheapest = [...next.hand]
        .filter((h) => h.type === 'product')
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      next = pushHistory(next, 'effect', 'Impulse trap triggered: auto-adding cheapest product.');
      if (cheapest) next = addCardToCart(next, cheapest.id);
      break;
    }
    case 'doom-scroll':
      next = scheduleRegret(next, 'Doom Scroll', 12, 2);
      next = pushHistory(next, 'effect', 'Doom Scroll queued: +12 regret in 2 rounds.');
      break;
    case 'return-window':
      next = scheduleRegret(next, 'Missed Return Window', 8, 2);
      next = pushHistory(next, 'effect', 'Missed Return Window queued: +8 regret in 2 rounds.');
      break;
  }

  return next;
};

export const removeFromCart = (state: EngineState, cardId: string): EngineState => ({
  ...state,
  cart: state.cart.filter((item) => item.id !== cardId),
});

export const clearCart = (state: EngineState): EngineState => pushHistory({ ...state, cart: [] }, 'cart', 'Cart cleared.');

export const tickTimers = (state: EngineState): EngineState => {
  let next = state;

  if (state.flashSaleSecondsLeft > 0) {
    next = { ...next, flashSaleSecondsLeft: state.flashSaleSecondsLeft - 1 };
    if (next.flashSaleSecondsLeft === 0) {
      next = pushHistory(next, 'effect', 'Flash sale ended.');
    }
  }

  if (state.randomDiscountSecondsLeft > 0) {
    next = { ...next, randomDiscountSecondsLeft: state.randomDiscountSecondsLeft - 1 };
    if (next.randomDiscountSecondsLeft === 0) {
      next = pushHistory({ ...next, randomDiscounts: {} }, 'effect', 'Round SALE ended.');
    }
  }

  return next;
};

export const skipRound = (state: EngineState): { next: EngineState; ended: boolean } => {
  const nextRound = state.round + 1;
  const isPaydayRound = nextRound % state.paydayEvery === 0;
  let next: EngineState = {
    ...state,
    round: nextRound,
    cart: [],
    flashSaleSecondsLeft: 0,
    randomDiscounts: {},
    randomDiscountSecondsLeft: 0,
    nextDiscount: 0,
    shippingDiscount: 0,
    fomoBoost: false,
    quickBuy: false,
    cashbackRate: 0,
    roundDopamineBoost: 0,
    techDiscountRate: 0,
    nextCheckoutRegret: 0,
    halfRegretGain: false,
    budget: state.budget + (isPaydayRound ? state.paydayAmount : 0),
    lastPaydayRound: isPaydayRound ? nextRound : state.lastPaydayRound,
    announcement: isPaydayRound ? `💸 Payday! +$${state.paydayAmount} budget injected for round ${nextRound}.` : null,
  };

  next = pushHistory(next, 'round', `Round skipped. Advancing to round ${nextRound}.`);
  if (isPaydayRound) next = pushHistory(next, 'round', `Payday reached: +$${state.paydayAmount} budget.`);

  const ended = nextRound > state.maxRounds;
  if (!ended) {
    next = pushHistory(next, 'round', `Round ${next.round} begins.`);
    next = drawHandForRound(next);
  }

  return { next, ended };
};

const recordInventoryPurchase = (state: EngineState, item: CartItem, timestamp: number): EngineState => {
  const existing = state.inventory.find((inv) => inv.cardId === item.id);

  let inventory: InventoryItem[];
  if (!existing) {
    inventory = [
      {
        id: nextId(),
        cardId: item.id,
        emoji: item.emoji,
        name: item.name,
        store: item.store,
        category: item.type,
        quantity: 1,
        lastPurchasePrice: item.paidPrice,
        lastOriginalPrice: item.originalPrice,
        totalSpent: item.paidPrice,
        totalOriginalSpent: item.originalPrice,
        firstPurchasedAt: timestamp,
        lastPurchasedAt: timestamp,
      },
      ...state.inventory,
    ];
  } else {
    inventory = state.inventory.map((inv) =>
      inv.cardId !== item.id
        ? inv
        : {
            ...inv,
            quantity: inv.quantity + 1,
            lastPurchasePrice: item.paidPrice,
            lastOriginalPrice: item.originalPrice,
            totalSpent: inv.totalSpent + item.paidPrice,
            totalOriginalSpent: inv.totalOriginalSpent + item.originalPrice,
            lastPurchasedAt: timestamp,
          },
    );
  }

  const line: PurchaseLine = {
    id: nextId(),
    itemId: item.id,
    itemName: item.name,
    emoji: item.emoji,
    quantity: 1,
    unitOriginalPrice: item.originalPrice,
    unitPaidPrice: item.paidPrice,
    lineOriginalTotal: item.originalPrice,
    linePaidTotal: item.paidPrice,
    timestamp,
    source: 'game-checkout',
  };

  return {
    ...state,
    inventory,
    purchaseHistory: [line, ...state.purchaseHistory],
  };
};

export const calculateCheckoutTotals = (state: EngineState): CheckoutTotals & { originalTotal: number; chargedTotal: number } => {
  const subtotal = state.cart.reduce((sum, item) => sum + item.paidPrice, 0);
  const shippingCut = Math.min(subtotal, state.shippingDiscount);
  const originalTotal = Math.max(0, subtotal - shippingCut);
  const chargedTotal = applyPaymentMode(originalTotal, state.paymentMode);
  const cashback = Math.round(chargedTotal * state.cashbackRate);
  const dopamineGain = state.cart.reduce((sum, item) => sum + item.finalDopamine, 0);

  const avgRisk = Math.round(state.cart.reduce((sum, item) => sum + (item.risk ?? 0), 0) / Math.max(1, state.cart.length));
  let regretGain = avgRisk + state.nextCheckoutRegret;
  if (state.halfRegretGain) regretGain = Math.round(regretGain * 0.5);
  if (getArchetype(state) === 'comfort_seeker') regretGain = Math.round(regretGain * 0.8);

  return { subtotal, shippingCut, total: chargedTotal, cashback, dopamineGain, regretGain, originalTotal, chargedTotal };
};

export const checkout = (state: EngineState): { next: EngineState; ended: boolean } => {
  const { originalTotal, chargedTotal, cashback, dopamineGain, regretGain } = calculateCheckoutTotals(state);
  const saleSavings = Math.max(0, state.cart.reduce((sum, item) => sum + Math.max(0, (item.originalPrice ?? item.paidPrice) - item.paidPrice), 0));

  if (state.paymentMode !== 'demo-free' && chargedTotal > state.budget) {
    return {
      next: pushHistory(state, 'checkout', 'Checkout blocked: total exceeds current budget.'),
      ended: false,
    };
  }

  let nextBudget = Math.max(0, state.budget - chargedTotal + cashback);
  const nextDopamine = state.dopamine + dopamineGain;
  const nextRegret = Math.min(100, state.regret + regretGain);
  const nextRound = state.round + 1;

  const isPaydayRound = nextRound % state.paydayEvery === 0;
  if (isPaydayRound) nextBudget += state.paydayAmount;

  let next: EngineState = {
    ...state,
    budget: nextBudget,
    dopamine: nextDopamine,
    regret: nextRegret,
    round: nextRound,
    cart: [],
    flashSaleSecondsLeft: 0,
    randomDiscounts: {},
    randomDiscountSecondsLeft: 0,
    shippingDiscount: 0,
    cashbackRate: 0,
    roundDopamineBoost: 0,
    techDiscountRate: 0,
    nextCheckoutRegret: 0,
    halfRegretGain: false,
    lastPaydayRound: isPaydayRound ? nextRound : state.lastPaydayRound,
    announcement: isPaydayRound ? `💸 Payday! +$${state.paydayAmount} budget injected for round ${nextRound}.` : null,
    stats: {
      ...state.stats,
      ordersCompleted: state.stats.ordersCompleted + 1,
      itemsPurchased: state.stats.itemsPurchased + state.cart.length,
      totalSpent: state.stats.totalSpent + chargedTotal,
      totalOriginalSpent: state.stats.totalOriginalSpent + originalTotal,
    },
  };

  const ts = Date.now();
  state.cart.forEach((item) => {
    next = recordInventoryPurchase(next, item, ts);
  });

  next = pushHistory(
    next,
    'checkout',
    `Checkout complete: paid $${chargedTotal}${state.paymentMode === 'demo-free' ? ` (original $${originalTotal})` : ''}, +${dopamineGain} dopamine, +${regretGain} regret.`,
  );
  next = pushHistory(next, 'inventory', `Inventory updated with ${state.cart.length} purchased item(s).`);
  if (saleSavings > 0) next = pushHistory(next, 'checkout', `Discount savings captured: $${saleSavings}.`);
  if (cashback > 0) next = pushHistory(next, 'checkout', `Cashback applied: +$${cashback}.`);
  if (isPaydayRound) next = pushHistory(next, 'round', `Payday reached: +$${state.paydayAmount} budget.`);

  const ended = nextRound > state.maxRounds;
  if (!ended) {
    next = pushHistory(next, 'round', `Round ${next.round} begins.`);
    next = drawHandForRound(next);
  }

  return { next, ended };
};

export const setPaymentMode = (state: EngineState, mode: PaymentMode): EngineState => {
  if (state.paymentMode === mode) return state;
  return pushHistory({ ...state, paymentMode: mode }, 'payment', `Payment mode changed to ${mode === 'demo-free' ? 'Demo free checkout' : 'Real pricing (display only)'}.`);
};

export const setMembershipTier = (state: EngineState, tier: MembershipTierId): EngineState => {
  const isPaid = tier === 'paid';
  const now = Date.now();

  return pushHistory(
    {
      ...state,
      premium: {
        enabled: isPaid,
        unlocks: {
          premiumCards: isPaid,
          analytics: isPaid,
          noAds: isPaid,
        },
      },
      subscription: {
        currentPlanId: tier,
        startedAt: isPaid ? now : null,
        renewalAt: isPaid ? nowPlusThirtyDays(now) : null,
      },
    },
    'subscription',
    `Membership set to ${isPaid ? 'Paid' : 'Free'}. ${isPaid ? 'Premium cards unlocked.' : 'Using free card pool.'}`,
  );
};

export const getFinalScore = (dopamine: number, regret: number, archetype: ArchetypeKey | null) => {
  const regretPenalty = regret * 0.5;
  const archetypeBonus = getArchetypeBonus(archetype);
  const finalScore = Math.max(0, Math.round(dopamine - regretPenalty + archetypeBonus));
  return { finalScore, regretPenalty: Math.round(regretPenalty), archetypeBonus };
};
