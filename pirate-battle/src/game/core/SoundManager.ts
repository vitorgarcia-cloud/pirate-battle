/**
 * MANIFESTO DE SONS DO JOGO
 * Para trocar ou adicionar sons no futuro, basta alterar ou adicionar os caminhos abaixo!
 */
export const SOUND_MANIFEST = {
  // --- MÚSICAS / AMBIENTE ---
  oceanAmbience: '/assets/sounds/ocean_ambience_loop.wav',
  sailingLoop: '/assets/sounds/ship_sailing_loop.wav',

  // --- CANHÕES E TIROS ---
  cannonFire: [
    '/assets/sounds/cannon_fire_1.wav',
    '/assets/sounds/cannon_fire_2.wav',
    '/assets/sounds/cannon_fire_3.wav',
  ],
  cannonBroadside: '/assets/sounds/cannon_broadside.wav',

  // --- IMPACTOS E EXPLOSÕES ---
  explosion: [
    '/assets/sounds/ship_explosion_1.wav',
    '/assets/sounds/ship_explosion_2.wav',
  ],
  woodHit: [
    '/assets/sounds/ship_wood_hit_1.wav',
    '/assets/sounds/ship_wood_hit_2.wav',
  ],
  waterHit: [
    '/assets/sounds/cannonball_water_hit_1.wav',
    '/assets/sounds/cannonball_water_hit_2.wav',
  ],
  shipCollision: '/assets/sounds/ship_collision.wav',
  shipSinking: '/assets/sounds/ship_sinking.wav',

  // --- INTERFACE E EVENTOS ---
  uiClick: '/assets/sounds/ui_click.wav',
  uiHover: '/assets/sounds/ui_hover.wav',
  gameStart: '/assets/sounds/game_start.wav',
  gameOver: '/assets/sounds/game_over.wav',
  gamePause: '/assets/sounds/game_pause.wav',
  gameResume: '/assets/sounds/game_resume.wav',
  scorePoint: '/assets/sounds/score_point.wav',
  healthLow: '/assets/sounds/health_low.wav',
  timeWarning: '/assets/sounds/time_warning.wav',
};

export type SoundKey = keyof typeof SOUND_MANIFEST;

export interface SoundSettings {
  muted: boolean;
  masterVolume: number; // 0.0 a 1.0
  sfxVolume: number;    // 0.0 a 1.0
  bgmVolume: number;    // 0.0 a 1.0
}

const STORAGE_SOUND_KEY = 'pirate_battle_sound_settings';

export class SoundManager {
  private static instance: SoundManager | null = null;
  private settings: SoundSettings;
  private bgmAudio: HTMLAudioElement | null = null;
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();

  constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private loadSettings(): SoundSettings {
    try {
      const raw = localStorage.getItem(STORAGE_SOUND_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return {
      muted: false,
      masterVolume: 0.8,
      sfxVolume: 0.8,
      bgmVolume: 0.5,
    };
  }

  public saveSettings(newSettings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_SOUND_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignora erro de storage
    }

    if (this.bgmAudio) {
      this.bgmAudio.volume = this.getEffectiveBGMVolume();
      if (this.settings.muted) {
        this.bgmAudio.pause();
      } else if (this.bgmAudio.paused) {
        this.bgmAudio.play().catch(() => {});
      }
    }
  }

  public getSettings(): Readonly<SoundSettings> {
    return this.settings;
  }

  private getEffectiveSFXVolume(): number {
    if (this.settings.muted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  private getEffectiveBGMVolume(): number {
    if (this.settings.muted) return 0;
    return this.settings.masterVolume * this.settings.bgmVolume;
  }

  /**
   * Toca um efeito sonoro (SFX)
   */
  public play(key: SoundKey, volumeMultiplier: number = 1.0): void {
    if (this.settings.muted) return;
    const effectiveVol = this.getEffectiveSFXVolume() * volumeMultiplier;
    if (effectiveVol <= 0) return;

    const source = SOUND_MANIFEST[key];
    if (!source) return;

    let srcPath: string;
    if (Array.isArray(source)) {
      srcPath = source[Math.floor(Math.random() * source.length)];
    } else {
      srcPath = source;
    }

    try {
      let pool = this.audioPool.get(srcPath);
      if (!pool) {
        pool = [];
        this.audioPool.set(srcPath, pool);
      }

      let audio = pool.find((a) => a.ended || a.paused);
      if (!audio) {
        audio = new Audio(srcPath);
        if (pool.length < 10) pool.push(audio);
      }

      audio.currentTime = 0;
      audio.volume = Math.min(1.0, Math.max(0, effectiveVol));
      audio.play().catch(() => {
        // Ignora restrições de autoplay do navegador antes do primeiro clique
      });
    } catch (err) {
      console.warn(`[SoundManager] Could not play sound '${key}':`, err);
    }
  }

  /**
   * Toca música/som de fundo (BGM) em loop
   */
  public playBGM(key: SoundKey = 'oceanAmbience'): void {
    const source = SOUND_MANIFEST[key];
    if (!source || Array.isArray(source)) return;

    if (this.bgmAudio && this.bgmAudio.src.endsWith(source)) {
      if (this.bgmAudio.paused && !this.settings.muted) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }

    this.stopBGM();

    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = this.getEffectiveBGMVolume();
    this.bgmAudio = audio;

    if (!this.settings.muted) {
      audio.play().catch(() => {});
    }
  }

  public stopBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
  }

  public toggleMute(): boolean {
    const newMuted = !this.settings.muted;
    this.saveSettings({ muted: newMuted });
    return newMuted;
  }
}

export const soundManager = SoundManager.getInstance();
