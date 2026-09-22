/**
 * PlayerAnimationRig - Procedural & Keyframed Anime Skeletal Rig Engine.
 * Evaluates anatomical poses for all states, weapons, and movement cycles.
 */

import * as THREE from "three";
import { WeaponType } from "../../types/game";
import { AnimationState, HitReactionVector } from "./animationTypes";
import { RigPose, createDefaultPose } from "./AnimationBlendManager";

export interface AnimeModelParts {
  root: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  hair: THREE.Group;
  eyes: THREE.Mesh;
  cape: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weapon: THREE.Group;
  slashArc: THREE.Mesh;
  sockets: {
    head: THREE.Group;
    chest: THREE.Group;
    back: THREE.Group;
    hip: THREE.Group;
    leftHand: THREE.Group;
    rightHand: THREE.Group;
    foot: THREE.Group;
  };
}

export class PlayerAnimationRig {
  // Blinking state machine (Req 10)
  private blinkTimer = 3.0;
  private isBlinking = false;
  private blinkProgress = 0;
  private isDoubleBlink = false;

  // Idle variation state machine (Req 8)
  private idleVariationTimer = 0;
  private idleVariationIndex = 0;

  // Foot contact tracker for footstep sync & anti-sliding (Req 14, 15, 80)
  private leftFootContact = false;
  private rightFootContact = false;

  // Direction turn smoothing (Req 20)
  private turnLean = 0;

  constructor() {
    this.resetBlinkTimer();
  }

  private resetBlinkTimer() {
    // Randomized interval 2.5 - 6 seconds (Req 10)
    this.blinkTimer = 2.5 + Math.random() * 3.5;
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.isDoubleBlink = Math.random() < 0.25; // 25% chance of double blink
  }

  public updateBlink(delta: number): number {
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkProgress += delta * 12; // Snappy eyelid shut and open
      if (this.blinkProgress >= 1.0) {
        if (this.isDoubleBlink) {
          this.isDoubleBlink = false;
          this.blinkProgress = 0;
          this.blinkTimer = 0.12; // Quick pause between double blinks
        } else {
          this.resetBlinkTimer();
        }
      }
    }
    // Eye scale: 1 -> 0.1 -> 1
    if (this.isBlinking) {
      return 1.0 - Math.sin(this.blinkProgress * Math.PI) * 0.92;
    }
    return 1.0;
  }

  /**
   * Generates a complete mathematical pose for any animation state,
   * weapon style, and normalized cycle time.
   */
  public evaluateStatePose(
    state: AnimationState,
    normalizedTime: number,
    weaponType: WeaponType,
    speed: number,
    isSprinting: boolean,
    hitVector?: HitReactionVector,
    lookTarget?: THREE.Vector2
  ): RigPose {
    const pose = createDefaultPose();
    const cycleTime = normalizedTime * Math.PI * 2;

    switch (state) {
      case "IDLE":
        this.evaluateIdle(pose, normalizedTime, weaponType, lookTarget);
        break;

      case "WALK":
        this.evaluateLocomotion(pose, cycleTime, false, speed, weaponType);
        break;

      case "RUN":
        this.evaluateLocomotion(pose, cycleTime, false, speed, weaponType);
        break;

      case "SPRINT":
        this.evaluateLocomotion(pose, cycleTime, true, speed, weaponType);
        break;

      case "START_MOVEMENT":
        this.evaluateStartMovement(pose, normalizedTime);
        break;

      case "STOP_MOVEMENT":
        this.evaluateStopMovement(pose, normalizedTime);
        break;

      case "JUMP_START":
        this.evaluateJumpStart(pose, normalizedTime);
        break;

      case "JUMP":
        this.evaluateJumpAirborne(pose, normalizedTime);
        break;

      case "FALL":
        this.evaluateFall(pose, normalizedTime);
        break;

      case "LAND":
        this.evaluateLanding(pose, normalizedTime);
        break;

      case "DODGE":
        this.evaluateDodge(pose, normalizedTime);
        break;

      case "ATTACK_01":
        this.evaluateAttack1(pose, normalizedTime, weaponType);
        break;

      case "ATTACK_02":
        this.evaluateAttack2(pose, normalizedTime, weaponType);
        break;

      case "ATTACK_03":
        this.evaluateAttack3(pose, normalizedTime, weaponType);
        break;

      case "HEAVY_ATTACK":
        this.evaluateHeavyAttack(pose, normalizedTime, weaponType);
        break;

      case "SKILL":
        this.evaluateSkill(pose, normalizedTime, weaponType);
        break;

      case "ULTIMATE":
        this.evaluateUltimate(pose, normalizedTime, weaponType);
        break;

      case "HIT":
        this.evaluateHitReaction(pose, normalizedTime, hitVector);
        break;

      case "STAGGER":
        this.evaluateStagger(pose, normalizedTime);
        break;

      case "DEATH":
        this.evaluateDeath(pose, normalizedTime);
        break;

      case "EQUIP":
        this.evaluateEquip(pose, normalizedTime, weaponType);
        break;

      case "UNEQUIP":
        this.evaluateUnequip(pose, normalizedTime, weaponType);
        break;

      case "EMOTE_WAVE":
        this.evaluateEmoteWave(pose, normalizedTime);
        break;

      case "EMOTE_SIT":
        this.evaluateEmoteSit(pose);
        break;

      case "EMOTE_DANCE":
        this.evaluateEmoteDance(pose, normalizedTime);
        break;

      case "EMOTE_VICTORY":
        this.evaluateEmoteVictory(pose, normalizedTime);
        break;

      case "EMOTE_BOW":
        this.evaluateEmoteBow(pose, normalizedTime);
        break;
    }

    return pose;
  }

  // --- 1. IDLE & BREATHING SYSTEM (Req 8, 9, 11, 28, 35, 39) ---
  private evaluateIdle(
    pose: RigPose,
    t: number,
    weaponType: WeaponType,
    lookTarget?: THREE.Vector2
  ) {
    const timeSec = t * 4.0;
    // Breathing cycle (chest & torso heave)
    const breath = Math.sin(timeSec * 1.4) * 0.035;
    pose.bodyScale.set(1.0 + breath * 0.6, 1.0 + breath, 1.0 + breath * 0.6);
    pose.bodyPos.y = 1.35 + breath * 0.2;

    // Subtle hip weight shift (Req 8)
    const weightShift = Math.sin(timeSec * 0.7) * 0.04;
    pose.bodyRot.z = weightShift;
    pose.bodyRot.y = Math.cos(timeSec * 0.5) * 0.03;

    // Head look & subtle organic motion (Req 11)
    pose.headRot.x = Math.sin(timeSec * 1.4) * 0.02;
    pose.headRot.y = (lookTarget ? lookTarget.x * 0.35 : 0) + Math.sin(timeSec * 0.4) * 0.06;
    pose.headRot.z = -weightShift * 0.5;

    // Legs: slight relaxed stance with balanced stance
    pose.leftLegRot.x = 0.05;
    pose.leftLegRot.z = -0.06;
    pose.rightLegRot.x = -0.03;
    pose.rightLegRot.z = 0.06;

    // Weapon-specific idle postures (Req 28, 35, 39)
    if (weaponType === WeaponType.SPEAR) {
      // SPEAR IDLE: Two-handed or dominant grip angled diagonally, balanced ready stance
      pose.leftArmRot.set(0.3, 0.4, -0.2);
      pose.rightArmRot.set(-0.5, -0.3, 0.4);
      pose.weaponPos.set(0.1, -0.2, 0.4);
      pose.weaponRot.set(Math.PI * 0.35, -0.2, 0.3);
    } else if (weaponType === WeaponType.CATALYST) {
      // MAGIC BOOK IDLE: Floating gently beside hand with calm casting posture
      const floatBook = Math.sin(timeSec * 2.2) * 0.06;
      pose.leftArmRot.set(0.4 + floatBook * 0.5, 0.2, -0.3);
      pose.rightArmRot.set(0.2, -0.2, 0.3);
      pose.weaponPos.set(-0.25, 0.1 + floatBook, 0.5);
      pose.weaponRot.set(Math.PI * 0.2 + floatBook * 0.8, floatBook * 0.5, -0.2);
    } else {
      // SWORD / GREATSWORD IDLE: Dominant grip angled downward, knees slightly bent
      const isGreat = weaponType === WeaponType.GREATSWORD;
      pose.leftArmRot.set(Math.sin(timeSec * 1.4) * 0.04, 0, -0.15);
      pose.rightArmRot.set(isGreat ? -0.4 : -0.25, isGreat ? -0.3 : -0.1, 0.25);
      pose.weaponPos.set(0, -0.05, 0.1);
      pose.weaponRot.set(Math.PI * 0.28, 0, 0.15);
    }
  }

  // --- 2. LOCOMOTION SYSTEM (Req 13, 14, 15, 16, 17, 20) ---
  private evaluateLocomotion(
    pose: RigPose,
    cycle: number,
    isSprint: boolean,
    speed: number,
    weaponType: WeaponType
  ) {
    const strideScale = isSprint ? 1.3 : Math.min(1.1, 0.6 + speed * 0.08);
    const armSwingScale = isSprint ? 1.4 : 0.85;

    // Torso forward lean & rotational twist (Req 16, 17)
    const forwardLean = isSprint ? 0.38 : 0.18;
    pose.bodyRot.x = forwardLean;
    pose.bodyRot.y = Math.cos(cycle) * (isSprint ? 0.18 : 0.12);
    pose.bodyRot.z = Math.sin(cycle) * (isSprint ? 0.08 : 0.04);

    // Root vertical bounce (Req 13, 16)
    pose.rootY = Math.abs(Math.sin(cycle)) * (isSprint ? 0.12 : 0.07);
    pose.bodyPos.y = 1.35 + pose.rootY;

    // Head counter-rotation to look straight ahead
    pose.headRot.x = -forwardLean * 0.75;
    pose.headRot.y = -pose.bodyRot.y * 0.6;

    // Legs: alternating sinusoidal placement with knee flexion
    const leftSwing = Math.sin(cycle);
    const rightSwing = -leftSwing;

    pose.leftLegRot.x = leftSwing * 0.85 * strideScale;
    pose.rightLegRot.x = rightSwing * 0.85 * strideScale;

    // Knee bending during backswing
    pose.leftLegRot.z = (leftSwing > 0 ? 0.04 : -0.02);
    pose.rightLegRot.z = (rightSwing > 0 ? -0.04 : 0.02);

    // Foot contact tracking
    this.leftFootContact = leftSwing < -0.6;
    this.rightFootContact = rightSwing < -0.6;

    // Arms: natural counter-swing
    if (weaponType === WeaponType.CATALYST) {
      // Floating book bobbing while moving
      pose.leftArmRot.set(0.35 + Math.sin(cycle) * 0.15, 0.1, -0.2);
      pose.rightArmRot.set(-Math.sin(cycle) * 0.4 * armSwingScale, 0, 0.15);
      pose.weaponPos.set(-0.2, 0.15 + Math.sin(cycle * 2) * 0.05, 0.4);
      pose.weaponRot.set(Math.PI * 0.25, 0, -0.15);
    } else if (weaponType === WeaponType.SPEAR) {
      // Spear carried balanced with two-handed control
      pose.leftArmRot.set(0.2 - Math.sin(cycle) * 0.3, 0.2, -0.1);
      pose.rightArmRot.set(-0.3 + Math.sin(cycle) * 0.3, -0.2, 0.2);
      pose.weaponPos.set(0.1, -0.1, 0.3);
      pose.weaponRot.set(Math.PI * 0.3, -0.15, 0.2);
    } else {
      // Sword: left arm swings naturally, right arm maintains guard
      pose.leftArmRot.set(-Math.sin(cycle) * 0.75 * armSwingScale, 0, -0.1);
      pose.rightArmRot.set(Math.sin(cycle) * 0.45 * armSwingScale - 0.2, 0, 0.2);
      pose.weaponPos.set(0, 0, 0.1);
      pose.weaponRot.set(Math.PI * 0.25, 0, 0);
    }
  }

  // --- 3. MOVEMENT INITIATION & DECELERATION (Req 18, 19) ---
  private evaluateStartMovement(pose: RigPose, t: number) {
    // Weight shift forward, first step push
    const stepT = Math.sin(t * Math.PI);
    pose.bodyRot.x = stepT * 0.22;
    pose.leftLegRot.x = stepT * 0.5;
    pose.rightLegRot.x = -stepT * 0.25;
    pose.leftArmRot.x = -stepT * 0.4;
    pose.rightArmRot.x = stepT * 0.25;
  }

  private evaluateStopMovement(pose: RigPose, t: number) {
    // Deceleration settling, stride shortening
    const settle = (1.0 - t) * Math.sin(t * Math.PI * 2);
    pose.bodyRot.x = settle * 0.15;
    pose.leftLegRot.x = settle * 0.3;
    pose.rightLegRot.x = -settle * 0.3;
  }

  // --- 4. JUMP & AIR SYSTEM (Req 21, 22, 23, 24) ---
  private evaluateJumpStart(pose: RigPose, t: number) {
    // Crouch anticipation before push-off (Req 21)
    const crouch = Math.sin(t * Math.PI);
    pose.rootY = -crouch * 0.25;
    pose.bodyPos.y = 1.35 + pose.rootY;
    pose.bodyRot.x = crouch * 0.2;
    pose.leftLegRot.x = crouch * 0.45;
    pose.rightLegRot.x = crouch * 0.45;
    pose.leftArmRot.set(-crouch * 0.5, 0, -0.3);
    pose.rightArmRot.set(-crouch * 0.5, 0, 0.3);
  }

  private evaluateJumpAirborne(pose: RigPose, t: number) {
    // Controlled upward suspension with slight limb tuck (Req 22)
    const float = Math.sin(t * Math.PI * 2) * 0.05;
    pose.bodyRot.x = -0.08;
    pose.leftLegRot.set(0.45 + float, 0, -0.1);
    pose.rightLegRot.set(-0.2 + float, 0, 0.1);
    pose.leftArmRot.set(0.5, 0, -0.4);
    pose.rightArmRot.set(0.4, 0, 0.4);
  }

  private evaluateFall(pose: RigPose, t: number) {
    // Unstable downward posture, arms reacting upward (Req 23)
    const wobble = Math.sin(t * Math.PI * 3) * 0.06;
    pose.bodyRot.x = 0.15;
    pose.leftLegRot.set(-0.25 + wobble, 0, -0.15);
    pose.rightLegRot.set(-0.15 - wobble, 0, 0.15);
    pose.leftArmRot.set(1.2 + wobble, 0, -0.6);
    pose.rightArmRot.set(1.1 - wobble, 0, 0.6);
  }

  private evaluateLanding(pose: RigPose, t: number) {
    // Compression absorption scaling with impact (Req 24)
    const compress = Math.sin(t * Math.PI);
    pose.rootY = -compress * 0.32;
    pose.bodyPos.y = 1.35 + pose.rootY;
    pose.bodyRot.x = compress * 0.3;
    pose.leftLegRot.x = compress * 0.6;
    pose.rightLegRot.x = compress * 0.6;
    pose.leftArmRot.set(compress * 0.3, 0, -0.4);
    pose.rightArmRot.set(compress * 0.3, 0, 0.4);
  }

  // --- 5. DODGE EVASION (Req 25, 26) ---
  private evaluateDodge(pose: RigPose, t: number) {
    // Explosive roll/dash: compression -> impulse -> recovery
    if (t < 0.25) {
      // Anticipation compression
      const sub = t / 0.25;
      pose.rootY = -sub * 0.35;
      pose.bodyRot.x = sub * 0.5;
      pose.leftLegRot.x = sub * 0.8;
      pose.rightLegRot.x = sub * 0.8;
    } else if (t < 0.75) {
      // Explosive evasive slide
      const sub = (t - 0.25) / 0.5;
      pose.rootY = -0.35 + Math.sin(sub * Math.PI) * 0.2;
      pose.bodyRot.x = 0.55 - sub * 0.2;
      pose.bodyRot.y = Math.sin(sub * Math.PI) * 0.3;
      pose.leftLegRot.set(0.6, 0, -0.2);
      pose.rightLegRot.set(-0.5, 0, 0.2);
      pose.leftArmRot.set(-0.8, 0, -0.5);
      pose.rightArmRot.set(-0.6, 0, 0.5);
    } else {
      // Recovery to combat stance
      const sub = (t - 0.75) / 0.25;
      pose.rootY = -0.15 * (1 - sub);
      pose.bodyRot.x = 0.25 * (1 - sub);
      pose.leftLegRot.x = 0.2 * (1 - sub);
      pose.rightLegRot.x = 0.2 * (1 - sub);
    }
  }

  // --- 6. COMBAT ATTACK SYSTEM (Req 27-46, 78, 81, 82, 83) ---
  private evaluateAttack1(pose: RigPose, t: number, weaponType: WeaponType) {
    if (weaponType === WeaponType.CATALYST) {
      this.evaluateMagicCast(pose, t, 1);
      return;
    }
    if (weaponType === WeaponType.SPEAR) {
      this.evaluateSpearThrust(pose, t);
      return;
    }

    // SWORD ATTACK 1: Horizontal Slash (Preparation -> Torso twist -> Arm extension -> Impact -> Recovery)
    if (t < 0.25) {
      // Anticipation windup (torso coils left, sword raised back)
      const w = t / 0.25;
      pose.bodyRot.y = -w * 0.45;
      pose.rightArmRot.set(-0.6 * w, -0.4 * w, 0.6 * w);
      pose.weaponRot.set(Math.PI * 0.35, -0.4 * w, 0.2);
      pose.slashArcOpacity = 0;
    } else if (t < 0.6) {
      // Action & Impact frame (Req 83)
      const a = (t - 0.25) / 0.35;
      pose.bodyRot.y = -0.45 + a * 1.0; // Torso rotates powerfully through swing
      pose.rightArmRot.set(0.5 - a * 0.8, a * 0.6, 0.3 - a * 0.6);
      pose.weaponRot.set(Math.PI * 0.25, a * 1.5, -0.4);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 0.95;
      pose.slashArcRot.set(-Math.PI * 0.45, 0, a * Math.PI * 0.6);
    } else {
      // Follow-through & Recovery to stance (Req 2)
      const r = (t - 0.6) / 0.4;
      pose.bodyRot.y = 0.55 * (1 - r);
      pose.rightArmRot.set(-0.25, 0, 0.2);
      pose.weaponRot.set(Math.PI * 0.25, 0, 0);
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateAttack2(pose: RigPose, t: number, weaponType: WeaponType) {
    if (weaponType === WeaponType.CATALYST) {
      this.evaluateMagicCast(pose, t, 2);
      return;
    }
    if (weaponType === WeaponType.SPEAR) {
      this.evaluateSpearSweep(pose, t);
      return;
    }

    // SWORD ATTACK 2: Reverse Diagonal Slash (Distinct body mechanics, not mirrored)
    if (t < 0.25) {
      const w = t / 0.25;
      pose.bodyRot.y = w * 0.4;
      pose.rightArmRot.set(0.4 * w, 0.5 * w, 0.3);
      pose.weaponRot.set(Math.PI * 0.2, 0.5 * w, -0.3);
      pose.slashArcOpacity = 0;
    } else if (t < 0.62) {
      const a = (t - 0.25) / 0.37;
      pose.bodyRot.y = 0.4 - a * 0.95;
      pose.rightArmRot.set(-0.4 + a * 0.6, -a * 0.8, -0.2 + a * 0.5);
      pose.weaponRot.set(Math.PI * 0.4, -a * 1.4, 0.3);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 0.95;
      pose.slashArcRot.set(-Math.PI * 0.55, 0, -a * Math.PI * 0.7);
    } else {
      const r = (t - 0.62) / 0.38;
      pose.bodyRot.y = -0.55 * (1 - r);
      pose.rightArmRot.set(-0.25, 0, 0.2);
      pose.weaponRot.set(Math.PI * 0.25, 0, 0);
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateAttack3(pose: RigPose, t: number, weaponType: WeaponType) {
    if (weaponType === WeaponType.CATALYST) {
      this.evaluateMagicCast(pose, t, 3);
      return;
    }
    if (weaponType === WeaponType.SPEAR) {
      this.evaluateSpearReverseThrust(pose, t);
      return;
    }

    // SWORD ATTACK 3: Diagonal Upward Slash (Finisher with high impact & step)
    if (t < 0.28) {
      const w = t / 0.28;
      pose.rootY = -w * 0.15;
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = w * 0.25;
      pose.bodyRot.y = -w * 0.5;
      pose.rightArmRot.set(-0.8 * w, -0.2, 0.8 * w);
      pose.weaponRot.set(Math.PI * 0.5, -0.3, 0.5);
    } else if (t < 0.65) {
      const a = (t - 0.28) / 0.37;
      pose.rootY = -0.15 + a * 0.22; // Step up with the upward cut
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = 0.25 - a * 0.45;
      pose.bodyRot.y = -0.5 + a * 1.1;
      pose.rightArmRot.set(1.2 * a, 0.4, -0.4 * a);
      pose.weaponRot.set(-Math.PI * 0.2, a * 1.2, 0.2);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 1.0;
      pose.slashArcRot.set(-Math.PI * 0.3, 0.2, a * Math.PI * 0.8);
    } else {
      const r = (t - 0.65) / 0.35;
      pose.bodyRot.x = -0.2 * (1 - r);
      pose.bodyRot.y = 0.6 * (1 - r);
      pose.rightArmRot.set(-0.25, 0, 0.2);
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateHeavyAttack(pose: RigPose, t: number, weaponType: WeaponType) {
    // HEAVY ATTACK: Wide preparation, weapon raised high, powerful downward strike (Req 32)
    if (t < 0.35) {
      // Wide preparation / anticipation
      const w = t / 0.35;
      pose.rootY = -w * 0.18;
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = -w * 0.25;
      pose.leftArmRot.set(1.5 * w, 0.2, -0.2);
      pose.rightArmRot.set(1.6 * w, -0.2, 0.2);
      pose.weaponPos.set(0, 0.4 * w, 0.2);
      pose.weaponRot.set(-Math.PI * 0.6 * w, 0, 0);
    } else if (t < 0.68) {
      // Devastating downward slam with strong impact
      const a = (t - 0.35) / 0.33;
      pose.rootY = -0.18 - a * 0.15;
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = -0.25 + a * 0.7; // Heavy torso flexion forward
      pose.leftArmRot.set(1.5 - a * 2.2, 0, -0.2);
      pose.rightArmRot.set(1.6 - a * 2.3, 0, 0.2);
      pose.weaponPos.set(0, -0.2, 0.4);
      pose.weaponRot.set(Math.PI * 0.4, 0, 0);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 1.0;
      pose.slashArcRot.set(-Math.PI * 0.5, 0, 0);
    } else {
      // Deep recovery: body visibly reacts to force
      const r = (t - 0.68) / 0.32;
      pose.bodyRot.x = 0.45 * (1 - r);
      pose.rightArmRot.set(-0.25, 0, 0.2);
      pose.leftArmRot.set(0, 0, -0.15);
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateSkill(pose: RigPose, t: number, weaponType: WeaponType) {
    // SPINNING WHIRLWIND / ELEMENTAL BURST (Req 44)
    const spin = t * Math.PI * 4; // 2 full revolutions
    pose.bodyRot.y = spin;
    pose.rightArmRot.set(0, 0, 1.4);
    pose.leftArmRot.set(0, 0, -1.4);
    pose.weaponRot.set(0, 0, Math.PI * 0.5);
    pose.slashArcOpacity = Math.sin(t * Math.PI) * 0.95;
    pose.slashArcRot.set(-Math.PI * 0.5, 0, spin);
  }

  private evaluateUltimate(pose: RigPose, t: number, weaponType: WeaponType) {
    // ULTIMATE: Cinematic anticipation, high leap, ground rupture shockwave (Req 46)
    if (t < 0.4) {
      // Charging burst pose
      const c = t / 0.4;
      pose.rootY = Math.sin(c * Math.PI) * 0.8;
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = -c * 0.3;
      pose.leftArmRot.set(1.8 * c, 0, -0.6);
      pose.rightArmRot.set(1.8 * c, 0, 0.6);
      pose.weaponRot.set(-Math.PI * 0.7, 0, 0);
    } else if (t < 0.7) {
      // Slam down impact
      const s = (t - 0.4) / 0.3;
      pose.rootY = -0.35 * s;
      pose.bodyPos.y = 1.35 + pose.rootY;
      pose.bodyRot.x = 0.55;
      pose.leftArmRot.set(-0.8, 0, -0.4);
      pose.rightArmRot.set(-0.8, 0, 0.4);
      pose.slashArcOpacity = 1.0;
      pose.slashArcRot.set(-Math.PI * 0.5, 0, 0);
    } else {
      // Tremendous recovery
      const r = (t - 0.7) / 0.3;
      pose.bodyRot.x = 0.55 * (1 - r);
      pose.slashArcOpacity = 0;
    }
  }

  // --- 7. SPEAR SYSTEM (Req 34-37) ---
  private evaluateSpearThrust(pose: RigPose, t: number) {
    if (t < 0.25) {
      // Windup: body compresses, rear leg pushes
      const w = t / 0.25;
      pose.bodyRot.y = -w * 0.35;
      pose.leftArmRot.set(0.6 * w, 0.3, -0.2);
      pose.rightArmRot.set(-0.8 * w, -0.2, 0.3);
      pose.weaponPos.set(0, -0.2, -0.2 * w);
    } else if (t < 0.6) {
      // SPEAR THRUST: Arms extend, spear accelerates forward, body drives forward (Req 36)
      const a = (t - 0.25) / 0.35;
      pose.bodyRot.y = -0.35 + a * 0.7;
      pose.leftArmRot.set(0.6 - a * 0.8, 0, 0);
      pose.rightArmRot.set(-0.8 + a * 1.8, 0, 0.1);
      pose.weaponPos.set(0, 0, 0.6 * a); // Spear visibly travels forward
      pose.weaponRot.set(Math.PI * 0.5, 0, 0);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 0.8;
    } else {
      const r = (t - 0.6) / 0.4;
      pose.weaponPos.set(0, -0.1, 0.3 * (1 - r));
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateSpearSweep(pose: RigPose, t: number) {
    // SPEAR SWEEP: Wide horizontal 180° arc (Req 37)
    if (t < 0.3) {
      const w = t / 0.3;
      pose.bodyRot.y = -w * 0.7;
      pose.rightArmRot.set(0.2, -0.6 * w, 0.4);
    } else if (t < 0.68) {
      const a = (t - 0.3) / 0.38;
      pose.bodyRot.y = -0.7 + a * 1.5;
      pose.rightArmRot.set(0.2, a * 1.2, 0.3);
      pose.weaponRot.set(Math.PI * 0.5, a * Math.PI, 0);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 0.95;
      pose.slashArcRot.set(-Math.PI * 0.5, 0, a * Math.PI);
    } else {
      pose.slashArcOpacity = 0;
    }
  }

  private evaluateSpearReverseThrust(pose: RigPose, t: number) {
    const a = Math.sin(t * Math.PI);
    pose.bodyRot.y = a * 0.6;
    pose.rightArmRot.set(a * 1.2, 0, 0.2);
    pose.weaponPos.set(0, 0, a * 0.7);
    pose.slashArcOpacity = a * 0.8;
  }

  // --- 8. MAGIC BOOK / CATALYST SYSTEM (Req 38-42) ---
  private evaluateMagicCast(pose: RigPose, t: number, variant: number) {
    // Raising book, gathering magical energy, magic circle release (Req 40, 41)
    if (t < 0.35) {
      // Anticipation: raises book, pages flutter
      const w = t / 0.35;
      pose.leftArmRot.set(0.4 + w * 0.8, 0.2, -0.3);
      pose.rightArmRot.set(-0.2, 0, 0.4 * w);
      pose.weaponPos.set(-0.35, 0.3 * w + 0.2, 0.5 + 0.2 * w);
      pose.weaponRot.set(Math.PI * 0.35, -w * 0.5, 0);
    } else if (t < 0.65) {
      // Cast release: hand thrusts forward, spell projects
      const a = (t - 0.35) / 0.3;
      pose.leftArmRot.set(1.2, 0, -0.3);
      pose.rightArmRot.set(1.1 * a, 0, 0.2);
      pose.bodyRot.x = -0.15;
      pose.weaponPos.set(-0.35, 0.5, 0.7);
      pose.slashArcOpacity = Math.sin(a * Math.PI) * 0.9;
      pose.slashArcRot.set(0, 0, a * Math.PI);
    } else {
      // Recovery
      const r = (t - 0.65) / 0.35;
      pose.leftArmRot.set(0.4 + (1 - r) * 0.8, 0.2, -0.3);
      pose.slashArcOpacity = 0;
    }
  }

  // --- 9. HIT, STAGGER & DEATH REACTIONS (Req 47-50) ---
  private evaluateHitReaction(pose: RigPose, t: number, hitVector?: HitReactionVector) {
    const dir = hitVector?.direction ?? "FRONT";
    const recoil = Math.sin(t * Math.PI) * (hitVector?.intensity ?? 1.0);

    // Directional recoil (Req 48)
    if (dir === "FRONT") {
      pose.bodyRot.x = -recoil * 0.35;
      pose.headRot.x = -recoil * 0.5;
      pose.bodyPos.z = -recoil * 0.2;
    } else if (dir === "BACK") {
      pose.bodyRot.x = recoil * 0.35;
      pose.headRot.x = recoil * 0.5;
      pose.bodyPos.z = recoil * 0.2;
    } else if (dir === "LEFT") {
      pose.bodyRot.z = -recoil * 0.35;
      pose.headRot.z = -recoil * 0.5;
    } else {
      pose.bodyRot.z = recoil * 0.35;
      pose.headRot.z = recoil * 0.5;
    }

    pose.leftArmRot.set(recoil * 0.4, 0, -recoil * 0.5);
    pose.rightArmRot.set(recoil * 0.4, 0, recoil * 0.5);
  }

  private evaluateStagger(pose: RigPose, t: number) {
    // Loss of balance, stumbling backward (Req 49)
    const stumble = Math.sin(t * Math.PI);
    pose.bodyRot.x = -stumble * 0.45;
    pose.bodyRot.y = Math.sin(t * Math.PI * 2) * 0.2;
    pose.leftArmRot.set(stumble * 0.8, 0, -stumble * 0.6);
    pose.rightArmRot.set(stumble * 0.7, 0, stumble * 0.6);
    pose.leftLegRot.x = -stumble * 0.4;
    pose.rightLegRot.x = stumble * 0.3;
  }

  private evaluateDeath(pose: RigPose, t: number) {
    // Humanoid collapse to ground (Req 50)
    const fallT = Math.min(1.0, t * 1.5);
    pose.rootY = -fallT * 1.35;
    pose.bodyPos.y = 1.35 + pose.rootY;
    pose.bodyRot.x = fallT * (Math.PI * 0.48);
    pose.leftArmRot.set(fallT * 0.8, 0, -fallT * 0.5);
    pose.rightArmRot.set(fallT * 0.8, 0, fallT * 0.5);
    pose.leftLegRot.set(fallT * 0.2, 0, -0.2);
    pose.rightLegRot.set(fallT * 0.2, 0, 0.2);
  }

  // --- 10. WEAPON EQUIP / UNEQUIP (Req 68-70) ---
  private evaluateEquip(pose: RigPose, t: number, weaponType: WeaponType) {
    // Hand retrieves weapon from back/hip socket, draws to grip
    const draw = Math.sin(t * Math.PI);
    pose.rightArmRot.set(draw * 1.2, 0, draw * 0.4);
    pose.weaponRot.set(draw * Math.PI * 0.5, 0, 0);
  }

  private evaluateUnequip(pose: RigPose, t: number, weaponType: WeaponType) {
    const stow = Math.sin(t * Math.PI);
    pose.rightArmRot.set(stow * 1.0, 0, stow * 0.3);
  }

  // --- 11. EMOTES ---
  private evaluateEmoteWave(pose: RigPose, t: number) {
    pose.rightArmRot.set(-0.4, 0, 1.8 + Math.sin(t * Math.PI * 8) * 0.4);
    pose.headRot.y = Math.sin(t * Math.PI * 2) * 0.15;
  }

  private evaluateEmoteSit(pose: RigPose) {
    pose.rootY = -0.55;
    pose.bodyPos.y = 1.35 + pose.rootY;
    pose.leftLegRot.set(Math.PI * 0.45, 0, 0);
    pose.rightLegRot.set(Math.PI * 0.45, 0, 0);
    pose.leftArmRot.set(0.3, 0, 0);
    pose.rightArmRot.set(0.3, 0, 0);
  }

  private evaluateEmoteDance(pose: RigPose, t: number) {
    const cycle = t * Math.PI * 6;
    pose.bodyRot.y = Math.sin(cycle) * 0.6;
    pose.leftArmRot.set(0, 0, -1.2 + Math.sin(cycle * 1.2) * 0.4);
    pose.rightArmRot.set(0, 0, 1.2 - Math.sin(cycle * 1.2) * 0.4);
    pose.rootY = Math.abs(Math.sin(cycle * 1.2)) * 0.18;
    pose.bodyPos.y = 1.35 + pose.rootY;
  }

  private evaluateEmoteVictory(pose: RigPose, t: number) {
    pose.leftArmRot.set(0, 0, -2.2);
    pose.rightArmRot.set(0, 0, 2.2);
    pose.bodyScale.set(1.05, 1.05, 1.05);
    pose.headRot.x = -0.2;
  }

  private evaluateEmoteBow(pose: RigPose, t: number) {
    const bow = Math.sin(t * Math.PI);
    pose.bodyRot.x = bow * 0.55;
    pose.headRot.x = bow * 0.35;
    pose.leftArmRot.set(bow * 0.2, 0, -0.1);
    pose.rightArmRot.set(bow * 0.2, 0, 0.1);
  }

  public getFootContacts(): { left: boolean; right: boolean } {
    return { left: this.leftFootContact, right: this.rightFootContact };
  }
}
