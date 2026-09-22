/**
 * BossAnimationController - Dedicated Boss Animation State Machine for
 * the Resonant Colossus: Ignis-Titan.
 * Features massive breathing, telegraph anticipation, ground slam impact synchronization,
 * dramatic roar, phase transition transformation, and multi-stage death collapse.
 */

import * as THREE from "three";
import { BossAnimationState } from "./animationTypes";

export class BossAnimationController {
  private currentState: BossAnimationState = "BOSS_IDLE";
  private stateTimer = 0;
  private isEnraged = false;
  private phase = 1;

  // Boss limbs references
  private torsoMesh?: THREE.Mesh;
  private headMesh?: THREE.Mesh;
  private coreMesh?: THREE.Mesh;
  private fists: THREE.Mesh[] = [];

  constructor() {}

  public setParts(torso?: THREE.Mesh, head?: THREE.Mesh, core?: THREE.Mesh, fists: THREE.Mesh[] = []) {
    this.torsoMesh = torso;
    this.headMesh = head;
    this.coreMesh = core;
    this.fists = fists;
  }

  public setState(state: BossAnimationState) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateTimer = 0;
  }

  public getState(): BossAnimationState {
    return this.currentState;
  }

  public setEnraged(enraged: boolean) {
    this.isEnraged = enraged;
  }

  public setPhase(phase: number) {
    this.phase = phase;
  }

  public triggerRoar() {
    this.setState("BOSS_ROAR");
  }

  public triggerPhaseTransition() {
    this.setState("BOSS_PHASE_TRANSITION");
  }

  public triggerGroundSlam() {
    this.setState("BOSS_GROUND_SLAM");
  }

  public update(
    delta: number,
    group: THREE.Group,
    isMoving: boolean,
    isAttacking: boolean,
    isStaggered: boolean,
    isDead: boolean,
    onImpactFrame?: () => void
  ) {
    this.stateTimer += delta;

    if (isDead) {
      this.setState("BOSS_DEATH");
    } else if (this.currentState === "BOSS_PHASE_TRANSITION") {
      // Locking state during dramatic transformation
      if (this.stateTimer >= 3.0) {
        this.isEnraged = true;
        this.setState("BOSS_ENRAGED_IDLE");
      }
    } else if (this.currentState === "BOSS_ROAR") {
      if (this.stateTimer >= 2.2) {
        this.setState(this.isEnraged ? "BOSS_ENRAGED_IDLE" : "BOSS_IDLE");
      }
    } else if (this.currentState === "BOSS_GROUND_SLAM") {
      if (this.stateTimer >= 2.4) {
        this.setState(this.isEnraged ? "BOSS_ENRAGED_IDLE" : "BOSS_IDLE");
      }
    } else if (isStaggered) {
      this.setState("BOSS_STAGGER");
    } else if (isAttacking) {
      this.setState(this.isEnraged ? "BOSS_ENRAGED_ATTACK" : "BOSS_ATTACK_CLAW");
    } else if (isMoving) {
      this.setState("BOSS_CHASE");
    } else {
      this.setState(this.isEnraged ? "BOSS_ENRAGED_IDLE" : "BOSS_IDLE");
    }

    this.animateBoss(delta, group, onImpactFrame);
  }

  private animateBoss(delta: number, group: THREE.Group, onImpactFrame?: () => void) {
    const t = this.stateTimer;

    // Magma Core continuous pulsation
    if (this.coreMesh) {
      const pulseRate = this.isEnraged ? 8.0 : 3.0;
      const coreScale = 1.0 + Math.sin(t * pulseRate) * (this.isEnraged ? 0.25 : 0.12);
      this.coreMesh.scale.set(coreScale, coreScale, coreScale);
    }

    // --- 1. BOSS DEATH COLLAPSE (Req 63) ---
    if (this.currentState === "BOSS_DEATH") {
      const fall = Math.min(1.0, t / 4.0);
      group.position.y = Math.max(0.5, group.position.y - delta * 1.5);
      group.rotation.x = fall * (Math.PI * 0.42);
      if (this.fists.length >= 2) {
        this.fists[0].position.y = Math.max(0.5, this.fists[0].position.y - delta * 2.0);
        this.fists[1].position.y = Math.max(0.5, this.fists[1].position.y - delta * 2.0);
      }
      return;
    }

    // --- 2. BOSS STAGGER (Req 49) ---
    if (this.currentState === "BOSS_STAGGER") {
      const stagger = Math.sin(t * Math.PI * 3) * 0.18;
      group.rotation.x = -0.25;
      group.rotation.z = stagger;
      return;
    }

    // --- 3. BOSS ROAR (Req 58) ---
    if (this.currentState === "BOSS_ROAR") {
      const roarPhase = t / 2.2;
      if (roarPhase < 0.3) {
        // Preparation: chest compresses, head lowers
        const c = roarPhase / 0.3;
        group.rotation.x = c * 0.2;
      } else if (roarPhase < 0.8) {
        // ROAR: Body expands, head rises high, chest expands violently
        const r = (roarPhase - 0.3) / 0.5;
        group.rotation.x = -0.35;
        if (this.headMesh) this.headMesh.position.y = 7.5 + Math.sin(r * Math.PI) * 0.5;
        if (this.torsoMesh) this.torsoMesh.scale.set(1.15, 1.1, 1.15);
      } else {
        group.rotation.x *= 0.9;
        if (this.torsoMesh) this.torsoMesh.scale.set(1, 1, 1);
      }
      return;
    }

    // --- 4. BOSS PHASE TRANSITION (Req 61) ---
    if (this.currentState === "BOSS_PHASE_TRANSITION") {
      // 1. Boss stops, body vibrates -> 2. Energy flare -> 3. Explosive roar
      const vibrate = Math.sin(t * 30.0) * 0.08;
      group.position.x += vibrate;
      if (t > 1.2 && this.coreMesh) {
        this.coreMesh.scale.set(1.6, 1.6, 1.6);
      }
      return;
    }

    // --- 5. BOSS GROUND SLAM (Req 60) ---
    if (this.currentState === "BOSS_GROUND_SLAM") {
      const slamT = t / 2.4;
      if (slamT < 0.45) {
        // Anticipation: raises huge stone fists high into air, crouches
        const w = slamT / 0.45;
        group.position.y += w * 0.8;
        if (this.fists.length >= 2) {
          this.fists[0].position.set(-3.2, 3.5 + w * 3.5, 0.5 + w * 1.5);
          this.fists[1].position.set(3.2, 3.5 + w * 3.5, 0.5 + w * 1.5);
        }
      } else if (slamT < 0.65) {
        // Devastating Slam Impact!
        const slam = (slamT - 0.45) / 0.2;
        group.position.y = Math.max(0, group.position.y - delta * 18.0);
        if (this.fists.length >= 2) {
          this.fists[0].position.set(-2.5, 1.0, 3.2);
          this.fists[1].position.set(2.5, 1.0, 3.2);
        }
        if (slamT >= 0.55 && slamT - delta < 0.55 && onImpactFrame) {
          onImpactFrame();
        }
      } else {
        // Heavy recovery: stone fists lift back up
        const r = (slamT - 0.65) / 0.35;
        if (this.fists.length >= 2) {
          this.fists[0].position.y = 1.0 + r * 2.5;
          this.fists[1].position.y = 1.0 + r * 2.5;
        }
      }
      return;
    }

    // --- 6. BOSS ATTACKS (Req 59, 62) ---
    if (this.currentState === "BOSS_ATTACK_CLAW" || this.currentState === "BOSS_ENRAGED_ATTACK") {
      const spd = this.isEnraged ? 2.2 : 1.6;
      const attackCycle = (t * spd) % 2.0;

      if (attackCycle < 0.8) {
        // Telegraph windup: shoulder pulls back, fist rises
        const w = attackCycle / 0.8;
        group.rotation.y += w * 0.45;
        if (this.fists.length >= 2) {
          this.fists[1].position.set(3.2 + w * 1.2, 3.5 + w * 2.0, -1.0 * w);
        }
      } else if (attackCycle < 1.3) {
        // Sweeping strike forward
        const s = (attackCycle - 0.8) / 0.5;
        group.rotation.y -= s * 0.9;
        if (this.fists.length >= 2) {
          this.fists[1].position.set(3.2 - s * 4.5, 3.5, 2.5);
        }
        if (attackCycle >= 1.0 && attackCycle - delta * spd < 1.0 && onImpactFrame) {
          onImpactFrame();
        }
      } else {
        // Recovery
        group.rotation.y *= 0.9;
      }
      return;
    }

    // --- 7. CHASE / LOCOMOTION ---
    if (this.currentState === "BOSS_CHASE") {
      const step = t * (this.isEnraged ? 4.5 : 3.0);
      group.position.y += Math.abs(Math.sin(step)) * 0.25;
      group.rotation.z = Math.sin(step * 0.5) * 0.08;
      group.rotation.x = this.isEnraged ? 0.2 : 0.1;
      return;
    }

    // --- 8. IDLE MASSIVE BREATHING (Req 57) ---
    const breathSpeed = this.isEnraged ? 2.5 : 1.2;
    const breath = Math.sin(t * breathSpeed) * (this.isEnraged ? 0.12 : 0.06);
    if (this.torsoMesh) {
      this.torsoMesh.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);
    }
    group.rotation.x = this.isEnraged ? 0.15 : 0;
    group.rotation.z = 0;
  }
}
