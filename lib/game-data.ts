import cards from '@/data/cards.json';
import { Archetype, ArchetypeKey, Card, QuizQuestion } from '@/types/game';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "What's your shopping vibe?",
    options: [
      { emoji: '🔥', label: 'Thrill Hunter', desc: 'Live for the rush', value: 'impulse_king' },
      { emoji: '💰', label: 'Bargain Seeker', desc: 'Never pay full price', value: 'bargain_hawk' },
      { emoji: '👑', label: 'Luxury Lover', desc: 'Only the best', value: 'status_flexer' },
      { emoji: '🛋️', label: 'Comfort Buyer', desc: 'Shopping is self-care', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'How do you shop?',
    options: [
      { emoji: '⚡', label: 'Impulse Only', desc: 'Buy now, think later', value: 'impulse_king' },
      { emoji: '📋', label: 'Careful Planner', desc: 'Research first', value: 'bargain_hawk' },
      { emoji: '🏷️', label: 'Sale Chaser', desc: 'Wait for discounts', value: 'bargain_hawk' },
      { emoji: '🎁', label: 'Gift Buyer', desc: 'Love shopping for others', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'Biggest weakness?',
    options: [
      { emoji: '💻', label: 'Tech Gadgets', desc: 'Latest gear every time', value: 'impulse_king' },
      { emoji: '👗', label: 'Fashion Drops', desc: 'Limited edition is dangerous', value: 'status_flexer' },
      { emoji: '🏠', label: 'Home Decor', desc: 'One more pillow', value: 'comfort_seeker' },
      { emoji: '🍕', label: 'Food & Experiences', desc: 'Treat yourself energy', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'After a big purchase you feel...',
    options: [
      { emoji: '😍', label: 'Euphoric', desc: 'No regrets', value: 'impulse_king' },
      { emoji: '😬', label: 'Guilty', desc: 'That was maybe dumb', value: 'bargain_hawk' },
      { emoji: '🛒', label: 'Next Purchase Ready', desc: 'Cart stays loaded', value: 'status_flexer' },
      { emoji: '🤷', label: 'It Depends', desc: 'Mood + price decide', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'Your checkout speed?',
    options: [
      { emoji: '⚡', label: 'One-click', desc: 'Instant checkout', value: 'impulse_king' },
      { emoji: '🛒', label: 'Cart for days', desc: 'Let it sit', value: 'bargain_hawk' },
      { emoji: '💸', label: 'Only payday', desc: 'Timing matters', value: 'bargain_hawk' },
      { emoji: '🤔', label: 'Depends on price', desc: 'Small yes, big maybe', value: 'comfort_seeker' },
    ],
  },
];

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  impulse_king: {
    emoji: '👑',
    title: 'The Impulse King',
    desc: 'Thrives on spontaneous buys and flash sales.',
    bonuses: ['⚡ +5 dopamine on quick buys', '🔥 Flash Sale appears more often', '🎲 High risk tolerance'],
  },
  bargain_hawk: {
    emoji: '🦅',
    title: 'The Bargain Hawk',
    desc: 'Never pays full price if a deal exists.',
    bonuses: ['💰 Bonus dopamine on discounted items', '🏷️ Price Match appears more often', '⚠️ −3 dopamine on full-price luxury'],
  },
  status_flexer: {
    emoji: '💎',
    title: 'The Status Flexer',
    desc: 'Luxury is the language, not utility.',
    bonuses: ['👑 +8 dopamine on Luxury cards', '✨ Rare Designer Card chance', '📉 -5 dopamine when card declined'],
  },
  comfort_seeker: {
    emoji: '🛋️',
    title: 'The Comfort Seeker',
    desc: 'Shopping as emotional reset and cozy ritual.',
    bonuses: ['🏠 −50% regret on Home/Food', '🕯️ Bonus for candle/coffee/pillow', '🛡️ Subscription Trap blocked'],
  },
};

export const ALL_CARDS = cards as Card[];
export const PRODUCT_CARDS = ALL_CARDS.filter((c) => c.type === 'product');
export const EVENT_CARDS = ALL_CARDS.filter((c) => c.type !== 'product');
