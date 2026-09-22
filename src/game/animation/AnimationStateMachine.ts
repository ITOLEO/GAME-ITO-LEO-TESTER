/**
 * AnimationStateMachine - Manages active state transitions, blend weights,
 * priority hierarchies, cancel windows, and interruptibility.
 */

import { AnimationPriority, AnimationState } from "./animationTypes";

export interface StateMachineNode {
  state: AnimationState;
  priority: AnimationPriority;
  duration: number; // total duration of clip in seconds (0 for looping)
  loop: boolean;
  interruptible: boolean;
  cancelWindowStart?: number; // normalized time where next action can queue/cancel
}

export class AnimationStateMachine {
  private currentState: AnimationState = "IDLE";
  private previousState: AnimationState = "IDLE";
  private stateTimer = 0;
  private stateDuration = 1.0;
  private isLooping = true;
  private blendTime = 0.15;
  private blendTimer = 0.15;
  private stateNodes: Map<AnimationState, StateMachineNode> = new Map();

  // Attack combo tracking
  private comboStep = 0;
  private comboWindowTimer = 0;

  constructor() {
    this.registerDefaultStates();
  }

  private registerDefaultStates() {
    // Locomotion & Baseline (Looping, low priority, fully interruptible)
    this.registerState({ state: "IDLE", priority: AnimationPriority.IDLE, duration: 4.0, loop: true, interruptible: true });
    this.registerState({ state: "WALK", priority: AnimationPriority.MOVEMENT, duration: 1.0, loop: true, interruptible: true });
    this.registerState({ state: "RUN", priority: AnimationPriority.MOVEMENT, duration: 0.8, loop: true, interruptible: true });
    this.registerState({ state: "SPRINT", priority: AnimationPriority.MOVEMENT, duration: 0.6, loop: true, interruptible: true });
    this.registerState({ state: "START_MOVEMENT", priority: AnimationPriority.MOVEMENT, duration: 0.16, loop: false, interruptible: true });
    this.registerState({ state: "STOP_MOVEMENT", priority: AnimationPriority.MOVEMENT, duration: 0.22, loop: false, interruptible: true });

    // Air & Physics
    this.registerState({ state: "JUMP_START", priority: AnimationPriority.MOVEMENT, duration: 0.12, loop: false, interruptible: false });
    this.registerState({ state: "JUMP", priority: AnimationPriority.MOVEMENT, duration: 0.8, loop: true, interruptible: true });
    this.registerState({ state: "FALL", priority: AnimationPriority.MOVEMENT, duration: 0.8, loop: true, interruptible: true });
    this.registerState({ state: "LAND", priority: AnimationPriority.MOVEMENT, duration: 0.24, loop: false, interruptible: true, cancelWindowStart: 0.4 });

    // Evasion & Combat Action
    this.registerState({ state: "DODGE", priority: AnimationPriority.DODGE, duration: 0.42, loop: false, interruptible: false, cancelWindowStart: 0.7 });
    this.registerState({ state: "ATTACK_01", priority: AnimationPriority.ATTACK, duration: 0.55, loop: false, interruptible: false, cancelWindowStart: 0.62 });
    this.registerState({ state: "ATTACK_02", priority: AnimationPriority.ATTACK, duration: 0.58, loop: false, interruptible: false, cancelWindowStart: 0.65 });
    this.registerState({ state: "ATTACK_03", priority: AnimationPriority.ATTACK, duration: 0.72, loop: false, interruptible: false, cancelWindowStart: 0.70 });
    this.registerState({ state: "HEAVY_ATTACK", priority: AnimationPriority.HEAVY_ATTACK, duration: 0.95, loop: false, interruptible: false, cancelWindowStart: 0.75 });
    this.registerState({ state: "SKILL", priority: AnimationPriority.SKILL, duration: 1.1, loop: false, interruptible: false, cancelWindowStart: 0.75 });
    this.registerState({ state: "ULTIMATE", priority: AnimationPriority.ULTIMATE, duration: 1.8, loop: false, interruptible: false, cancelWindowStart: 0.85 });

    // Reactions & Life
    this.registerState({ state: "HIT", priority: AnimationPriority.HIT, duration: 0.35, loop: false, interruptible: false, cancelWindowStart: 0.5 });
    this.registerState({ state: "STAGGER", priority: AnimationPriority.STAGGER, duration: 0.7, loop: false, interruptible: false, cancelWindowStart: 0.75 });
    this.registerState({ state: "DEATH", priority: AnimationPriority.DEATH, duration: 2.5, loop: false, interruptible: false });

    // Gear & Emotes
    this.registerState({ state: "EQUIP", priority: AnimationPriority.MOVEMENT, duration: 0.4, loop: false, interruptible: true });
    this.registerState({ state: "UNEQUIP", priority: AnimationPriority.MOVEMENT, duration: 0.4, loop: false, interruptible: true });
    this.registerState({ state: "EMOTE_WAVE", priority: AnimationPriority.IDLE, duration: 2.0, loop: false, interruptible: true });
    this.registerState({ state: "EMOTE_SIT", priority: AnimationPriority.IDLE, duration: 1.0, loop: true, interruptible: true });
    this.registerState({ state: "EMOTE_DANCE", priority: AnimationPriority.IDLE, duration: 2.5, loop: true, interruptible: true });
    this.registerState({ state: "EMOTE_VICTORY", priority: AnimationPriority.IDLE, duration: 2.2, loop: false, interruptible: true });
    this.registerState({ state: "EMOTE_BOW", priority: AnimationPriority.IDLE, duration: 1.8, loop: false, interruptible: true });
  }

  public registerState(node: StateMachineNode): void {
    this.stateNodes.set(node.state, node);
  }

  public canTransitionTo(targetState: AnimationState): boolean {
    if (this.currentState === targetState) return true;
    if (this.currentState === "DEATH") return false; // Death is final

    const currentConfig = this.stateNodes.get(this.currentState);
    const targetConfig = this.stateNodes.get(targetState);
    if (!currentConfig || !targetConfig) return true;

    // Check cancel window
    const normalized = this.getNormalizedTime();
    if (currentConfig.cancelWindowStart !== undefined && normalized >= currentConfig.cancelWindowStart) {
      return true;
    }

    // Check priorities
    if (targetConfig.priority > currentConfig.priority) {
      return true;
    }

    // If current state is fully interruptible
    if (currentConfig.interruptible) {
      return true;
    }

    return false;
  }

  public transitionTo(targetState: AnimationState, customBlendDuration?: number): boolean {
    if (!this.canTransitionTo(targetState)) {
      return false;
    }

    if (this.currentState === targetState && this.isLooping) {
      return true;
    }

    const targetConfig = this.stateNodes.get(targetState);
    this.previousState = this.currentState;
    this.currentState = targetState;
    this.stateTimer = 0;
    this.stateDuration = targetConfig?.duration ?? 1.0;
    this.isLooping = targetConfig?.loop ?? false;

    // Context-sensitive blend duration (Req 5, 6)
    if (customBlendDuration !== undefined) {
      this.blendTime = customBlendDuration;
    } else {
      this.blendTime = this.calculateBlendDuration(this.previousState, this.currentState);
    }
    this.blendTimer = 0;

    return true;
  }

  private calculateBlendDuration(from: AnimationState, to: AnimationState): number {
    if (to === "DODGE") return 0.06; // Ultra-snappy evasion
    if (to.startsWith("ATTACK")) return 0.08; // Crisp attack anticipation
    if (to === "HIT" || to === "STAGGER") return 0.05; // Immediate impact
    if (from === "IDLE" && to === "WALK") return 0.16;
    if (from === "WALK" && to === "RUN") return 0.14;
    if (from === "RUN" && to === "SPRINT") return 0.12;
    if (from === "SPRINT" && to === "RUN") return 0.18;
    if (to === "IDLE") return 0.20;
    if (to === "LAND") return 0.08;
    return 0.15;
  }

  public update(delta: number): {
    currentState: AnimationState;
    previousState: AnimationState;
    normalizedTime: number;
    blendWeight: number;
    hasCompleted: boolean;
  } {
    this.stateTimer += delta;
    this.blendTimer = Math.min(this.blendTime, this.blendTimer + delta);

    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= delta;
      if (this.comboWindowTimer <= 0) {
        this.comboStep = 0;
      }
    }

    let hasCompleted = false;
    if (!this.isLooping && this.stateTimer >= this.stateDuration) {
      hasCompleted = true;
    }

    const normalizedTime = this.stateDuration > 0
      ? (this.isLooping ? (this.stateTimer % this.stateDuration) / this.stateDuration : Math.min(1.0, this.stateTimer / this.stateDuration))
      : 1.0;

    // Smooth Hermite / Smoothstep blend weight
    const blendT = this.blendTime > 0 ? Math.min(1.0, this.blendTimer / this.blendTime) : 1.0;
    const blendWeight = blendT * blendT * (3 - 2 * blendT);

    return {
      currentState: this.currentState,
      previousState: this.previousState,
      normalizedTime,
      blendWeight,
      hasCompleted,
    };
  }

  public getCurrentState(): AnimationState {
    return this.currentState;
  }

  public getPreviousState(): AnimationState {
    return this.previousState;
  }

  public getNormalizedTime(): number {
    return this.stateDuration > 0
      ? (this.isLooping ? (this.stateTimer % this.stateDuration) / this.stateDuration : Math.min(1.0, this.stateTimer / this.stateDuration))
      : 1.0;
  }

  public getBlendWeight(): number {
    const blendT = this.blendTime > 0 ? Math.min(1.0, this.blendTimer / this.blendTime) : 1.0;
    return blendT * blendT * (3 - 2 * blendT);
  }

  // Combo handling
  public advanceCombo(): AnimationState {
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboWindowTimer = 1.2;
    if (this.comboStep === 1) return "ATTACK_01";
    if (this.comboStep === 2) return "ATTACK_02";
    return "ATTACK_03";
  }

  public resetCombo(): void {
    this.comboStep = 0;
    this.comboWindowTimer = 0;
  }

  public getComboStep(): number {
    return this.comboStep;
  }
}
