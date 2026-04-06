import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';
import { calculateCheckoutTotals } from '@/lib/game-engine';

const stepTitle = ['Review', 'Shipping', 'Confirm'];

const slide = {
  initial: { opacity: 0, x: 16, scale: 0.995 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -16, scale: 0.995 },
};

export function CheckoutModal() {
  const state = useGameStore();
  const { paymentMode, checkoutOpen, checkoutStep, cart, nextCheckoutStep, closeCheckout, completeCheckout } = state;
  const reducedMotion = useReducedMotion();

  const totals = calculateCheckoutTotals(state);
  const chargedTotal = paymentMode === 'demo-free' ? 0 : totals.total;
  const totalD = cart.reduce((a, c) => a + c.finalDopamine, 0);

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
        >
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#2f2e2c] p-5 sm:p-7"
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-purple/20 blur-2xl" />
            <button className="absolute right-4 top-3 text-xl text-zinc-500 transition hover:text-zinc-300" onClick={closeCheckout}>✕</button>

            <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Checkout · {stepTitle[checkoutStep]}</div>
            <div className="mb-2 text-xs text-zinc-400">{paymentMode === 'demo-free' ? 'Demo free checkout enabled (original prices still tracked)' : 'Real pricing (display only)'}</div>
            <div className="mb-6 flex gap-2">
              {[0, 1, 2].map((n) => (
                <span key={n} className="h-1.5 flex-1 overflow-hidden rounded bg-white/10">
                  <motion.span
                    className="block h-full rounded bg-purple"
                    initial={false}
                    animate={{ scaleX: checkoutStep >= n ? 1 : 0.12, opacity: checkoutStep >= n ? 1 : 0.45 }}
                    style={{ transformOrigin: 'left center' }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  />
                </span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {checkoutStep === 0 && (
                <motion.div key="step-0" variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.2 }}>
                  <h3 className="mb-4 text-xl font-bold">🛒 Your Cart</h3>
                  <div className="space-y-2">
                    {cart.map((c, idx) => (
                      <motion.div
                        key={c.id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex justify-between border-b border-white/10 py-2 text-sm"
                      >
                        <span>{c.emoji} {c.name}</span><span className="text-[#e07050]">${c.paidPrice}</span>
                      </motion.div>
                    ))}
                    {totals.shippingCut > 0 && <div className="flex justify-between py-2 text-sm"><span>🚚 Shipping Discount</span><span className="text-[#e07050]">-${totals.shippingCut}</span></div>}
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-400">Original total</span><span className="text-[#e07050]">${totals.total}</span></div>
                    <motion.div layout className="flex justify-between font-semibold"><span>Charged now</span><span className="text-teal">${chargedTotal}</span></motion.div>
                  </div>
                  <div className="mt-3 rounded-md border border-purple/30 bg-purple/10 p-3 text-sm text-purple-light">⚡ You&apos;ll gain <strong>{totalD} dopamine</strong> from this haul</div>
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Continue →</Button>
                </motion.div>
              )}

              {checkoutStep === 1 && (
                <motion.div key="step-1" variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.2 }}>
                  <h3 className="mb-2 text-xl font-bold">📦 Where should we ship?</h3>
                  <div className="mb-4 rounded-md border border-teal/30 bg-teal/10 p-3 text-sm text-teal">Virtual shipping only — no real address needed.</div>
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2 outline-none transition focus:border-purple/60 focus:ring-2 focus:ring-purple/30" defaultValue="Shopaholic" />
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2 outline-none transition focus:border-purple/60 focus:ring-2 focus:ring-purple/30" defaultValue="123 Shopping Lane" />
                  <input className="w-full rounded-md border border-white/10 bg-bg p-2 outline-none transition focus:border-purple/60 focus:ring-2 focus:ring-purple/30" placeholder="Retail City" />
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Place Order →</Button>
                </motion.div>
              )}

              {checkoutStep === 2 && (
                <motion.div key="step-2" variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.2 }} className="text-center">
                  <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal text-3xl text-black">✓
                    {!reducedMotion && [...Array(8)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute h-1.5 w-1.5 rounded-full bg-amber"
                        initial={{ x: 0, y: 0, opacity: 0.9 }}
                        animate={{
                          x: Math.cos((i / 8) * Math.PI * 2) * 44,
                          y: Math.sin((i / 8) * Math.PI * 2) * 44,
                          opacity: 0,
                          scale: 0.4,
                        }}
                        transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.35, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold">Order Placed! 🎉</h3>
                  <p className="mt-1 text-sm text-zinc-400">Charged ${chargedTotal}. Original tracked total: ${totals.total}</p>
                  <Button className="mt-5 w-full" onClick={completeCheckout}>Next Round →</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
