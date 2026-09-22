/**
 * Aetheria: Resonant Horizon - Procedural Web Audio Synthesizer
 * High-fidelity, zero-dependency browser game audio
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmOscillators: (OscillatorNode | GainNode)[] = [];
  private isBgmPlaying = false;
  private sfxVolume = 0.7;
  private bgmVolume = 0.35;
  private isMuted = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(sfx: number, bgm: number) {
    this.sfxVolume = sfx;
    this.bgmVolume = bgm;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(bgm, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Attack 1, 2, 3 swing sounds
  public playAttackSwing(comboStep: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const baseFreq = 220 + comboStep * 70;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * 2.2, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.14);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3, t);

    // Swoosh noise component
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(2400 + comboStep * 400, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
    noise.start(t);
    noise.stop(t + 0.13);
  }

  // Charged strike
  public playChargedAttack() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Hit impact
  public playHitSound(isCrit = false, isStagger = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? "triangle" : "square";
    const startFreq = isCrit ? 880 : 320;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + (isCrit ? 0.2 : 0.1));

    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.22 : 0.12));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + (isCrit ? 0.23 : 0.13));

    if (isStagger) {
      // Metallic resonant shatter
      this.playStaggerBreak();
    }
  }

  // Stagger break sound
  public playStaggerBreak() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 1.5, t + idx * 0.03);
      gain.gain.setValueAtTime(0.25, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.03);
      osc.stop(t + 0.52);
    });
  }

  // Dodge dash & Perfect Dodge
  public playDodgeSound(isPerfect = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isPerfect ? 380 : 180, t);
    osc.frequency.exponentialRampToValueAtTime(isPerfect ? 950 : 360, t + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, t);

    gain.gain.setValueAtTime(isPerfect ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isPerfect ? 0.35 : 0.2));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + (isPerfect ? 0.36 : 0.21));

    if (isPerfect) {
      // Time slowdown harmonic chime
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = "sine";
      bell.frequency.setValueAtTime(880, t + 0.05);
      bellGain.gain.setValueAtTime(0.4, t + 0.05);
      bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      bell.connect(bellGain);
      bellGain.connect(this.sfxGain);
      bell.start(t + 0.05);
      bell.stop(t + 0.62);
    }
  }

  // Character Skill
  public playSkillSound(element: string) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (element === "Ember") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    } else if (element === "Volt") {
      osc.type = "square";
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.setValueAtTime(1400, t + 0.05);
      osc.frequency.setValueAtTime(500, t + 0.15);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    }

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // Ultimate ability
  public playUltimateSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const chords = [261.63, 329.63, 392.00, 523.25, 659.25];
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.8);

      gain.gain.setValueAtTime(0.2, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.04);
      osc.stop(t + 1.25);
    });
  }

  // Chest open jingle
  public playChestOpen() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.3, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.38);
    });
  }

  // Material collected
  public playCollectSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, t);
    osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Level Up / Quest Complete fanfare
  public playButtonClickSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.35, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.52);
    });
  }

  // Ambient BGM: Relaxing anime fantasy pentatonic harp/flute pads
  public startAmbientBGM() {
    if (this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    const pentatonicScale = [220, 246.94, 277.18, 329.63, 370, 440, 493.88, 554.37, 659.25];
    let step = 0;

    const playLoop = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

      const t = this.ctx.currentTime;
      const noteFreq = pentatonicScale[step % pentatonicScale.length];
      step = (step + (Math.random() > 0.4 ? 1 : 2)) % pentatonicScale.length;

      // Soft flute/harp chime
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 2.3);

      // Schedule next note
      const delay = 600 + Math.random() * 500;
      setTimeout(playLoop, delay);
    };

    playLoop();
  }

  public stopAmbientBGM() {
    this.isBgmPlaying = false;
  }
}

export const audio = new SoundEngine();
