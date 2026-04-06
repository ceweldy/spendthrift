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
  brand?: string;
  category?: string;
  store: string;
  type: CardType;
  price?: number;
  dopamine?: number;
  risk?: number;
  desc?: string;
  description?: string;
  imageUrl?: string;
  stock?: number;
  sku?: string;
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
  kind: 'system' | 'draw' | 'cart' | 'checkout' | 'effect' | 'round' | 'premium' | 'inventory' | 'subscription' | 'payment';
  text: string;
};

export type PaymentMode = 'real-display' | 'demo-free';

export type InventoryItem = {
  id: string;
  cardId: string;
  emoji: string;
  name: string;
  store: string;
  category: CardType;
  quantity: number;
  lastPurchasePrice: number;
  lastOriginalPrice: number;
  totalSpent: number;
  totalOriginalSpent: number;
  firstPurchasedAt: number;
  lastPurchasedAt: number;
};

export type PurchaseLine = {
  id: string;
  itemId: string;
  itemName: string;
  emoji: string;
  quantity: number;
  unitOriginalPrice: number;
  unitPaidPrice: number;
  lineOriginalTotal: number;
  linePaidTotal: number;
  timestamp: number;
  source: 'game-checkout' | 'subscription';
};

export type SubscriptionPlanId = 'starter' | 'pro' | 'elite';

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  perks: string[];
};

export type SubscriptionState = {
  currentPlanId: SubscriptionPlanId | null;
  startedAt: number | null;
  renewalAt: number | null;
};

export type RunStats = {
  ordersCompleted: number;
  itemsPurchased: number;
  totalSpent: number;
  totalOriginalSpent: number;
  subscriptionPurchases: number;
};

export type PremiumState = {
  enabled: boolean;
  unlocks: {
    premiumCards: boolean;
    analytics: boolean;
    noAds: boolean;
  };
};

export type GameMenu = 'shop' | 'inventory' | 'subscription';

export type Screen = 'landing' | 'quiz' | 'archetype' | 'game' | 'checkout' | 'results';
