import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/useGameStore';

const stepTitle = ['Review', 'Shipping', 'Confirm'];

export function CheckoutModal() {
  const { checkoutOpen, checkoutStep, cart, shippingDiscount, nextCheckoutStep, closeCheckout, completeCheckout } = useGameStore();
  const reducedMotion = useReducedMotion();

  const subtotal = cart.reduce((a, c) => a + c.paidPrice, 0);
  const shippingCut = Math.min(subtotal, shippingDiscount);
  const total = Math.max(0, subtotal - shippingCut);
  const totalD = cart.reduce((a, c) => a + c.finalDopamine, 0);

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#2f2e2c] p-7"
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-purple/20 blur-2xl" />
            <button className="absolute right-4 top-3 text-xl text-zinc-500" onClick={closeCheckout}>✕</button>

            <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Checkout · {stepTitle[checkoutStep]}</div>
            <div className="mb-6 flex gap-2">{[0, 1, 2].map((n) => <span key={n} className={`h-1.5 flex-1 rounded ${checkoutStep >= n ? 'bg-purple' : 'bg-white/10'}`} />)}</div>

            <AnimatePresence mode="wait">
              {checkoutStep === 0 && (
                <motion.div key="step-0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h3 className="mb-4 text-xl font-bold">🛒 Your Cart</h3>
                  <div className="space-y-2">
                    {cart.map((c, idx) => (
                      <motion.div
                        key={c.id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex justify-between border-b border-white/10 py-2 text-sm"
                      >
                        <span>{c.emoji} {c.name}</span><span className="text-[#e07050]">${c.paidPrice}</span>
                      </motion.div>
                    ))}
                    {shippingCut > 0 && <div className="flex justify-between py-2 text-sm"><span>🚚 Shipping Discount</span><span className="text-[#e07050]">-${shippingCut}</span></div>}
                  </div>
                  <div className="mt-4 flex justify-between font-semibold"><span>Total</span><span className="text-[#e07050]">${total}</span></div>
                  <div className="mt-3 rounded-md border border-purple/30 bg-purple/10 p-3 text-sm text-purple-light">⚡ You&apos;ll gain <strong>{totalD} dopamine</strong> from this haul</div>
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Continue →</Button>
                </motion.div>
              )}

              {checkoutStep === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h3 className="mb-2 text-xl font-bold">📦 Where should we ship?</h3>
                  <div className="mb-4 rounded-md border border-teal/30 bg-teal/10 p-3 text-sm text-teal">Virtual shipping only — no real address needed.</div>
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2" defaultValue="Shopaholic" />
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2" defaultValue="123 Shopping Lane" />
                  <input className="w-full rounded-md border border-white/10 bg-bg p-2" placeholder="Retail City" />
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Place Order →</Button>
                </motion.div>
              )}

              {checkoutStep === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="text-center">
                  <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal text-3xl">✓
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
                        transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.3, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold">Order Placed! 🎉</h3>
                  <p className="mt-1 text-sm text-zinc-400">Your virtual haul is on the way</p>
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
