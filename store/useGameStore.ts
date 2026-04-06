'use client';

import { create } from 'zustand';
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
  removeFromCart,
  tickTimers,
} from '@/lib/game-engine';
import { ArchetypeKey, Screen } from '@/types/game';

type CheckoutStep = 0 | 1 | 2;

type GameState = EngineState & {
  screen: Screen;
  questionIndex: number;
  quizScores: Record<ArchetypeKey, number>;
  archetype: ArchetypeKey | null;

  checkoutOpen: boolean;
  checkoutStep: CheckoutStep;

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
  resetAll: () => void;
};

const initialScores: Record<ArchetypeKey, number> = {
  impulse_king: 0,
  bargain_hawk: 0,
  status_flexer: 0,
  comfort_seeker: 0,
};

const baseEngine = createInitialEngineState('impulse_king');

export const useGameStore = create<GameState>((set, get) => ({
  ...baseEngine,
  screen: 'landing',
  questionIndex: 0,
  quizScores: { ...initialScores },
  archetype: null,
  checkoutOpen: false,
  checkoutStep: 0,

  toLanding: () => set({ screen: 'landing' }),

  startQuiz: () =>
    set({
      ...createInitialEngineState('impulse_king'),
      screen: 'quiz',
      questionIndex: 0,
      quizScores: { ...initialScores },
      archetype: null,
    }),

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
    const archetype = get().archetype ?? 'impulse_king';
    let engine = createInitialEngineState(archetype);
    engine = drawHandForRound(engine);

    set({
      ...engine,
      archetype,
      screen: 'game',
      checkoutOpen: false,
      checkoutStep: 0,
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
    });
  },

  tick: () => set((s) => tickTimers(s)),

  endGame: () => set({ screen: 'results' }),

  resetAll: () =>
    set({
      ...createInitialEngineState('impulse_king'),
      screen: 'landing',
      questionIndex: 0,
      quizScores: { ...initialScores },
      archetype: null,
      checkoutOpen: false,
      checkoutStep: 0,
    }),
}));

export { getFinalScore };

export const getTitleFromScore = (score: number) => {
  if (score >= 80) return 'Legendary Haul Queen 👑';
  if (score >= 55) return 'Master Shopper 🛍️';
  if (score >= 35) return 'Retail Regular 🛒';
  if (score >= 15) return 'Bargain Hunter 🏷️';
  return "Buyer's Remorse 😬";
};

export const getArchetype = (key: ArchetypeKey | null) => ARCHETYPES[key ?? 'impulse_king'];
