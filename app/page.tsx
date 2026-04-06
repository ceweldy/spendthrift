'use client';

import { ArchetypeScreen } from '@/components/onboarding/ArchetypeScreen';
import { LandingScreen } from '@/components/onboarding/LandingScreen';
import { QuizScreen } from '@/components/onboarding/QuizScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { ScreenIndicator } from '@/components/ui/ScreenIndicator';
import { useGameStore } from '@/store/useGameStore';

export default function HomePage() {
  const screen = useGameStore((s) => s.screen);
  const startQuiz = useGameStore((s) => s.startQuiz);

  return (
    <main className="min-h-screen bg-bg text-[#F1EFE8]">
      {screen === 'landing' && <LandingScreen onStart={startQuiz} />}
      {screen === 'quiz' && <QuizScreen />}
      {screen === 'archetype' && <ArchetypeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'results' && <ResultsScreen />}
      <ScreenIndicator screen={screen} />
    </main>
  );
}
