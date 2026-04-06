import { ArchetypeKey, Card } from '@/types/game';

type DrawWeights = {
  productStore: Record<string, number>;
  eventType: Record<Card['type'], number>;
};

const BASE_WEIGHTS: DrawWeights = {
  productStore: {
    Fashion: 1,
    Tech: 1,
    Home: 1,
    Food: 1,
    Luxury: 1,
    Beauty: 1,
  },
  eventType: {
    product: 0,
    event: 1,
    power: 1,
    trap: 1,
  },
};

const ARCHETYPE_WEIGHTS: Record<ArchetypeKey, DrawWeights> = {
  impulse_king: {
    productStore: { ...BASE_WEIGHTS.productStore, Tech: 1.4, Fashion: 1.25 },
    eventType: { ...BASE_WEIGHTS.eventType, event: 1.3, power: 1.1, trap: 0.9 },
  },
  bargain_hawk: {
    productStore: { ...BASE_WEIGHTS.productStore, Home: 1.2, Food: 1.2, Luxury: 0.7 },
    eventType: { ...BASE_WEIGHTS.eventType, power: 1.35, trap: 0.85, event: 1.1 },
  },
  status_flexer: {
    productStore: { ...BASE_WEIGHTS.productStore, Luxury: 1.6, Beauty: 1.15, Food: 0.8 },
    eventType: { ...BASE_WEIGHTS.eventType, power: 1.25, trap: 1.05, event: 0.95 },
  },
  comfort_seeker: {
    productStore: { ...BASE_WEIGHTS.productStore, Home: 1.5, Food: 1.3, Tech: 0.8 },
    eventType: { ...BASE_WEIGHTS.eventType, trap: 0.6, event: 1.2, power: 1.2 },
  },
};

export const drawWeighted = <T>(items: T[], weightFn: (item: T) => number): T | null => {
  if (!items.length) return null;
  const weighted = items
    .map((item) => ({ item, weight: Math.max(0, weightFn(item)) }))
    .filter((entry) => entry.weight > 0);

  if (!weighted.length) return items[Math.floor(Math.random() * items.length)] ?? null;

  const total = weighted.reduce((acc, entry) => acc + entry.weight, 0);
  let cursor = Math.random() * total;

  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }

  return weighted[weighted.length - 1]?.item ?? null;
};

export const drawUniqueWeighted = <T>(items: T[], count: number, weightFn: (item: T) => number): T[] => {
  const pool = [...items];
  const drawn: T[] = [];

  while (drawn.length < count && pool.length > 0) {
    const pick = drawWeighted(pool, weightFn);
    if (!pick) break;
    const idx = pool.indexOf(pick);
    if (idx >= 0) pool.splice(idx, 1);
    drawn.push(pick);
  }

  return drawn;
};

export const getArchetypeWeights = (archetype: ArchetypeKey): DrawWeights => ARCHETYPE_WEIGHTS[archetype];

export const getProductWeight = (card: Card, archetype: ArchetypeKey) => {
  const byStore = getArchetypeWeights(archetype).productStore;
  return byStore[card.store] ?? 1;
};

export const getEventWeight = (card: Card, archetype: ArchetypeKey) => {
  const byType = getArchetypeWeights(archetype).eventType;
  return byType[card.type] ?? 1;
};

export const getArchetypeBonus = (archetype: ArchetypeKey | null) => {
  if (!archetype) return 3;
  switch (archetype) {
    case 'impulse_king':
      return 4;
    case 'bargain_hawk':
      return 6;
    case 'status_flexer':
      return 5;
    case 'comfort_seeker':
      return 5;
    default:
      return 3;
  }
};
