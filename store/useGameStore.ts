'use client';

import { create } from 'zustand';
import { ARCHETYPES, EVENT_CARDS, PRODUCT_CARDS, QUIZ_QUESTIONS } from '@/lib/game-data';
import { ArchetypeKey, Card, CartItem, Screen } from '@/types/game';

type CheckoutStep = 0 | 1 | 2;

type GameState = {
  screen: Screen;
  questionIndex: number;
  quizScores: Record<ArchetypeKey, number>;
  archetype: ArchetypeKey | null;

  budget: number;
  dopamine: number;
  regret: number;
  round: number;
  maxRounds: number;

  hand: Card[];
  cart: CartItem[];
  checkoutOpen: boolean;
  checkoutStep: CheckoutStep;
  logs: string[];

  flashSale: boolean;
  nextDiscount: number;
  shippingDiscount: number;
  fomoBoost: boolean;
  quickBuy: boolean;

  toLanding: () => void;
  startQuiz: () => void;
  answerQuestion: (value: ArchetypeKey) => void;
  startGame: () => void;
  drawHand: () => void;

  addToCart: (cardId: string) => void;
  removeFromCart: (cardId: string) => void;
  clearCart: () => void;
  playSpecial: (cardId: string) => void;

  openCheckout: () => void;
  closeCheckout: () => void;
  nextCheckoutStep: () => void;
  completeCheckout: () => void;
  endGame: () => void;
  resetAll: () => void;
};

const initialScores: Record<ArchetypeKey, number> = {
  impulse_king: 0,
  bargain_hawk: 0,
  status_flexer: 0,
  comfort_seeker: 0,
};

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const effectivePrice = (card: Card, state: Pick<GameState, 'flashSale' | 'nextDiscount'>) => {
  let p = card.price ?? 0;
  if (state.flashSale) p *= 0.7;
  if (state.nextDiscount > 0) p *= 1 - state.nextDiscount;
  return Math.max(0, Math.round(p));
};

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'landing',
  questionIndex: 0,
  quizScores: { ...initialScores },
  archetype: null,

  budget: 500,
  dopamine: 0,
  regret: 0,
  round: 1,
  maxRounds: 10,

  hand: [],
  cart: [],
  checkoutOpen: false,
  checkoutStep: 0,
  logs: ['Game initialized.'],

  flashSale: false,
  nextDiscount: 0,
  shippingDiscount: 0,
  fomoBoost: false,
  quickBuy: false,

  toLanding: () => set({ screen: 'landing' }),
  startQuiz: () => set({ screen: 'quiz', questionIndex: 0, quizScores: { ...initialScores }, archetype: null }),

  answerQuestion: (value) => {
    const s = get();
    const scores = { ...s.quizScores, [value]: s.quizScores[value] + 1 };
    const nextIdx = s.questionIndex + 1;
    if (nextIdx >= QUIZ_QUESTIONS.length) {
      const winner = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] ?? 'impulse_king') as ArchetypeKey;
      set({ quizScores: scores, archetype: winner, screen: 'archetype' });
      return;
    }
    set({ quizScores: scores, questionIndex: nextIdx });
  },

  startGame: () => {
    set({
      screen: 'game',
      budget: 500,
      dopamine: 0,
      regret: 0,
      round: 1,
      cart: [],
      logs: ['Round 1 dealt.'],
      flashSale: false,
      nextDiscount: 0,
      shippingDiscount: 0,
      fomoBoost: false,
      quickBuy: false,
      checkoutOpen: false,
      checkoutStep: 0,
    });
    get().drawHand();
  },

  drawHand: () => {
    const s = get();
    const pool = [...PRODUCT_CARDS];
    const products: Card[] = [];

    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      products.push(pool[idx]);
      pool.splice(idx, 1);
    }

    let eventPool = EVENT_CARDS;
    if (s.archetype === 'comfort_seeker') eventPool = EVENT_CARDS.filter((e) => e.effect !== 'sub-trap');
    const eventCard = rand(eventPool);

    set({ hand: [eventCard, ...products] });
  },

  addToCart: (cardId) => {
    const s = get();
    if (s.cart.length >= 5) return;
    const card = s.hand.find((h) => h.id === cardId);
    if (!card || card.type !== 'product') return;
    if (s.cart.some((c) => c.id === cardId)) return;

    const paidPrice = effectivePrice(card, s);
    if (s.budget < paidPrice) return;

    let finalDopamine = card.dopamine ?? 0;
    if (s.fomoBoost) finalDopamine += 4;
    if (s.quickBuy) finalDopamine += 5;
    if (s.archetype === 'status_flexer' && card.store === 'Luxury') finalDopamine += 8;

    set({
      cart: [...s.cart, { ...card, paidPrice, finalDopamine }],
      nextDiscount: 0,
      quickBuy: false,
      fomoBoost: false,
      logs: [`Added ${card.name} ($${paidPrice})`, ...s.logs].slice(0, 20),
    });
  },

  removeFromCart: (cardId) => set((s) => ({ cart: s.cart.filter((c) => c.id !== cardId) })),
  clearCart: () => set((s) => ({ cart: [], logs: ['Cart cleared', ...s.logs].slice(0, 20) })),

  playSpecial: (cardId) => {
    const s = get();
    const card = s.hand.find((h) => h.id === cardId);
    if (!card || card.type === 'product') return;

    let patch: Partial<GameState> = {};
    let log = `${card.name} played`;

    switch (card.effect) {
      case 'flash-sale': patch.flashSale = true; log = 'Flash sale active: 30% off'; break;
      case 'declined': patch.dopamine = Math.max(0, s.dopamine - 10); log = 'Card declined: -10 dopamine'; break;
      case 'refund': patch.budget = s.budget + 40; log = 'Refund hit: +$40'; break;
      case 'fomo': patch.fomoBoost = true; log = 'FOMO: next item +4 dopamine'; break;
      case 'gift': patch.dopamine = s.dopamine + 8; log = 'Mystery gift: +8 dopamine'; break;
      case 'ship15': patch.shippingDiscount = s.shippingDiscount + 15; log = 'Shipping coupon loaded'; break;
      case 'price-match': patch.nextDiscount = 0.4; log = 'Price match: next item 40% off'; break;
      case 'quick-buy': patch.quickBuy = true; log = 'One-click mode active'; break;
      case 'designer': patch.dopamine = s.dopamine + 60; log = 'Designer card: +60 dopamine'; break;
      case 'calm': patch.regret = Math.max(0, s.regret - 8); log = 'Calm mode: regret reduced'; break;
      default: break;
    }

    set({
      ...patch,
      hand: s.hand.filter((h) => h.id !== cardId),
      logs: [log, ...s.logs].slice(0, 20),
    });
  },

  openCheckout: () => set((s) => (s.cart.length ? { checkoutOpen: true, checkoutStep: 0 } : s)),
  closeCheckout: () => set({ checkoutOpen: false }),
  nextCheckoutStep: () =>
    set((s) => ({ checkoutStep: (Math.min(2, s.checkoutStep + 1) as CheckoutStep) })),

  completeCheckout: () => {
    const s = get();
    const subtotal = s.cart.reduce((a, c) => a + c.paidPrice, 0);
    const shippingCut = Math.min(subtotal, s.shippingDiscount);
    const total = Math.max(0, subtotal - shippingCut);
    const gain = s.cart.reduce((a, c) => a + c.finalDopamine, 0);
    const avgRisk = Math.round(s.cart.reduce((a, c) => a + (c.risk ?? 0), 0) / Math.max(1, s.cart.length));

    const nextRound = s.round + 1;
    const nextBudget = Math.max(0, s.budget - total);
    const nextDopa = s.dopamine + gain;
    const nextRegret = Math.min(100, s.regret + avgRisk);

    if (nextRound > s.maxRounds || nextBudget <= 0) {
      set({ budget: nextBudget, dopamine: nextDopa, regret: nextRegret, round: nextRound, cart: [], checkoutOpen: false, screen: 'results' });
      return;
    }

    set({
      budget: nextBudget,
      dopamine: nextDopa,
      regret: nextRegret,
      round: nextRound,
      cart: [],
      checkoutOpen: false,
      shippingDiscount: 0,
      flashSale: false,
      logs: [`Checkout complete: +${gain} dopamine`, ...s.logs].slice(0, 20),
    });
    get().drawHand();
  },

  endGame: () => set({ screen: 'results' }),
  resetAll: () => set({ screen: 'landing', questionIndex: 0, quizScores: { ...initialScores }, archetype: null }),
}));

export const getFinalScore = (dopamine: number, regret: number) => {
  const regretPenalty = Math.round(regret * 0.5);
  const archetypeBonus = 3;
  const finalScore = Math.max(0, dopamine - regretPenalty + archetypeBonus);
  return { finalScore, regretPenalty, archetypeBonus };
};

export const getTitleFromScore = (score: number) => {
  if (score >= 80) return 'Legendary Haul Queen 👑';
  if (score >= 55) return 'Master Shopper 🛍️';
  if (score >= 35) return 'Retail Regular 🛒';
  if (score >= 15) return 'Bargain Hunter 🏷️';
  return "Buyer's Remorse 😬";
};

export const getArchetype = (key: ArchetypeKey | null) => ARCHETYPES[key ?? 'impulse_king'];
