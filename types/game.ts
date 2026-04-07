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

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Card = {
  id: string;
  emoji: string;
  name: string;
  brand?: string;
  category?: string;
  store: string;
  type: CardType;
  rarity?: CardRarity;
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
  originalPrice: number;
  savings: number;
  discountPercent: number;
  discountTags: string[];
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

export type MembershipTierId = 'free' | 'paid';

export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  price: number;
  perks: string[];
};

export type SubscriptionState = {
  currentPlanId: MembershipTierId;
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

export type AchievementId =
  | 'first_checkout'
  | 'shopping_spree'
  | 'dopamine_50'
  | 'dopamine_150'
  | 'dopamine_300'
  | 'discount_hunter'
  | 'mega_saver'
  | 'rare_operator'
  | 'payday_survivor'
  | 'checkout_streak_3'
  | 'big_spender'
  | 'collector_25'
  | 'checkout_streak_5'
  | 'secret_frugal_frenzy'
  | 'secret_clean_run'
  | 'secret_night_market';

export type AchievementUnlock = {
  id: AchievementId;
  unlockedAt: number;
  reward: number;
};

export type AchievementState = {
  unlocked: AchievementUnlock[];
  totalRewardDopamine: number;
  rareCardsPlayed: number;
  currentCheckoutStreak: number;
  bestCheckoutStreak: number;
  paydaysHit: number;
};

export type GameMenu = 'shop' | 'inventory' | 'activity' | 'badges';

export type Screen = 'landing' | 'quiz' | 'archetype' | 'game' | 'checkout' | 'results';
