/**
 * MonsterAnimationController - Dedicated movement language & combat animation
 * for Aetherling Stalkers (quadrupeds) and Ruin Vanguard Automatons (mechanical constructs).
 */

import * as THREE from "three";
import { MonsterAnimationState } from "./animationTypes";

export class MonsterAnimationController {
  private currentState: MonsterAnimationState = "MONSTER_IDLE";
  private stateTimer = 0;
  private animSpeed = 1.0;
  private earTwitchTimer = 2.0;
  private sniffTimer = 4.0;

  // Stalker quadruped parts
  private tailMesh?: THREE.Mesh;
  private headMesh?: THREE.Mesh;
  private legs: THREE.Mesh[] = [];

  constructor(private entityType: "aetherling" | "vanguard") {
    this.earTwitchTimer = 1.5 + Math.random() * 3.0;
    this.sniffTimer = 3.0 + Math.random() * 4.0;
  }

  public setMeshParts(parts: { tail?: THREE.Mesh; head?: THREE.Mesh; legs?: THREE.Mesh[] }) {
    this.tailMesh = parts.tail;
    this.headMesh = parts.head;
    if (parts.legs) this.legs = parts.legs;
  }

  public setState(state: MonsterAnimationState) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateTimer = 0;
  }

  public getState(): MonsterAnimationState {
    return this.currentState;
  }

  public update(
    delta: number,
    group: THREE.Group,
    isMoving: boolean,
    isAttacking: boolean,
    isStaggered: boolean,
    isDead: boolean,
    distanceToPlayer: number
  ) {
    this.stateTimer += delta * this.animSpeed;

    if (isDead) {
      this.setState("MONSTER_DEATH");
    } else if (isStaggered) {
      this.setState("MONSTER_STAGGER");
    } else if (isAttacking) {
      this.setState(this.entityType === "aetherling" ? "MONSTER_ATTACK_BITE" : "MONSTER_ATTACK_CLAW");
    } else if (isMoving) {
      this.setState(distanceToPlayer > 8 ? "MONSTER_RUN" : "MONSTER_WALK");
    } else {
      this.setState("MONSTER_IDLE");
    }

    if (this.entityType === "aetherling") {
      this.updateAetherling(delta, group, isMoving);
    } else {
      this.updateVanguard(delta, group, isMoving);
    }
  }

  // --- Aetherling Stalker (Quadruped Beast) Animation ---
  private updateAetherling(delta: number, group: THREE.Group, isMoving: boolean) {
    const t = this.stateTimer;

    if (this.currentState === "MONSTER_DEATH") {
      // Beast collapse: stumble and fall to side
      group.position.y = Math.max(0.1, group.position.y - delta * 2.0);
      group.rotation.z = Math.min(Math.PI * 0.45, group.rotation.z + delta * 3.0);
      return;
    }

    if (this.currentState === "MONSTER_STAGGER") {
      // Recoil backward, body compresses
      group.position.y = 0.5 + Math.sin(t * Math.PI * 4) * 0.1;
      group.rotation.x = -0.3;
      return;
    }

    if (this.currentState === "MONSTER_ATTACK_BITE") {
      // 1. Anticipation crouch -> 2. Explosive lunge -> 3. Snap bite -> 4. Recovery
      const attackCycle = (t % 1.2) / 1.2;
      if (attackCycle < 0.3) {
        // Crouch anticipation
        const c = attackCycle / 0.3;
        group.position.y = 0.45 - c * 0.2;
        group.rotation.x = c * 0.25;
      } else if (attackCycle < 0.65) {
        // Forward lunge & bite snap
        const l = (attackCycle - 0.3) / 0.35;
        group.position.y = 0.45 + Math.sin(l * Math.PI) * 0.35;
        group.rotation.x = -0.35 + l * 0.5;
      } else {
        // Recovery
        group.position.y = 0.65;
        group.rotation.x = 0;
      }
      return;
    }

    if (isMoving) {
      // Quadruped gallop / prowl
      const runCycle = t * 6.5;
      group.position.y = 0.65 + Math.abs(Math.sin(runCycle)) * 0.12;
      group.rotation.x = Math.sin(runCycle) * 0.08;
      group.rotation.z = Math.cos(runCycle * 0.5) * 0.06;

      // Tail dynamic wag
      if (this.tailMesh) {
        this.tailMesh.rotation.y = Math.sin(runCycle) * 0.4;
      }
    } else {
      // Idle breathing, ear twitches, sniffing
      const breath = Math.sin(t * 1.8) * 0.04;
      group.position.y = 0.65 + breath;
      group.rotation.x = breath * 0.5;
      group.rotation.z = 0;

      // Sniff flourish
      this.sniffTimer -= delta;
      if (this.sniffTimer <= 0) {
        group.position.y += Math.sin(t * 8.0) * 0.03;
        if (this.sniffTimer <= -1.2) {
          this.sniffTimer = 3.5 + Math.random() * 4.0;
        }
      }
    }
  }

  // --- Ruin Vanguard (Heavy Automaton) Animation ---
  private updateVanguard(delta: number, group: THREE.Group, isMoving: boolean) {
    const t = this.stateTimer;

    if (this.currentState === "MONSTER_DEATH") {
      // Mechanical shutdown: sparks, collapse to knees
      group.position.y = Math.max(0.4, group.position.y - delta * 1.8);
      group.rotation.x = Math.min(Math.PI * 0.35, group.rotation.x + delta * 2.0);
      return;
    }

    if (this.currentState === "MONSTER_STAGGER") {
      // Heavy piston recoil
      const stagger = Math.sin(t * Math.PI * 5) * 0.15;
      group.rotation.z = stagger;
      group.position.y = 2.0 - Math.abs(stagger) * 0.3;
      return;
    }

    if (this.currentState === "MONSTER_ATTACK_CLAW") {
      // Heavy mechanical punch with piston anticipation
      const attackCycle = (t % 1.8) / 1.8;
      if (attackCycle < 0.4) {
        // Windup: torso rotates right, raises heavy fist
        const w = attackCycle / 0.4;
        group.rotation.y += w * 0.4;
        group.position.y = 2.0 + w * 0.15;
      } else if (attackCycle < 0.7) {
        // Heavy punch forward impact!
        const p = (attackCycle - 0.4) / 0.3;
        group.rotation.y -= p * 0.8;
        group.position.y = 2.0 - Math.sin(p * Math.PI) * 0.25;
        group.rotation.x = p * 0.3;
      } else {
        // Piston reset
        group.rotation.x *= 0.85;
      }
      return;
    }

    if (isMoving) {
      // Heavy mechanical stomping with body compression
      const stomp = t * 4.0;
      group.position.y = 2.0 + Math.abs(Math.sin(stomp)) * 0.15;
      group.rotation.z = Math.sin(stomp * 0.5) * 0.08;
      group.rotation.x = 0.12;
    } else {
      // Idle generator hum & slight piston breathing
      const hum = Math.sin(t * 1.5) * 0.03;
      group.position.y = 2.0 + hum;
      group.rotation.x = 0;
      group.rotation.z = 0;
    }
  }
}
