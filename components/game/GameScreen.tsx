import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { CheckoutModal } from './CheckoutModal';

export function GameScreen() {
  const s = useGameStore();

  const mood = Math.max(5, Math.min(100, 50 + s.dopamine * 0.35 - s.regret * 0.5));
  const cartD = s.cart.reduce((a, c) => a + c.finalDopamine, 0);

  return (
    <section className="screen-wrap">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#222220] px-6 py-4">
        <div className="font-extrabold text-purple-light">SPENDTHRIFT</div>
        <div className="flex gap-5 text-center text-xs">
          <Stat label="💰 Budget" value={`$${s.budget}`} color="text-teal" />
          <Stat label="⚡ Dopamine" value={`${s.dopamine}`} color="text-purple-light" />
          <Stat label="😬 Regret" value={`${s.regret}%`} color="text-[#e07050]" />
          <Stat label="🔄 Round" value={`${s.round}/${s.maxRounds}`} color="text-white" />
        </div>
        <Button variant="ghost" onClick={s.endGame}>End Game</Button>
      </div>

      <div className="border-b border-white/10 bg-[#222220] px-6 py-3">
        <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Mood Meter</p>
        <div className="h-1.5 overflow-hidden rounded bg-white/10">
          <motion.div animate={{ width: `${mood}%` }} className="h-full rounded bg-gradient-to-r from-coral via-amber to-teal" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div>
          <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Your Hand — Round {s.round}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {s.hand.map((card) => {
              const inCart = s.cart.some((c) => c.id === card.id);
              return (
                <div key={card.id} className={`rounded-xl border p-3 text-center transition hover:-translate-y-1 ${inCart ? 'border-teal bg-teal/10' : 'border-white/10 bg-bg-card hover:border-purple'}`}>
                  <div className="text-3xl">{card.emoji}</div>
                  <div className="mt-1 text-sm font-bold">{card.name}</div>
                  <div className="mt-1 text-xs text-zinc-400">{card.store}</div>
                  {card.type === 'product' ? (
                    <>
                      <div className="mt-2 text-lg font-bold text-[#e07050]">${card.price}</div>
                      <Button className="mt-2 w-full text-xs" disabled={inCart} onClick={() => s.addToCart(card.id)}>{inCart ? 'In Cart ✓' : 'Add to Cart'}</Button>
                    </>
                  ) : (
                    <Button className="mt-3 w-full bg-coral text-xs text-white hover:bg-[#7f3118]" onClick={() => s.playSpecial(card.id)}>Play Card</Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.18em] text-zinc-500">My Cart ({s.cart.length}/5 items)</h3>
            {s.cart.length > 0 && <span className="pill bg-purple/20 text-purple-light">+{cartD} dopamine</span>}
          </div>
          <div className="mb-4 flex min-h-10 flex-wrap gap-2">
            {s.cart.length === 0 ? <span className="text-sm italic text-zinc-500">No items yet — add cards from your hand above ☝️</span> : s.cart.map((c) => (
              <span key={c.id} className="pill border border-purple/40 bg-purple/20 text-purple-light">{c.emoji} {c.name} (${c.paidPrice}) <button className="ml-1 text-zinc-400" onClick={() => s.removeFromCart(c.id)}>×</button></span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={s.openCheckout} disabled={s.cart.length === 0}>Checkout →</Button>
            <button className="text-sm text-zinc-500" onClick={s.clearCart}>Clear Cart</button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#222220] p-4">
          <h4 className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Activity Log</h4>
          <div className="space-y-1 text-sm text-zinc-400">{s.logs.slice(0, 6).map((l, i) => <div key={`${l}-${i}`}>• {l}</div>)}</div>
        </div>
      </div>

      <CheckoutModal />
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div><div className={`text-lg font-bold ${color}`}>{value}</div></div>;
}
