import { useEffect, useMemo, useRef } from 'react';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useGameStore } from '@/store/useGameStore';

export function BadgesModal() {
  const state = useGameStore();
  const isOpen = state.badgeModalOpen;
  const closeBadgesView = state.closeBadgesView;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeBadgesView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeBadgesView]);

  const unlockedBadgeIds = useMemo(() => new Set(state.achievements.unlocked.map((badge) => badge.id)), [state.achievements.unlocked]);
  const badgeCards = useMemo(
    () =>
      ACHIEVEMENTS.map((badge) => {
        const progressRaw = badge.target(state, state.achievements);
        const progress = Math.min(1, progressRaw / badge.goal);
        return {
          ...badge,
          progressRaw,
          progress,
          unlocked: unlockedBadgeIds.has(badge.id),
        };
      }),
    [state, unlockedBadgeIds],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Badges"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeBadgesView();
      }}
    >
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold">🏅 Badge Collection</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:border-white/50"
            onClick={closeBadgesView}
            aria-label="Close badge viewer"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 overflow-y-auto p-4">
          {badgeCards.map((badge) => {
            const isHiddenLocked = Boolean(badge.hidden && !badge.unlocked);
            return (
              <div key={badge.id} className={`rounded-xl border p-3 ${badge.unlocked ? 'border-amber/50 bg-amber/10' : 'border-white/10 bg-black/20'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{isHiddenLocked ? '❓ ???' : `${badge.icon} ${badge.title}`}</div>
                  <span className={`pill ${badge.unlocked ? 'bg-teal/25 text-teal' : 'bg-white/10 text-zinc-400'}`}>{badge.unlocked ? 'Unlocked' : isHiddenLocked ? 'Secret' : 'Locked'}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-300">{isHiddenLocked ? 'Hidden badge. Keep playing to reveal unlock conditions.' : badge.description}</div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-white/10">
                  <div className={`h-full ${badge.unlocked ? 'bg-teal' : 'bg-purple'}`} style={{ width: `${Math.max(4, isHiddenLocked ? 0 : badge.progress * 100)}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">{isHiddenLocked ? `Progress: Hidden/${badge.goal} • Reward +${badge.reward} dopamine` : `Progress: ${Math.min(badge.goal, Math.round(badge.progressRaw))}/${badge.goal} • Reward +${badge.reward} dopamine`}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
