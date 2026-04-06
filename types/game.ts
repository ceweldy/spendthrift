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

export type Card = {
  id: string;
  emoji: string;
  name: string;
  store: string;
  type: 'product' | 'event' | 'power' | 'trap';
  price?: number;
  dopamine?: number;
  risk?: number;
  desc?: string;
  effect?: string;
};

export type CartItem = Card & {
  paidPrice: number;
  finalDopamine: number;
};

export type Screen = 'landing' | 'quiz' | 'archetype' | 'game' | 'checkout' | 'results';
