export type ArchetypeKey = 'impulse_king' | 'bargain_hawk' | 'status_flexer' | 'comfort_seeker';

export type QuizOption = {
  emoji: string;
  label: string;
  desc: string;
  value: ArchetypeKey;
};

export type QuizQuestion = {
  q: string;
  options: QuizOption[];
};

export type Archetype = {
  emoji: string;
  title: string;
  desc: string;
  bonuses: string[];
};

export type CardType = 'product' | 'event' | 'power' | 'trap';

export type CardEffect =
  | 'flash-sale'
  | 'declined'
  | 'refund'
  | 'fomo'
  | 'gift'
  | 'cashback'
  | 'influencer-hype'
  | 'stock-drop'
  | 'cart-abandon'
  | 'loyalty-points'
  | 'ship15'
  | 'price-match'
  | 'quick-buy'
  | 'designer'
  | 'calm'
  | 'sub-trap'
  | 'future-remorse'
  | 'impulse-auto'
  | 'doom-scroll'
  | 'return-window';

export type Card = {
  id: string;
  emoji: string;
  name: string;
  store: string;
  type: CardType;
  price?: number;
  dopamine?: number;
  risk?: number;
  desc?: string;
  effect?: CardEffect;
  premiumOnly?: boolean;
  tags?: string[];
};

export type CartItem = Card & {
  paidPrice: number;
  finalDopamine: number;
};

export type PendingRegret = {
  id: string;
  source: string;
  amount: number;
  dueRound: number;
};

export type ActivityEntry = {
  id: string;
  round: number;
  timestamp: number;
  kind: 'system' | 'draw' | 'cart' | 'checkout' | 'effect' | 'round' | 'premium';
  text: string;
};

export type PremiumState = {
  enabled: boolean;
  unlocks: {
    premiumCards: boolean;
    analytics: boolean;
    noAds: boolean;
  };
};

export type Screen = 'landing' | 'quiz' | 'archetype' | 'game' | 'checkout' | 'results';
