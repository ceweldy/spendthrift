import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { playSfx } from '@/lib/audio-manager';
import { useGameStore } from '@/store/useGameStore';
import { calculateCheckoutTotals } from '@/lib/game-engine';

const stepTitle = ['Review', 'Shipping', 'Confirm'];

export function CheckoutModal() {
  const state = useGameStore();
  const { paymentMode, checkoutOpen, checkoutStep, cart, nextCheckoutStep, closeCheckout, completeCheckout } = state;
  const reducedMotion = useReducedMotion();

  const totals = calculateCheckoutTotals(state);
  const chargedTotal = paymentMode === 'demo-free' ? 0 : totals.total;
  const totalD = cart.reduce((a, c) => a + c.finalDopamine, 0);
  const previousOpen = useRef(checkoutOpen);
  const previousStep = useRef(checkoutStep);

  useEffect(() => {
    if (checkoutOpen && !previousOpen.current) playSfx('checkoutOpen');
    previousOpen.current = checkoutOpen;
  }, [checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen) return;
    if (checkoutStep !== previousStep.current) {
      playSfx(checkoutStep === 2 ? 'checkoutConfirm' : 'checkoutStep');
    }
    previousStep.current = checkoutStep;
  }, [checkoutOpen, checkoutStep]);

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#2f2e2c] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.42)]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple/20 blur-2xl" />
            <button className="haptic-tap absolute right-4 top-3 rounded px-2 text-xl text-zinc-500 transition hover:text-zinc-300" onClick={closeCheckout}>✕</button>

            <div className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Checkout · {stepTitle[checkoutStep]}</div>
            <div className="mb-2 text-xs text-zinc-400">{paymentMode === 'demo-free' ? 'Demo free checkout enabled (original prices still tracked)' : 'Real pricing (display only)'}</div>
            <div className="mb-6 flex gap-2">
              {[0, 1, 2].map((n) => (
                <motion.span
                  key={n}
                  className={`h-1.5 flex-1 rounded ${checkoutStep >= n ? 'bg-purple' : 'bg-white/10'}`}
                  animate={checkoutStep === n ? { scaleY: [1, 1.35, 1] } : undefined}
                  transition={{ duration: 0.24 }}
                />
              ))}
            </div>

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
                    <div className="flex justify-between font-semibold"><span>Charged now</span><span className="text-teal">${chargedTotal}</span></div>
                  </div>
                  <motion.div
                    animate={reducedMotion ? undefined : { boxShadow: ['0 0 0 rgba(83,74,183,0)', '0 0 0 6px rgba(83,74,183,0.12)', '0 0 0 rgba(83,74,183,0)'] }}
                    transition={{ duration: 0.7 }}
                    className="mt-3 rounded-md border border-purple/30 bg-purple/10 p-3 text-sm text-purple-light"
                  >
                    ⚡ You&apos;ll gain <strong>{totalD} dopamine</strong> from this haul
                  </motion.div>
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Continue →</Button>
                </motion.div>
              )}

              {checkoutStep === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h3 className="mb-2 text-xl font-bold">📦 Where should we ship?</h3>
                  <div className="mb-4 rounded-md border border-teal/30 bg-teal/10 p-3 text-sm text-teal">Virtual shipping only — no real address needed.</div>
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2 transition focus:border-purple/60 focus:outline-none" defaultValue="Shopaholic" />
                  <input className="mb-2 w-full rounded-md border border-white/10 bg-bg p-2 transition focus:border-purple/60 focus:outline-none" defaultValue="123 Shopping Lane" />
                  <input className="w-full rounded-md border border-white/10 bg-bg p-2 transition focus:border-purple/60 focus:outline-none" placeholder="Retail City" />
                  <Button className="mt-5 w-full" onClick={nextCheckoutStep}>Place Order →</Button>
                </motion.div>
              )}

              {checkoutStep === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="text-center">
                  <motion.div
                    initial={reducedMotion ? undefined : { scale: 0.84, rotate: -6 }}
                    animate={reducedMotion ? undefined : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                    className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal text-3xl"
                  >
                    ✓
                    {!reducedMotion && [...Array(8)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute h-1.5 w-1.5 rounded-full bg-amber"
                        initial={{ x: 0, y: 0, opacity: 0.9 }}
                        animate={{
                          x: Math.cos((i / 8) * Math.PI * 2) * 36,
                          y: Math.sin((i / 8) * Math.PI * 2) * 36,
                          opacity: 0,
                          scale: 0.4,
                        }}
                        transition={{ duration: 0.65, delay: i * 0.025 }}
                      />
                    ))}
                  </motion.div>
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
