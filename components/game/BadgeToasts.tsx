import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useGameStore } from '@/store/useGameStore';

export function BadgeToasts() {
  const badgeToasts = useGameStore((s) => s.badgeToasts);
  const removeBadgeToast = useGameStore((s) => s.removeBadgeToast);

  useEffect(() => {
    const timers = badgeToasts.map((toast) => setTimeout(() => removeBadgeToast(toast.toastId), 3600));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [badgeToasts, removeBadgeToast]);

  return (
    <div className="pointer-events-none fixed right-3 top-20 z-[75] flex w-[min(92vw,340px)] flex-col gap-2 sm:right-5 sm:top-24">
      <AnimatePresence initial={false}>
        {badgeToasts.map((toast) => {
          const badge = ACHIEVEMENTS.find((a) => a.id === toast.achievementId);
          if (!badge) return null;
          return (
            <motion.div
              key={toast.toastId}
              initial={{ x: 120, opacity: 0, scale: 0.92 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 120, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-amber/50 bg-[#2f2c26]/95 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            >
              <div className="text-[10px] uppercase tracking-[0.16em] text-amber">Badge unlocked</div>
              <div className="mt-1 text-sm font-semibold text-[#f7f2df]">{badge.icon} {badge.title}</div>
              <div className="text-xs text-zinc-300">{badge.description}</div>
              {badge.reward > 0 ? <div className="mt-1 text-xs font-semibold text-teal">+{badge.reward} dopamine bonus</div> : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
