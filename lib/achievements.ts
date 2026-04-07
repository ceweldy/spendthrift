import { EngineState } from '@/lib/game-engine';
import { AchievementId, AchievementState } from '@/types/game';

export type AchievementDef = {
  id: AchievementId;
  icon: string;
  title: string;
  description: string;
  reward: number;
  target: (state: EngineState, achievements: AchievementState) => number;
  goal: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_checkout',
    icon: '🧾',
    title: 'First Checkout',
    description: 'Complete your first order.',
    reward: 8,
    target: (state) => state.stats.ordersCompleted,
    goal: 1,
  },
  {
    id: 'shopping_spree',
    icon: '🛒',
    title: 'Shopping Spree',
    description: 'Complete 5 total checkouts.',
    reward: 14,
    target: (state) => state.stats.ordersCompleted,
    goal: 5,
  },
  {
    id: 'dopamine_50',
    icon: '⚡',
    title: 'Mood Lifted',
    description: 'Reach 50 dopamine in a run.',
    reward: 6,
    target: (state) => state.dopamine,
    goal: 50,
  },
  {
    id: 'dopamine_150',
    icon: '🌈',
    title: 'Retail Euphoria',
    description: 'Reach 150 dopamine in a run.',
    reward: 16,
    target: (state) => state.dopamine,
    goal: 150,
  },
  {
    id: 'dopamine_300',
    icon: '🪩',
    title: 'Overclocked Joy',
    description: 'Reach 300 dopamine in a run.',
    reward: 26,
    target: (state) => state.dopamine,
    goal: 300,
  },
  {
    id: 'discount_hunter',
    icon: '🏷️',
    title: 'Discount Hunter',
    description: 'Save $50 total via discounts.',
    reward: 10,
    target: (state) => Math.max(0, state.stats.totalOriginalSpent - state.stats.totalSpent),
    goal: 50,
  },
  {
    id: 'mega_saver',
    icon: '💸',
    title: 'Mega Saver',
    description: 'Save $200 total via discounts.',
    reward: 22,
    target: (state) => Math.max(0, state.stats.totalOriginalSpent - state.stats.totalSpent),
    goal: 200,
  },
  {
    id: 'rare_operator',
    icon: '🃏',
    title: 'Rare Operator',
    description: 'Play 3 rare+ special cards.',
    reward: 12,
    target: (_state, achievements) => achievements.rareCardsPlayed,
    goal: 3,
  },
  {
    id: 'payday_survivor',
    icon: '💵',
    title: 'Payday Survivor',
    description: 'Make it through 3 payday rounds.',
    reward: 18,
    target: (_state, achievements) => achievements.paydaysHit,
    goal: 3,
  },
  {
    id: 'checkout_streak_3',
    icon: '🔥',
    title: 'Checkout Streak',
    description: 'Complete checkout in 3 rounds in a row.',
    reward: 15,
    target: (_state, achievements) => achievements.bestCheckoutStreak,
    goal: 3,
  },
];

export const initialAchievementState = (): AchievementState => ({
  unlocked: [],
  totalRewardDopamine: 0,
  rareCardsPlayed: 0,
  currentCheckoutStreak: 0,
  bestCheckoutStreak: 0,
  paydaysHit: 0,
});

export const isRareSpecialCard = (card: EngineState['hand'][number]) => {
  if (!card || card.type === 'product') return false;
  if (card.rarity && ['rare', 'epic', 'legendary'].includes(card.rarity)) return true;
  return ['cashback', 'stock-drop', 'loyalty-points', 'designer', 'doom-scroll', 'future-remorse'].includes(card.effect ?? '');
};
