import { Button } from '@/components/ui/Button';

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen-wrap flex flex-col items-center justify-between px-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple text-5xl font-black text-white shadow-[0_0_40px_rgba(83,74,183,0.4)]">S</div>
        <div>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">SPENDTHRIFT</h1>
          <p className="mt-1 text-zinc-400">The Compulsive Shopping Card Game</p>
        </div>
        <p className="max-w-md border-l-2 border-purple pl-4 text-left text-sm text-zinc-500">
          &ldquo;The thrill of the purchase. None of the financial guilt.&rdquo;
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="pill bg-purple/20 text-purple-light">Freemium</span>
          <span className="pill border border-white/10 bg-white/5 text-zinc-300">Browser-First</span>
          <span className="pill bg-teal/20 text-teal">No Real Money</span>
          <span className="pill bg-amber/20 text-amber">Brand Ready</span>
        </div>
        <Button className="px-8 py-4 text-base" onClick={onStart}>Start Shopping →</Button>
      </div>
      <footer className="w-full border-t border-white/10 py-5 text-xs text-zinc-500">Team 7 · Strategy Class · v2.0 PRD Build</footer>
    </section>
  );
}
