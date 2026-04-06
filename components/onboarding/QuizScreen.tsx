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
          <div className="h-full bg-purple transition-all" style={{ width: `${((questionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-zinc-400">Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}</p>
      </div>

      <div>
        <h2 className="mb-6 text-3xl font-bold">{q.q}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {q.options.map((opt) => (
            <button
              key={opt.label}
              className="rounded-xl border border-white/10 bg-bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-purple"
              onClick={() => answerQuestion(opt.value)}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="mt-2 font-semibold">{opt.label}</div>
              <div className="text-xs text-zinc-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
