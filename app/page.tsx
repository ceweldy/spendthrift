'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArchetypeScreen } from '@/components/onboarding/ArchetypeScreen';
import { LandingScreen } from '@/components/onboarding/LandingScreen';
import { QuizScreen } from '@/components/onboarding/QuizScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { BadgeToasts } from '@/components/game/BadgeToasts';
import { BadgesModal } from '@/components/game/BadgesModal';
import { ScreenIndicator } from '@/components/ui/ScreenIndicator';
import { AudioControls } from '@/components/ui/AudioControls';
import { useGameStore } from '@/store/useGameStore';
import { getAnimationDurationMultiplier, getUxSettings } from '@/lib/ux-settings';

const variants = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
};

export default function HomePage() {
  const screen = useGameStore((s) => s.screen);
  const reducedMotion = useReducedMotion();
  const [animationPreset, setAnimationPreset] = useState(() => getUxSettings().animationPreset);
  const animationDuration = getAnimationDurationMultiplier(animationPreset, !!reducedMotion);

  useEffect(() => {
    const syncSettings = (event: Event) => {
      const detail = (event as CustomEvent<{ animationPreset?: 'full' | 'balanced' | 'reduced' }>).detail;
      if (detail?.animationPreset) setAnimationPreset(detail.animationPreset);
    };

    window.addEventListener('spendthrift-ux-settings', syncSettings as EventListener);
    return () => window.removeEventListener('spendthrift-ux-settings', syncSettings as EventListener);
  }, []);

  return (
    <main className="min-h-screen bg-bg text-[#F1EFE8]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          variants={reducedMotion ? undefined : variants}
          initial={reducedMotion ? undefined : 'initial'}
          animate={reducedMotion ? undefined : 'animate'}
          exit={reducedMotion ? undefined : 'exit'}
          transition={{ duration: 0.28 * animationDuration, ease: 'easeOut' }}
        >
          {screen === 'landing' && <LandingScreen />}
          {screen === 'quiz' && <QuizScreen />}
          {screen === 'archetype' && <ArchetypeScreen />}
          {screen === 'game' && <GameScreen />}
          {screen === 'results' && <ResultsScreen />}
        </motion.div>
      </AnimatePresence>
      <AudioControls />
      <BadgeToasts />
      <BadgesModal />
      <ScreenIndicator screen={screen} />
    </main>
  );
}
