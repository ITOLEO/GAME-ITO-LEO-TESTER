/**
 * AnimationController - Master per-character animation controller.
 * Integrates State Machine, Rig Engine, Multi-Layer Blend Manager,
 * Secondary Motion System, and Event Dispatcher.
 */

import * as THREE from "three";
import { WeaponType } from "../../types/game";
import {
  AnimationState,
  AnimationPriority,
  AnimationDebugData,
  HitReactionVector,
} from "./animationTypes";
import { AnimationStateMachine } from "./AnimationStateMachine";
import { AnimationBlendManager, RigPose, createDefaultPose } from "./AnimationBlendManager";
import { AnimationEventManager } from "./AnimationEventManager";
import { PlayerAnimationRig, AnimeModelParts } from "./PlayerAnimationRig";
import { SecondaryMotionSystem } from "./SecondaryMotionSystem";

export class AnimationController {
  public readonly stateMachine = new AnimationStateMachine();
  public readonly blendManager = new AnimationBlendManager();
  public readonly eventManager = new AnimationEventManager();
  public readonly rig = new PlayerAnimationRig();
  public readonly secondaryMotion = new SecondaryMotionSystem(7);

  // Model references
  private modelParts?: AnimeModelParts;
  private weaponType: WeaponType = WeaponType.SWORD;

  // Previous and Current Rig Poses for smooth crossfading
  private previousPose: RigPose = createDefaultPose();
  private currentPose: RigPose = createDefaultPose();
  private blendedPose: RigPose = createDefaultPose();

  // Test mode for manual inspection (Req 98)
  private testModeActive = false;
  private testState: AnimationState = "IDLE";
  private testTimeScrub = 0;

  // Last known movement vectors
  private currentVelocity = new THREE.Vector3();
  private currentSpeed = 0;
  private isGrounded = true;
  private isSprinting = false;

  // Hit reaction state
  private activeHitVector?: HitReactionVector;

  constructor() {
    this.setupInternalEvents();
  }

  public setModel(parts: AnimeModelParts, weaponType: WeaponType) {
    this.modelParts = parts;
    this.weaponType = weaponType;
  }

  public setWeaponType(weapon: WeaponType) {
    this.weaponType = weapon;
  }

  private setupInternalEvents() {
    // Footstep contact frame detection (Req 80)
    // Damage impact frame synchronization (Req 81, 82, 83)
  }

  public requestState(state: AnimationState, customBlend?: number): boolean {
    if (this.testModeActive) return false;
    return this.stateMachine.transitionTo(state, customBlend);
  }

  public triggerHit(hitVector: HitReactionVector) {
    this.activeHitVector = hitVector;
    this.stateMachine.transitionTo("HIT", 0.05);
  }

  public triggerStagger() {
    this.stateMachine.transitionTo("STAGGER", 0.08);
  }

  public triggerDeath() {
    this.stateMachine.transitionTo("DEATH", 0.15);
  }

  public triggerDodge(): boolean {
    return this.stateMachine.transitionTo("DODGE", 0.06);
  }

  public triggerAttack(isHeavy = false): { success: boolean; state: AnimationState } {
    if (isHeavy) {
      const ok = this.stateMachine.transitionTo("HEAVY_ATTACK", 0.08);
      return { success: ok, state: "HEAVY_ATTACK" };
    }
    const nextAttack = this.stateMachine.advanceCombo();
    const ok = this.stateMachine.transitionTo(nextAttack, 0.08);
    return { success: ok, state: nextAttack };
  }

  public triggerSkill(): boolean {
    return this.stateMachine.transitionTo("SKILL", 0.1);
  }

  public triggerUltimate(): boolean {
    return this.stateMachine.transitionTo("ULTIMATE", 0.12);
  }

  public setTestMode(active: boolean, state?: AnimationState) {
    this.testModeActive = active;
    if (state) this.testState = state;
  }

  public setTestTimeScrub(time: number) {
    this.testTimeScrub = Math.max(0, Math.min(1.0, time));
  }

  /**
   * Main animation tick called once per render frame.
   */
  public update(
    delta: number,
    velocity: THREE.Vector3,
    isGrounded: boolean,
    isSprinting: boolean,
    charPos: THREE.Vector3,
    charRotY: number,
    onHitWindow?: () => void,
    onFootstep?: (surface: string) => void
  ): void {
    this.currentVelocity.copy(velocity);
    this.currentSpeed = Math.hypot(velocity.x, velocity.z);
    this.isGrounded = isGrounded;
    this.isSprinting = isSprinting;

    // 1. Update State Machine
    let activeState: AnimationState;
    let normTime: number;
    let blendWeight: number;

    if (this.testModeActive) {
      activeState = this.testState;
      normTime = this.testTimeScrub > 0 ? this.testTimeScrub : (performance.now() * 0.001) % 1.0;
      blendWeight = 1.0;
    } else {
      // Natural locomotion state resolution if currently in movement priority
      this.resolveLocomotionState();

      const smResult = this.stateMachine.update(delta);
      activeState = smResult.currentState;
      normTime = smResult.normalizedTime;
      blendWeight = smResult.blendWeight;

      if (smResult.hasCompleted) {
        this.onStateCompleted(activeState);
      }
    }

    // 2. Eyeball Blinking (Req 10)
    const eyeScaleY = this.rig.updateBlink(delta);

    // 3. Evaluate Poses for Current and Previous States
    const targetPose = this.rig.evaluateStatePose(
      activeState,
      normTime,
      this.weaponType,
      this.currentSpeed,
      this.isSprinting,
      this.activeHitVector
    );
    targetPose.leftEyeScaleY = eyeScaleY;
    targetPose.rightEyeScaleY = eyeScaleY;

    // Crossfade blending (Req 5, 6)
    if (blendWeight < 1.0) {
      this.blendedPose = this.blendManager.blendPoses(this.previousPose, targetPose, blendWeight);
    } else {
      this.blendedPose = targetPose;
      this.previousPose = targetPose;
    }

    // 4. Secondary Motion (Cape, Hair, Accessories Spring Physics) (Req 71-75)
    this.secondaryMotion.update(delta, charPos, charRotY, isSprinting, !isGrounded);

    // 5. Apply Blended Pose & Secondary Physics to 3D Model
    if (this.modelParts) {
      this.applyPoseToModel(this.blendedPose, this.modelParts);
    }

    // 6. Check Footstep Contact Events (Req 80)
    const contacts = this.rig.getFootContacts();
    if (onFootstep && (contacts.left || contacts.right) && isGrounded && this.currentSpeed > 1.0) {
      // Triggered at exact foot contact phase
      this.eventManager.triggerOnceInWindow(
        "locomotion",
        normTime,
        0.2,
        0.3,
        { eventName: "OnFootstep", state: activeState, normalizedTime: normTime }
      );
      this.eventManager.triggerOnceInWindow(
        "locomotion",
        normTime,
        0.7,
        0.8,
        { eventName: "OnFootstep", state: activeState, normalizedTime: normTime }
      );
    }

    // 7. Check Combat Hit Impact Frames (Req 81, 82, 83)
    if (onHitWindow && activeState.startsWith("ATTACK")) {
      const isTriggered = this.eventManager.triggerOnceInWindow(
        activeState,
        normTime,
        0.42,
        0.58,
        { eventName: "OnHit", state: activeState, normalizedTime: normTime }
      );
      if (isTriggered) {
        onHitWindow();
      }
    } else if (onHitWindow && activeState === "HEAVY_ATTACK") {
      const isTriggered = this.eventManager.triggerOnceInWindow(
        activeState,
        normTime,
        0.50,
        0.66,
        { eventName: "OnHit", state: activeState, normalizedTime: normTime }
      );
      if (isTriggered) {
        onHitWindow();
      }
    } else if (onHitWindow && activeState === "SKILL") {
      const isTriggered = this.eventManager.triggerOnceInWindow(
        activeState,
        normTime,
        0.45,
        0.65,
        { eventName: "OnHit", state: activeState, normalizedTime: normTime }
      );
      if (isTriggered) {
        onHitWindow();
      }
    }
  }

  private resolveLocomotionState() {
    const curr = this.stateMachine.getCurrentState();

    // Do not override combat/reactions/airborne actions
    if (
      curr.startsWith("ATTACK") ||
      curr === "HEAVY_ATTACK" ||
      curr === "SKILL" ||
      curr === "ULTIMATE" ||
      curr === "DODGE" ||
      curr === "HIT" ||
      curr === "STAGGER" ||
      curr === "DEATH" ||
      curr.startsWith("EMOTE")
    ) {
      return;
    }

    if (!this.isGrounded) {
      if (this.currentVelocity.y > 0.5) {
        this.stateMachine.transitionTo("JUMP");
      } else {
        this.stateMachine.transitionTo("FALL");
      }
      return;
    }

    // Grounded locomotion
    if (this.currentSpeed > 6.5 && this.isSprinting) {
      this.stateMachine.transitionTo("SPRINT");
    } else if (this.currentSpeed > 3.0) {
      this.stateMachine.transitionTo("RUN");
    } else if (this.currentSpeed > 0.15) {
      this.stateMachine.transitionTo("WALK");
    } else {
      this.stateMachine.transitionTo("IDLE");
    }
  }

  private onStateCompleted(state: AnimationState) {
    if (
      state.startsWith("ATTACK") ||
      state === "HEAVY_ATTACK" ||
      state === "SKILL" ||
      state === "ULTIMATE" ||
      state === "DODGE" ||
      state === "HIT" ||
      state === "STAGGER" ||
      state === "LAND"
    ) {
      this.resolveLocomotionState();
    }
  }

  private applyPoseToModel(pose: RigPose, parts: AnimeModelParts) {
    // 1. Root & Body
    parts.root.position.y = pose.rootY;
    parts.body.position.copy(pose.bodyPos);
    parts.body.rotation.copy(pose.bodyRot);
    parts.body.scale.copy(pose.bodyScale);

    // 2. Head & Eyes
    parts.head.rotation.copy(pose.headRot);
    parts.eyes.scale.y = pose.leftEyeScaleY;

    // 3. Hair Spikes with Secondary Spring Inertia (Req 72)
    const hairSpikes = parts.hair.children;
    for (let i = 0; i < hairSpikes.length; i++) {
      const offset = this.secondaryMotion.getHairOffset(i);
      const spike = hairSpikes[i] as THREE.Mesh;
      spike.rotation.x = -0.3 + offset.rotX;
      spike.rotation.z = (i - 3) * 0.3 + offset.rotZ;
    }

    // 4. Cape with Dynamic Secondary Motion (Req 71)
    const capeOffset = this.secondaryMotion.getCapeOffset();
    parts.cape.rotation.x = 0.2 + capeOffset.rotX;
    parts.cape.rotation.z = capeOffset.rotZ;

    // 5. Arms & Legs
    parts.leftArm.rotation.copy(pose.leftArmRot);
    parts.rightArm.rotation.copy(pose.rightArmRot);
    parts.leftLeg.rotation.copy(pose.leftLegRot);
    parts.rightLeg.rotation.copy(pose.rightLegRot);

    // 6. Weapon Position & Rotation
    parts.weapon.position.copy(pose.weaponPos);
    parts.weapon.rotation.copy(pose.weaponRot);

    // 7. Dynamic Slash Arc Trail (Req 33)
    (parts.slashArc.material as THREE.MeshBasicMaterial).opacity = pose.slashArcOpacity;
    parts.slashArc.rotation.copy(pose.slashArcRot);
  }

  public getDebugData(): AnimationDebugData {
    return {
      currentState: this.stateMachine.getCurrentState(),
      previousState: this.stateMachine.getPreviousState(),
      normalizedTime: Math.round(this.stateMachine.getNormalizedTime() * 100) / 100,
      blendWeight: Math.round(this.stateMachine.getBlendWeight() * 100) / 100,
      playbackSpeed: 1.0,
      currentEvent: `Combo Step: ${this.stateMachine.getComboStep()}`,
      isGrounded: this.isGrounded,
      characterVelocity: [
        Math.round(this.currentVelocity.x * 100) / 100,
        Math.round(this.currentVelocity.y * 100) / 100,
        Math.round(this.currentVelocity.z * 100) / 100,
      ],
      planarSpeed: Math.round(this.currentSpeed * 10) / 10,
      weaponType: this.weaponType,
      activeLayer: "BASE + LOWER_BODY + UPPER_BODY + SECONDARY",
      testModeActive: this.testModeActive,
      testState: this.testState,
      secondaryPhysicsActive: true,
    };
  }
}
