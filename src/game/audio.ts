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

  // Level up fanfare with crystalline high tones
  public playLevelUp() {
    this.playFanfare();
  }

  // 1. Surface-dependent footsteps (grass, dirt, stone, wood, water)
  public playFootstep(surface: "grass" | "dirt" | "stone" | "wood" | "water" = "grass") {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (surface === "water") {
      // Liquid droplet splash
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320 + Math.random() * 120, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
      return;
    }

    if (surface === "stone") {
      // Hard crisp tap with high-frequency transient
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
      return;
    }

    if (surface === "wood") {
      // Hollow resonant knock
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
      return;
    }

    // Default: Grass / Dirt (soft muffled rustle)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.07);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 2. Jump & Landing
  public playJumpSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playLandSound(surface: "grass" | "dirt" | "stone" | "wood" | "water" = "grass") {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = surface === "stone" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(surface === "stone" ? 220 : 130, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // 3. Weapon-Specific Attack Sounds (Sword, Spear, Magic Catalyst, Greatsword)
  public playWeaponSlash(weaponType: string = "Sword", comboStep: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (weaponType === "Spear") {
      // Sharp piercing thrust whistle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(540 + comboStep * 120, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
      return;
    }

    if (weaponType === "Catalyst") {
      // Soft mystical resonance / chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440 + comboStep * 110, t);
      osc.frequency.exponentialRampToValueAtTime(880 + comboStep * 110, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.24);
      return;
    }

    if (weaponType === "Greatsword") {
      // Heavy deep cleaving swoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.22);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
      return;
    }

    // Default: Sword metallic slash
    this.playAttackSwing(comboStep);
  }

  // 4. Monster Vocalizations & Boss sounds
  public playMonsterSound(type: "slime" | "wolf" | "golem" | "boss" | "sentinel", action: "alert" | "attack" | "death") {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === "slime") {
      // Squishy bounce
      osc.type = "sine";
      osc.frequency.setValueAtTime(action === "alert" ? 340 : 180, t);
      osc.frequency.exponentialRampToValueAtTime(action === "alert" ? 520 : 90, t + 0.15);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    } else if (type === "boss" || type === "golem") {
      // Deep seismic roar
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(action === "alert" ? 95 : 120, t);
      osc.frequency.exponentialRampToValueAtTime(action === "death" ? 30 : 65, t + 0.45);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    } else {
      // Wolf / Sentinel beast growl
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.52);
  }

  // 5. Adaptive Japanese Fantasy MMORPG Dynamic Music Engine
  private currentBgmState: "exploration" | "village" | "combat" | "boss" = "exploration";

  public setBgmState(state: "exploration" | "village" | "combat" | "boss") {
    if (this.currentBgmState === state) return;
    this.currentBgmState = state;
  }

  public startAmbientBGM() {
    if (this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;

    // Japanese-inspired pentatonic & dorian scales
    const explorationScale = [220, 246.94, 277.18, 329.63, 370, 440, 493.88, 554.37, 659.25];
    const villageScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const battleScale = [110, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 329.63];
    const bossScale = [82.41, 98.00, 110.00, 123.47, 146.83, 164.81, 196.00];

    let step = 0;

    const playLoop = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

      const t = this.ctx.currentTime;
      let scale = explorationScale;
      let noteDuration = 2.2;
      let delay = 650 + Math.random() * 450;
      let waveType: OscillatorType = "sine";
      let filterFreq = 1400;
      let volume = 0.12;

      if (this.currentBgmState === "village") {
        scale = villageScale;
        waveType = "triangle";
        filterFreq = 1600;
        volume = 0.14;
        delay = 700 + Math.random() * 500;
      } else if (this.currentBgmState === "combat") {
        scale = battleScale;
        waveType = "sawtooth";
        filterFreq = 900;
        volume = 0.16;
        noteDuration = 0.6;
        delay = 240; // Driving 125 BPM combat tempo
      } else if (this.currentBgmState === "boss") {
        scale = bossScale;
        waveType = "sawtooth";
        filterFreq = 1100;
        volume = 0.2;
        noteDuration = 0.8;
        delay = 210; // Intense dramatic cadence
      }

      const noteFreq = scale[step % scale.length];
      step = (step + (Math.random() > 0.4 ? 1 : 2)) % scale.length;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(volume, t + Math.min(0.15, noteDuration * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + noteDuration + 0.05);

      setTimeout(playLoop, delay);
    };

    playLoop();
  }

  public stopAmbientBGM() {
    this.isBgmPlaying = false;
  }
}

export const audio = new SoundEngine();
