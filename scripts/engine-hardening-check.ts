import assert from 'node:assert/strict';

import {
  addCardToCart,
  calculateCheckoutTotals,
  checkout,
  createInitialEngineState,
  getCardPricing,
  playSpecialCard,
  type EngineState,
} from '@/lib/game-engine';
import type { Card } from '@/types/game';

const mkProduct = (overrides: Partial<Card> = {}): Card => ({
  id: 'test-product-1',
  name: 'Test Product',
  emoji: '🧪',
  type: 'product',
  price: 100,
  dopamine: 10,
  risk: 8,
  store: 'Tech',
  tags: [],
  ...overrides,
});

const mkSpecial = (effect: Card['effect'], id: string): Card => ({
  id,
  name: `Special ${effect}`,
  emoji: '✨',
  type: 'power',
  effect,
  store: 'Tech',
});

const runHardeningScenario = () => {
  let state: EngineState = createInitialEngineState('bargain_hawk', false);

  const priceyTech = mkProduct();
  const priceMatch = mkSpecial('price-match', 'special-price-match');
  const cashback = mkSpecial('cashback', 'special-cashback');
  const cartAbandon = mkSpecial('cart-abandon', 'special-cart-abandon');

  // Round 2 means checkout advances into round 3 (payday), and maxRounds=2 forces endgame.
  state = {
    ...state,
    round: 2,
    maxRounds: 2,
    budget: 500,
    hand: [priceMatch, cashback, cartAbandon, priceyTech],
    randomDiscountSecondsLeft: 25,
    randomDiscounts: { [priceyTech.id]: 0.25 },
    flashSaleSecondsLeft: 20,
    techDiscountRate: 0.15,
    shippingDiscount: 10,
  };

  state = playSpecialCard(state, priceMatch.id);
  state = playSpecialCard(state, cashback.id);
  state = playSpecialCard(state, cartAbandon.id);

  const pricing = getCardPricing(state, priceyTech);
  assert.equal(pricing.finalPrice, 27, 'stacked discounts should resolve multiplicatively and round correctly');

  state = addCardToCart(state, priceyTech.id);
  assert.equal(state.cart.length, 1, 'discounted product should be added to cart');
  assert.equal(state.cart[0].paidPrice, 27, 'cart should preserve discounted paid price');
  assert.equal(state.cart[0].savings, 73, 'cart should track full savings from stacked discounts');

  const totals = calculateCheckoutTotals(state);
  assert.equal(totals.subtotal, 27);
  assert.equal(totals.shippingCut, 10);
  assert.equal(totals.total, 17, 'shipping discount should reduce paid total');
  assert.equal(totals.cashback, 2, 'cashback should be based on charged total after discounts');
  assert.equal(totals.regretGain, 13, 'cart-abandon regret should stack into checkout regret');

  const { next, ended } = checkout(state);
  assert.equal(ended, true, 'maxRounds boundary should end the game cleanly');
  assert.equal(next.round, 3, 'checkout should still advance round even when it ends the run');
  assert.equal(next.lastPaydayRound, 3, 'payday metadata should record payday round at boundary');
  assert.equal(next.budget, 665, 'budget should apply charge, cashback, and payday injection in the same checkout');
  assert.equal(next.stats.ordersCompleted, 1, 'stats should record order completion at endgame');
  assert.equal(next.stats.totalSpent, 17, 'stats should record charged spend, not sticker spend');
  assert.equal(next.stats.totalOriginalSpent, 100, 'stats should retain original pre-discount spend baseline');
  assert.equal(next.inventory.length, 1, 'inventory should be updated on endgame checkout');

  console.log('✅ engine hardening scenario passed');
};

runHardeningScenario();
