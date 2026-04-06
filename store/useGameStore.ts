'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ARCHETYPES, QUIZ_QUESTIONS } from '@/lib/game-data';
import {
  EngineState,
  addCardToCart,
  checkout,
  clearCart,
  createInitialEngineState,
  drawHandForRound,
  getFinalScore,
  playSpecialCard,
  purchaseSubscription,
  removeFromCart,
  setPaymentMode,
  tickTimers,
} from '@/lib/game-engine';
import { ArchetypeKey, GameMenu, PaymentMode, Screen, SubscriptionPlan, SubscriptionPlanId } from '@/types/game';

type CheckoutStep = 0 | 1 | 2;

type GameState = EngineState & {
  screen: Screen;
  questionIndex: number;
  quizScores: Record<ArchetypeKey, number>;
  archetype: ArchetypeKey | null;

  checkoutOpen: boolean;
  checkoutStep: CheckoutStep;

  activeMenu: GameMenu;
  subscriptionPlans: SubscriptionPlan[];

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
  tick: () => void;
  endGame: () => void;

  setActiveMenu: (menu: GameMenu) => void;
  setCheckoutMode: (mode: PaymentMode) => void;
  buySubscription: (planId: SubscriptionPlanId) => void;

  resetAll: () => void;
};

const initialScores: Record<ArchetypeKey, number> = {
  impulse_king: 0,
  bargain_hawk: 0,
  status_flexer: 0,
  comfort_seeker: 0,
};

const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'starter', name: 'Starter', price: 9, perks: ['Premium card previews', 'Basic spend trends'] },
  { id: 'pro', name: 'Pro', price: 19, perks: ['All Starter perks', 'Deep analytics', 'Priority themes'] },
  { id: 'elite', name: 'Elite', price: 39, perks: ['All Pro perks', 'VIP drops', 'Ultra flex cosmetics'] },
];

const baseEngine = createInitialEngineState('impulse_king');

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...baseEngine,
      screen: 'landing',
      questionIndex: 0,
      quizScores: { ...initialScores },
      archetype: null,
      checkoutOpen: false,
      checkoutStep: 0,
      activeMenu: 'shop',
      subscriptionPlans,

      toLanding: () => set({ screen: 'landing' }),

      startQuiz: () =>
        set((state) => ({
          ...createInitialEngineState('impulse_king', state.premium.enabled),
          screen: 'quiz',
          questionIndex: 0,
          quizScores: { ...initialScores },
          archetype: null,
          activeMenu: 'shop',
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          stats: state.stats,
        })),

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
        const state = get();
        const archetype = state.archetype ?? 'impulse_king';
        let engine = createInitialEngineState(archetype, state.premium.enabled);
        engine = drawHandForRound(engine);

        set({
          ...engine,
          archetype,
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          stats: state.stats,
          screen: 'game',
          checkoutOpen: false,
          checkoutStep: 0,
          activeMenu: 'shop',
        });
      },

      drawHand: () => set((s) => drawHandForRound(s)),

      addToCart: (cardId) => set((s) => addCardToCart(s, cardId)),
      removeFromCart: (cardId) => set((s) => removeFromCart(s, cardId)),
      clearCart: () => set((s) => clearCart(s)),
      playSpecial: (cardId) => set((s) => playSpecialCard(s, cardId)),

      openCheckout: () => set((s) => (s.cart.length ? { checkoutOpen: true, checkoutStep: 0 } : s)),
      closeCheckout: () => set({ checkoutOpen: false }),
      nextCheckoutStep: () =>
        set((s) => {
          const checkoutStep = Math.min(2, s.checkoutStep + 1) as CheckoutStep;
          return { checkoutStep };
        }),

      completeCheckout: () => {
        const { next, ended } = checkout(get());
        set({
          ...next,
          checkoutOpen: false,
          checkoutStep: 0,
          screen: ended ? 'results' : 'game',
          activeMenu: 'shop',
        });
      },

      tick: () => set((s) => tickTimers(s)),

      endGame: () => set({ screen: 'results' }),

      setActiveMenu: (menu) => set({ activeMenu: menu }),
      setCheckoutMode: (mode) => set((s) => setPaymentMode(s, mode)),
      buySubscription: (planId) => {
        const plan = get().subscriptionPlans.find((p) => p.id === planId);
        if (!plan) return;
        set((s) => purchaseSubscription(s, plan));
      },

      resetAll: () =>
        set((state) => ({
          ...createInitialEngineState('impulse_king', state.premium.enabled),
          screen: 'landing',
          questionIndex: 0,
          quizScores: { ...initialScores },
          archetype: null,
          checkoutOpen: false,
          checkoutStep: 0,
          activeMenu: 'shop',
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          stats: state.stats,
        })),
    }),
    {
      name: 'spendthrift-state-v3',
      partialize: (state) => ({
        paymentMode: state.paymentMode,
        inventory: state.inventory,
        purchaseHistory: state.purchaseHistory,
        subscription: state.subscription,
        premium: state.premium,
        stats: state.stats,
      }),
    },
  ),
);

export { getFinalScore };

export const getTitleFromScore = (score: number) => {
  if (score >= 80) return 'Legendary Haul Queen 👑';
  if (score >= 55) return 'Master Shopper 🛍️';
  if (score >= 35) return 'Retail Regular 🛒';
  if (score >= 15) return 'Bargain Hunter 🏷️';
  return "Buyer's Remorse 😬";
};

export const getArchetype = (key: ArchetypeKey | null) => ARCHETYPES[key ?? 'impulse_king'];
