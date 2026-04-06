'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArchetypeScreen } from '@/components/onboarding/ArchetypeScreen';
import { LandingScreen } from '@/components/onboarding/LandingScreen';
import { QuizScreen } from '@/components/onboarding/QuizScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { ScreenIndicator } from '@/components/ui/ScreenIndicator';
import { useGameStore } from '@/store/useGameStore';

const variants = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
};

export default function HomePage() {
  const screen = useGameStore((s) => s.screen);
  const startQuiz = useGameStore((s) => s.startQuiz);
  const reducedMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-bg text-[#F1EFE8]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          variants={reducedMotion ? undefined : variants}
          initial={reducedMotion ? undefined : 'initial'}
          animate={reducedMotion ? undefined : 'animate'}
          exit={reducedMotion ? undefined : 'exit'}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {screen === 'landing' && <LandingScreen onStart={startQuiz} />}
          {screen === 'quiz' && <QuizScreen />}
          {screen === 'archetype' && <ArchetypeScreen />}
          {screen === 'game' && <GameScreen />}
          {screen === 'results' && <ResultsScreen />}
        </motion.div>
      </AnimatePresence>
      <ScreenIndicator screen={screen} />
    </main>
  );
}
