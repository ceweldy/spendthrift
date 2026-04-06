import { Screen } from '@/types/game';

const order: Screen[] = ['landing', 'quiz', 'archetype', 'game', 'results'];

export function ScreenIndicator({ screen }: { screen: Screen }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/50 px-3 py-2">
      {order.map((s) => (
        <span key={s} className={`h-1.5 rounded-full transition-all ${s === screen ? 'w-5 bg-purple' : 'w-1.5 bg-zinc-500'}`} />
      ))}
    </div>
  );
}
