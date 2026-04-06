'use client';

import { useMemo, useState } from 'react';
import type { Archetype, ArchetypeKey, Card, QuizQuestion, Screen } from '@/types/game';

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'You get paid and open your phone. What happens first?',
    options: [
      { emoji: '⚡', label: 'Buy now', desc: 'Immediate hit > future me.', value: 'impulse_king' },
      { emoji: '🏷️', label: 'Open deal apps', desc: 'I refuse to pay full price.', value: 'bargain_hawk' },
      { emoji: '✨', label: 'Brand check', desc: 'I need premium vibes.', value: 'status_flexer' },
      { emoji: '🧸', label: 'Comfort scroll', desc: 'Treats calm me down.', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'A friend sends you a flash sale link. You…',
    options: [
      { emoji: '🔥', label: 'Instant checkout', desc: 'Limited time = no time to think.', value: 'impulse_king' },
      { emoji: '🧮', label: 'Compare first', desc: 'Need proof this is best value.', value: 'bargain_hawk' },
      { emoji: '👑', label: 'Upgrade version', desc: 'Only the statement piece.', value: 'status_flexer' },
      { emoji: '☕', label: 'Add cozy extras', desc: 'Cart should feel emotionally safe.', value: 'comfort_seeker' },
    ],
  },
  {
    q: 'At checkout, the app suggests add-ons…',
    options: [
      { emoji: '➕', label: 'Add all', desc: 'Future me will thank me.', value: 'impulse_king' },
      { emoji: '🔎', label: 'Find coupons', desc: 'Not paying a cent extra.', value: 'bargain_hawk' },
      { emoji: '💎', label: 'Luxury add-on', desc: 'If I am doing it, I am doing it right.', value: 'status_flexer' },
      { emoji: '🛟', label: 'Protection plan', desc: 'Peace of mind matters.', value: 'comfort_seeker' },
    ],
  },
];

const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  impulse_king: {
    emoji: '⚡',
    title: 'Impulse Monarch',
    desc: 'Speed and excitement drive your decisions. Great for momentum, risky for budget control.',
    bonuses: ['+25 dopamine on novelty cards', '-15 wallet resilience on traps'],
  },
  bargain_hawk: {
    emoji: '🏷️',
    title: 'Bargain Hawk',
    desc: 'You optimize every dollar. You win long-term, but can still lose time and focus.',
    bonuses: ['+20 score on discounted products', '+10 risk resistance'],
  },
  status_flexer: {
    emoji: '✨',
    title: 'Status Flexer',
    desc: 'You buy identity, not just objects. Big upside socially, big downside financially.',
    bonuses: ['+30 dopamine on premium cards', '+15 regret if over budget'],
  },
  comfort_seeker: {
    emoji: '🧸',
    title: 'Comfort Seeker',
    desc: 'Shopping is emotional regulation. Reliable for mood, dangerous for habit loops.',
    bonuses: ['+18 dopamine from comfort picks', '+12 resilience on stress events'],
  },
};

const CARDS: Card[] = [
  { id: 'c1', emoji: '🎧', name: 'Noise-Canceling Headphones', store: 'EchoMart', type: 'product', price: 249, dopamine: 45, risk: 18 },
  { id: 'c2', emoji: '🧥', name: 'Limited Jacket Drop', store: 'ThreadHaus', type: 'product', price: 189, dopamine: 38, risk: 22 },
  { id: 'c3', emoji: '🧾', name: 'Late Fee Surprise', store: 'BankApp', type: 'trap', price: 35, dopamine: -10, risk: 30 },
  { id: 'c4', emoji: '🎟️', name: 'VIP Event Upsell', store: 'Nightline', type: 'event', price: 129, dopamine: 32, risk: 20 },
];

function pickArchetype(answers: ArchetypeKey[]): ArchetypeKey {
  const tally = answers.reduce<Record<ArchetypeKey, number>>(
    (acc, key) => {
      acc[key] += 1;
      return acc;
    },
    { impulse_king: 0, bargain_hawk: 0, status_flexer: 0, comfort_seeker: 0 },
  );

  return (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] as ArchetypeKey) ?? 'impulse_king';
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<ArchetypeKey[]>([]);
  const [cart, setCart] = useState<Card[]>([]);

  const archetypeKey = useMemo(() => pickArchetype(answers), [answers]);
  const archetype = ARCHETYPES[archetypeKey];

  const spend = cart.reduce((sum, card) => sum + (card.price ?? 0), 0);
  const dopamine = cart.reduce((sum, card) => sum + (card.dopamine ?? 0), 0);
  const risk = cart.reduce((sum, card) => sum + (card.risk ?? 0), 0);

  const reset = () => {
    setScreen('landing');
    setQIndex(0);
    setAnswers([]);
    setCart([]);
  };

  return (
    <main className="screen-wrap mx-auto max-w-3xl p-6 md:p-10">
      {screen === 'landing' && (
        <section className="space-y-5 rounded-xl border border-white/10 bg-[#363533] p-8">
          <p className="pill bg-purple-light text-purple">Spendthrift</p>
          <h1 className="text-4xl font-black tracking-tight">Can your wallet survive your shopper DNA?</h1>
          <p className="text-[#a09d97]">Take the quiz, reveal your archetype, play through purchase decisions, then survive checkout.</p>
          <button className="btn btn-primary" onClick={() => setScreen('quiz')}>Start Quiz</button>
        </section>
      )}

      {screen === 'quiz' && (
        <section className="space-y-5 rounded-xl border border-white/10 bg-[#363533] p-8">
          <p className="text-sm text-[#a09d97]">Question {qIndex + 1} of {QUESTIONS.length}</p>
          <h2 className="text-2xl font-bold">{QUESTIONS[qIndex].q}</h2>
          <div className="grid gap-3">
            {QUESTIONS[qIndex].options.map((option) => (
              <button
                key={option.label}
                className="rounded-lg border border-white/10 bg-[#2c2c2a] p-4 text-left transition hover:bg-[#3f3d3b]"
                onClick={() => {
                  const nextAnswers = [...answers, option.value];
                  setAnswers(nextAnswers);
                  if (qIndex + 1 < QUESTIONS.length) {
                    setQIndex(qIndex + 1);
                  } else {
                    setScreen('archetype');
                  }
                }}
              >
                <div className="font-semibold">{option.emoji} {option.label}</div>
                <div className="text-sm text-[#a09d97]">{option.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === 'archetype' && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#363533] p-8">
          <p className="text-sm uppercase tracking-wider text-[#a09d97]">Your archetype</p>
          <h2 className="text-3xl font-black">{archetype.emoji} {archetype.title}</h2>
          <p className="text-[#a09d97]">{archetype.desc}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#f1efe8]">
            {archetype.bonuses.map((bonus) => <li key={bonus}>{bonus}</li>)}
          </ul>
          <button className="btn btn-primary" onClick={() => setScreen('game')}>Enter Game</button>
        </section>
      )}

      {screen === 'game' && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#363533] p-8">
          <h2 className="text-2xl font-bold">Choose your cart</h2>
          <p className="text-sm text-[#a09d97]">Select at least one card, then continue to checkout.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {CARDS.map((card) => {
              const selected = cart.some((c) => c.id === card.id);
              return (
                <button
                  key={card.id}
                  className={`rounded-lg border p-4 text-left ${selected ? 'border-purple bg-purple/20' : 'border-white/10 bg-[#2c2c2a]'}`}
                  onClick={() => {
                    setCart((prev) =>
                      prev.some((c) => c.id === card.id) ? prev.filter((c) => c.id !== card.id) : [...prev, card],
                    );
                  }}
                >
                  <div className="font-semibold">{card.emoji} {card.name}</div>
                  <div className="text-sm text-[#a09d97]">{card.store} · ${card.price ?? 0}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-[#a09d97]">Selected: {cart.length}</p>
            <button className="btn btn-primary" disabled={cart.length === 0} onClick={() => setScreen('checkout')}>Go to Checkout</button>
          </div>
        </section>
      )}

      {screen === 'checkout' && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#363533] p-8">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <ul className="space-y-2 text-sm">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-md border border-white/10 p-3">
                <span>{item.emoji} {item.name}</span>
                <span>${item.price ?? 0}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-md bg-[#2c2c2a] p-4 text-sm text-[#a09d97]">
            <p>Total spend: <span className="text-white">${spend}</span></p>
            <p>Dopamine: <span className="text-white">{dopamine}</span></p>
            <p>Risk load: <span className="text-white">{risk}</span></p>
          </div>
          <button className="btn btn-primary" onClick={() => setScreen('results')}>Complete Purchase</button>
        </section>
      )}

      {screen === 'results' && (
        <section className="space-y-4 rounded-xl border border-white/10 bg-[#363533] p-8">
          <h2 className="text-3xl font-black">Results</h2>
          <p className="text-[#a09d97]">
            {archetype.title} run complete. You spent ${spend}, generated {dopamine} dopamine, and carried {risk} risk.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={reset}>Play Again</button>
            <button className="btn btn-ghost" onClick={() => setScreen('game')}>Back to Game</button>
          </div>
        </section>
      )}
    </main>
  );
}
