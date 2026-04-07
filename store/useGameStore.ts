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
  removeFromCart,
  setMembershipTier,
  setPaymentMode,
  skipRound,
  tickTimers,
} from '@/lib/game-engine';
import { ArchetypeKey, GameMenu, InventoryItem, MembershipTier, MembershipTierId, PaymentMode, PurchaseLine, Screen } from '@/types/game';

type CheckoutStep = 0 | 1 | 2;

type GameState = EngineState & {
  screen: Screen;
  questionIndex: number;
  quizScores: Record<ArchetypeKey, number>;
  archetype: ArchetypeKey | null;

  checkoutOpen: boolean;
  checkoutStep: CheckoutStep;
  checkoutSuccessFxTick: number;

  activeMenu: GameMenu;
  membershipTiers: MembershipTier[];

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
  skipCurrentRound: () => void;
  tick: () => void;
  endGame: () => void;

  setActiveMenu: (menu: GameMenu) => void;
  setCheckoutMode: (mode: PaymentMode) => void;
  chooseMembership: (tier: MembershipTierId) => void;

  resetAll: () => void;
};

const initialScores: Record<ArchetypeKey, number> = {
  impulse_king: 0,
  bargain_hawk: 0,
  status_flexer: 0,
  comfort_seeker: 0,
};

const membershipTiers: MembershipTier[] = [
  { id: 'free', name: 'Free', price: 0, perks: ['Core game cards', 'Standard HUD', 'Default mode'] },
  { id: 'paid', name: 'Paid', price: 9, perks: ['Premium card pool', 'Advanced analytics', 'Premium features'] },
];

const baseEngine = createInitialEngineState('impulse_king');

const validMenus: GameMenu[] = ['shop', 'inventory', 'activity'];

const reconstructInventoryFromHistory = (purchaseHistory: PurchaseLine[]): InventoryItem[] => {
  const byCard = new Map<string, InventoryItem>();

  const chronological = [...purchaseHistory].sort((a, b) => a.timestamp - b.timestamp);
  for (const line of chronological) {
    const existing = byCard.get(line.itemId);
    if (!existing) {
      byCard.set(line.itemId, {
        id: `inv-${line.itemId}`,
        cardId: line.itemId,
        emoji: line.emoji,
        name: line.itemName,
        store: 'Unknown',
        category: 'product',
        quantity: line.quantity,
        lastPurchasePrice: line.unitPaidPrice,
        lastOriginalPrice: line.unitOriginalPrice,
        totalSpent: line.linePaidTotal,
        totalOriginalSpent: line.lineOriginalTotal,
        firstPurchasedAt: line.timestamp,
        lastPurchasedAt: line.timestamp,
      });
      continue;
    }

    existing.quantity += line.quantity;
    existing.lastPurchasePrice = line.unitPaidPrice;
    existing.lastOriginalPrice = line.unitOriginalPrice;
    existing.totalSpent += line.linePaidTotal;
    existing.totalOriginalSpent += line.lineOriginalTotal;
    existing.lastPurchasedAt = line.timestamp;
  }

  return Array.from(byCard.values()).sort((a, b) => b.lastPurchasedAt - a.lastPurchasedAt);
};

const normalizePersistentState = (state: Partial<GameState>): Partial<GameState> => {
  const purchaseHistory = Array.isArray(state.purchaseHistory) ? state.purchaseHistory : [];
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const safeMenu = state.activeMenu && validMenus.includes(state.activeMenu) ? state.activeMenu : 'shop';

  return {
    ...state,
    activeMenu: safeMenu,
    inventory: inventory.length ? inventory : reconstructInventoryFromHistory(purchaseHistory),
    activityLog: Array.isArray(state.activityLog) && state.activityLog.length ? state.activityLog : ['Activity feed ready.'],
  };
};

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
      checkoutSuccessFxTick: 0,
      activeMenu: 'shop',
      membershipTiers,

      toLanding: () => set({ screen: 'landing' }),

      startQuiz: () =>
        set((state) => ({
          ...createInitialEngineState('impulse_king', state.subscription.currentPlanId === 'paid'),
          screen: 'quiz',
          questionIndex: 0,
          quizScores: { ...initialScores },
          archetype: null,
          activeMenu: 'shop',
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          premium: state.premium,
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
        let engine = createInitialEngineState(archetype, state.subscription.currentPlanId === 'paid');
        engine = drawHandForRound(engine);

        set({
          ...engine,
          archetype,
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          premium: state.premium,
          stats: state.stats,
          screen: 'game',
          checkoutOpen: false,
          checkoutStep: 0,
          checkoutSuccessFxTick: state.checkoutSuccessFxTick,
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
        const before = get();
        const { next, ended } = checkout(before);
        const repaired = next.inventory.length ? next.inventory : reconstructInventoryFromHistory(next.purchaseHistory);
        const didPlaceOrder = next.stats.ordersCompleted > before.stats.ordersCompleted;

        set({
          ...next,
          inventory: repaired,
          checkoutOpen: false,
          checkoutStep: 0,
          checkoutSuccessFxTick: didPlaceOrder ? before.checkoutSuccessFxTick + 1 : before.checkoutSuccessFxTick,
          screen: ended ? 'results' : 'game',
          activeMenu: 'shop',
        });
      },

      skipCurrentRound: () => {
        const { next, ended } = skipRound(get());
        set({
          ...next,
          screen: ended ? 'results' : 'game',
          activeMenu: 'shop',
        });
      },

      tick: () => set((s) => tickTimers(s)),

      endGame: () => set({ screen: 'results' }),

      setActiveMenu: (menu) => set({ activeMenu: validMenus.includes(menu) ? menu : 'shop' }),
      setCheckoutMode: (mode) => set((s) => setPaymentMode(s, mode)),
      chooseMembership: (tier) => set((s) => setMembershipTier(s, tier)),

      resetAll: () =>
        set((state) => ({
          ...createInitialEngineState('impulse_king', state.subscription.currentPlanId === 'paid'),
          screen: 'landing',
          questionIndex: 0,
          quizScores: { ...initialScores },
          archetype: null,
          checkoutOpen: false,
          checkoutStep: 0,
          checkoutSuccessFxTick: state.checkoutSuccessFxTick,
          activeMenu: 'shop',
          paymentMode: state.paymentMode,
          inventory: state.inventory,
          purchaseHistory: state.purchaseHistory,
          subscription: state.subscription,
          premium: state.premium,
          stats: state.stats,
        })),
    }),
    {
      name: 'spendthrift-state-v5',
      version: 5,
      partialize: (state) => ({
        paymentMode: state.paymentMode,
        inventory: state.inventory,
        purchaseHistory: state.purchaseHistory,
        subscription: state.subscription,
        premium: state.premium,
        stats: state.stats,
        activeMenu: state.activeMenu,
      }),
      migrate: (persisted) => normalizePersistentState((persisted ?? {}) as Partial<GameState>) as GameState,
      merge: (persisted, current) => {
        const normalized = normalizePersistentState((persisted ?? {}) as Partial<GameState>);
        return {
          ...current,
          ...normalized,
        };
      },
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
