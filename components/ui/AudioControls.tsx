'use client';

import { useEffect, useState } from 'react';
import { audioManager, playSfx } from '@/lib/audio-manager';

type AudioSettings = {
  muted: boolean;
  volume: number;
};

export function AudioControls() {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());

  useEffect(() => {
    audioManager.setupAutoplayUnlock();

    const unsubscribe = audioManager.subscribe((nextSettings) => {
      setSettings(nextSettings);
    });

    const onButtonPress = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const actionable = target.closest('button, [role="button"], a[href]');
      if (!actionable) return;
      if ((actionable as HTMLElement).dataset?.noSfx === 'true') return;
      playSfx('uiClick');
    };

    document.addEventListener('pointerdown', onButtonPress, { capture: true, passive: true });

    return () => {
      unsubscribe();
      document.removeEventListener('pointerdown', onButtonPress, true);
    };
  }, []);

  return (
    <div className="fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs backdrop-blur">
      <button
        type="button"
        className="pill border border-white/10 bg-white/5 text-zinc-200"
        onClick={() => {
          audioManager.setMuted(!settings.muted);
        }}
        aria-label={settings.muted ? 'Unmute sound effects' : 'Mute sound effects'}
      >
        {settings.muted ? '🔇 Muted' : '🔊 SFX'}
      </button>
      <input
        aria-label="Sound effects volume"
        type="range"
        min={0}
        max={100}
        value={Math.round(settings.volume * 100)}
        onInput={(e) => {
          const next = Number((e.target as HTMLInputElement).value) / 100;
          audioManager.setVolume(next);
        }}
        onChange={(e) => {
          const next = Number(e.target.value) / 100;
          audioManager.setVolume(next);
        }}
        className="h-1 w-24 accent-purple"
      />
    </div>
  );
}
