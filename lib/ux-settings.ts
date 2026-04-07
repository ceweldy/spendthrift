'use client';

export type AnimationPreset = 'full' | 'balanced' | 'reduced';

export type UxSettings = {
  animationPreset: AnimationPreset;
};

const SETTINGS_KEY = 'spendthrift-ux-settings-v1';

const DEFAULT_SETTINGS: UxSettings = {
  animationPreset: 'balanced',
};

const isAnimationPreset = (value: unknown): value is AnimationPreset => value === 'full' || value === 'balanced' || value === 'reduced';

export function getUxSettings(): UxSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      animationPreset: isAnimationPreset(parsed?.animationPreset) ? parsed.animationPreset : DEFAULT_SETTINGS.animationPreset,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setUxSettings(next: Partial<UxSettings>) {
  if (typeof window === 'undefined') return;
  const merged = {
    ...getUxSettings(),
    ...next,
  };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent('spendthrift-ux-settings', { detail: merged }));
}

export function getAnimationDurationMultiplier(preset: AnimationPreset, prefersReducedMotion: boolean) {
  if (prefersReducedMotion) return 0;
  if (preset === 'full') return 1.1;
  if (preset === 'reduced') return 0.45;
  return 0.75;
}

export const animationPresetLabel: Record<AnimationPreset, string> = {
  full: 'Full',
  balanced: 'Balanced',
  reduced: 'Reduced',
};
