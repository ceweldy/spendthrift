'use client';

type SfxName =
  | 'uiClick'
  | 'cardDeal'
  | 'addCart'
  | 'removeCart'
  | 'eventTrigger'
  | 'checkoutOpen'
  | 'checkoutStep'
  | 'checkoutConfirm'
  | 'dopamineGain'
  | 'rarePull'
  | 'roundTransition'
  | 'payday'
  | 'resultsReveal';

type SfxProfile = 'subtle' | 'default' | 'hype';

type AudioSettings = {
  muted: boolean;
  volume: number;
  profile: SfxProfile;
};

type AudioSettingsListener = (settings: AudioSettings) => void;

type Tone = {
  f: number;
  t: number;
  type?: OscillatorType;
  gain?: number;
  detune?: number;
};

const SETTINGS_KEY = 'spendthrift-audio-settings-v2';

const PROFILE_GAIN: Record<SfxProfile, number> = {
  subtle: 0.72,
  default: 1,
  hype: 1.2,
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private settings: AudioSettings = { muted: false, volume: 0.45, profile: 'default' };
  private ready = false;
  private lastUiClickAt = 0;
  private listeners = new Set<AudioSettingsListener>();

  constructor() {
    if (typeof window === 'undefined') return;
    this.settings = this.readSettings();
  }

  private readSettings(): AudioSettings {
    if (typeof window === 'undefined') return this.settings;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (!raw) return this.settings;
      const parsed = JSON.parse(raw);
      const profile: SfxProfile = parsed?.profile === 'subtle' || parsed?.profile === 'hype' ? parsed.profile : 'default';
      return {
        muted: Boolean(parsed?.muted),
        volume: Math.max(0, Math.min(1, Number(parsed?.volume ?? 0.45))),
        profile,
      };
    } catch {
      return this.settings;
    }
  }

  private emitSettings() {
    const snapshot = { ...this.settings };
    this.listeners.forEach((listener) => listener(snapshot));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spendthrift-audio-settings', { detail: snapshot }));
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
    this.emitSettings();
  }

  private ensureContext() {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;

    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.settings.muted ? 0 : this.getEffectiveVolume();
    this.master.connect(this.ctx.destination);
  }

  unlock = async () => {
    this.ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return;
      }
    }
    this.ready = this.ctx.state === 'running';
  };

  setupAutoplayUnlock() {
    if (typeof window === 'undefined') return;
    const once = () => {
      void this.unlock();
      window.removeEventListener('pointerdown', once);
      window.removeEventListener('keydown', once);
      this.ready = true;
    };
    window.addEventListener('pointerdown', once, { once: true, passive: true });
    window.addEventListener('keydown', once, { once: true });
  }

  getSettings() {
    return { ...this.settings };
  }

  subscribe(listener: AudioSettingsListener) {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getEffectiveVolume() {
    return this.settings.volume * PROFILE_GAIN[this.settings.profile];
  }

  private syncMasterGain() {
    if (!this.master) return;
    this.master.gain.value = this.settings.muted ? 0 : this.getEffectiveVolume();
  }

  setMuted(muted: boolean) {
    this.settings.muted = muted;
    this.syncMasterGain();
    this.saveSettings();
  }

  setVolume(volume: number) {
    const normalized = Math.max(0, Math.min(1, volume));
    this.settings.volume = normalized;
    this.syncMasterGain();
    this.saveSettings();
  }

  setProfile(profile: SfxProfile) {
    this.settings.profile = profile;
    this.syncMasterGain();
    this.saveSettings();
  }

  applyProfilePreset(preset: 'silent' | 'balanced' | 'immersive') {
    if (preset === 'silent') {
      this.settings = { ...this.settings, muted: true, volume: 0, profile: 'subtle' };
    } else if (preset === 'immersive') {
      this.settings = { ...this.settings, muted: false, volume: 0.65, profile: 'hype' };
    } else {
      this.settings = { ...this.settings, muted: false, volume: 0.45, profile: 'default' };
    }

    this.syncMasterGain();
    this.saveSettings();
  }

  private playSequence(notes: Tone[], opts?: { attack?: number; release?: number; at?: number }) {
    if (!this.ctx || !this.master || this.settings.muted) return;
    if (!this.ready && this.ctx.state !== 'running') return;

    const now = (opts?.at ?? this.ctx.currentTime) + 0.001;
    const attack = opts?.attack ?? 0.006;
    const release = opts?.release ?? 0.1;

    let cursor = now;
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = n.type ?? 'triangle';
      osc.frequency.setValueAtTime(n.f, cursor);
      if (typeof n.detune === 'number') osc.detune.setValueAtTime(n.detune, cursor);
      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.linearRampToValueAtTime(n.gain ?? 0.22, cursor + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + n.t + release);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(cursor);
      osc.stop(cursor + n.t + release + 0.02);
      cursor += Math.max(0.01, n.t * 0.65);
    });
  }

  play(name: SfxName) {
    this.ensureContext();
    if (!this.ctx || !this.master || this.settings.muted) return;

    if (name === 'uiClick') {
      const now = performance.now();
      if (now - this.lastUiClickAt < 45) return;
      this.lastUiClickAt = now;
    }

    switch (name) {
      case 'uiClick':
        this.playSequence([{ f: 520, t: 0.018, gain: 0.12 }, { f: 620, t: 0.02, gain: 0.1 }], { release: 0.05 });
        break;
      case 'cardDeal':
        this.playSequence([
          { f: 340, t: 0.03, type: 'sine', gain: 0.14 },
          { f: 420, t: 0.03, type: 'sine', gain: 0.12 },
          { f: 510, t: 0.02, type: 'triangle', gain: 0.1 },
        ]);
        break;
      case 'addCart':
        this.playSequence([{ f: 430, t: 0.02, gain: 0.14 }, { f: 660, t: 0.05, gain: 0.16 }]);
        break;
      case 'removeCart':
        this.playSequence([{ f: 560, t: 0.02, gain: 0.1 }, { f: 320, t: 0.06, gain: 0.14 }], { release: 0.07 });
        break;
      case 'eventTrigger':
        this.playSequence([
          { f: 260, t: 0.04, type: 'sawtooth', gain: 0.1 },
          { f: 390, t: 0.04, type: 'square', gain: 0.11 },
          { f: 520, t: 0.05, type: 'triangle', gain: 0.1 },
        ]);
        break;
      case 'checkoutOpen':
        this.playSequence([{ f: 280, t: 0.05, gain: 0.12 }, { f: 440, t: 0.06, gain: 0.14 }], { release: 0.12 });
        break;
      case 'checkoutStep':
        this.playSequence([{ f: 500, t: 0.03, gain: 0.11 }, { f: 700, t: 0.035, gain: 0.12 }]);
        break;
      case 'checkoutConfirm':
        this.playSequence([
          { f: 440, t: 0.04, gain: 0.14 },
          { f: 660, t: 0.05, gain: 0.16 },
          { f: 880, t: 0.09, gain: 0.16 },
        ]);
        break;
      case 'dopamineGain':
        this.playSequence([{ f: 700, t: 0.03, gain: 0.1 }, { f: 840, t: 0.05, gain: 0.12 }], { release: 0.08 });
        break;
      case 'rarePull':
        this.playSequence([
          { f: 620, t: 0.03, gain: 0.14, type: 'triangle' },
          { f: 820, t: 0.03, gain: 0.15, type: 'triangle' },
          { f: 1120, t: 0.1, gain: 0.2, type: 'sine' },
        ]);
        break;
      case 'roundTransition':
        this.playSequence([{ f: 240, t: 0.07, gain: 0.1 }, { f: 320, t: 0.07, gain: 0.1 }, { f: 410, t: 0.08, gain: 0.12 }]);
        break;
      case 'payday':
        // Deliberately louder / longer "ka-ching" so it stands out from other cues.
        this.playSequence([
          { f: 820, t: 0.035, gain: 0.28, type: 'square' },
          { f: 1180, t: 0.04, gain: 0.26, type: 'square' },
          { f: 1460, t: 0.06, gain: 0.22, type: 'triangle' },
          { f: 980, t: 0.09, gain: 0.2, type: 'sine' },
          { f: 1960, t: 0.22, gain: 0.24, type: 'sine' },
        ], { release: 0.18 });
        break;
      case 'resultsReveal':
        this.playSequence([
          { f: 392, t: 0.06, gain: 0.13 },
          { f: 523, t: 0.08, gain: 0.13 },
          { f: 659, t: 0.1, gain: 0.15 },
          { f: 784, t: 0.18, gain: 0.18 },
        ], { release: 0.16 });
        break;
      default:
        break;
    }
  }
}

export const audioManager = new AudioManager();

export const playSfx = (name: SfxName) => audioManager.play(name);
export type { SfxName, AudioSettings, SfxProfile };
