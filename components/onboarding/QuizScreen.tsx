import { motion } from 'framer-motion';
import { QUIZ_QUESTIONS } from '@/lib/game-data';
import { useGameStore } from '@/store/useGameStore';

export function QuizScreen() {
  const questionIndex = useGameStore((s) => s.questionIndex);
  const answerQuestion = useGameStore((s) => s.answerQuestion);
  const q = QUIZ_QUESTIONS[questionIndex];

  return (
    <section className="screen-wrap mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div>
        <div className="mb-3 h-1 overflow-hidden rounded bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-purple to-teal"
            animate={{ width: `${((questionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="text-xs text-zinc-400">Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}</p>
      </div>

      <div>
        <h2 className="mb-6 text-3xl font-bold">{q.q}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {q.options.map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-white/10 bg-bg-card p-4 text-left transition hover:border-purple"
              onClick={() => answerQuestion(opt.value)}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="mt-2 font-semibold">{opt.label}</div>
              <div className="text-xs text-zinc-400">{opt.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
