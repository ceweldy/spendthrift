'use client';

import { useEffect, useMemo, useState } from 'react';
import { audioManager, playSfx, type AudioSettings } from '@/lib/audio-manager';
import { animationPresetLabel, getUxSettings, setUxSettings, type AnimationPreset, type UxSettings } from '@/lib/ux-settings';

type SfxPreset = 'silent' | 'balanced' | 'immersive';

const sfxPresetLabels: Record<SfxPreset, string> = {
  silent: 'Silent',
  balanced: 'Balanced',
  immersive: 'Immersive',
};

export function AudioControls() {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());
  const [uxSettings, setLocalUxSettings] = useState<UxSettings>(() => getUxSettings());
  const [menuOpen, setMenuOpen] = useState(false);

  const activeSfxPreset = useMemo<SfxPreset>(() => {
    if (settings.muted || settings.volume === 0) return 'silent';
    if (settings.profile === 'hype' || settings.volume >= 0.6) return 'immersive';
    return 'balanced';
  }, [settings]);

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

    const onUxSettingsChange = (event: Event) => {
      const detail = (event as CustomEvent<UxSettings>).detail;
      if (detail?.animationPreset) {
        setLocalUxSettings(detail);
      }
    };

    document.addEventListener('pointerdown', onButtonPress, { capture: true, passive: true });
    window.addEventListener('spendthrift-ux-settings', onUxSettingsChange as EventListener);

    return () => {
      unsubscribe();
      document.removeEventListener('pointerdown', onButtonPress, true);
      window.removeEventListener('spendthrift-ux-settings', onUxSettingsChange as EventListener);
    };
  }, []);

  const setAnimationPreset = (preset: AnimationPreset) => {
    setUxSettings({ animationPreset: preset });
    setLocalUxSettings((prev) => ({ ...prev, animationPreset: preset }));
  };

  const applySfxPreset = (preset: SfxPreset) => {
    audioManager.applyProfilePreset(preset);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-2 text-xs backdrop-blur">
      <button
        type="button"
        className="pill border border-white/20 bg-white/10 text-zinc-100"
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
      <button
        type="button"
        className="pill border border-white/20 bg-white/10 text-zinc-100"
        aria-expanded={menuOpen}
        aria-label="Open quick settings"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ⚙️ Quick Settings
      </button>

      {menuOpen ? (
        <div className="absolute bottom-14 right-0 w-72 rounded-xl border border-white/20 bg-[#1f1f1d] p-3 shadow-2xl" role="dialog" aria-label="Quick settings menu">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">Animation Intensity</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(animationPresetLabel) as AnimationPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`pill border ${uxSettings.animationPreset === preset ? 'border-teal/80 bg-teal/25 text-teal' : 'border-white/20 bg-white/5 text-zinc-200 hover:bg-white/10'}`}
                onClick={() => setAnimationPreset(preset)}
                aria-pressed={uxSettings.animationPreset === preset}
              >
                {animationPresetLabel[preset]}
              </button>
            ))}
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">SFX Profile</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(sfxPresetLabels) as SfxPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                className={`pill border ${activeSfxPreset === preset ? 'border-purple/70 bg-purple/30 text-purple-light' : 'border-white/20 bg-white/5 text-zinc-200 hover:bg-white/10'}`}
                onClick={() => applySfxPreset(preset)}
                aria-pressed={activeSfxPreset === preset}
              >
                {sfxPresetLabels[preset]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-300">Tip: Keyboard shortcuts in game — 1/2/3/4 switch tabs, C checkout, K skip round, X clear cart, Shift+E end game.</p>
        </div>
      ) : null}
    </div>
  );
}
