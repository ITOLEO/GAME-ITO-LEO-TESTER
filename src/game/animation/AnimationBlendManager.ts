/**
 * AnimationBlendManager - Multi-layer blending engine.
 * Computes layered bone poses and crossfades between animations.
 */

import * as THREE from "three";
import { AnimationLayerType } from "./animationTypes";

export interface RigPose {
  rootY: number;
  bodyPos: THREE.Vector3;
  bodyRot: THREE.Euler;
  bodyScale: THREE.Vector3;

  headRot: THREE.Euler;
  leftEyeScaleY: number;
  rightEyeScaleY: number;

  leftArmRot: THREE.Euler;
  rightArmRot: THREE.Euler;
  leftLegRot: THREE.Euler;
  rightLegRot: THREE.Euler;

  weaponPos: THREE.Vector3;
  weaponRot: THREE.Euler;
  slashArcOpacity: number;
  slashArcRot: THREE.Euler;
}

export function createDefaultPose(): RigPose {
  return {
    rootY: 0,
    bodyPos: new THREE.Vector3(0, 1.35, 0),
    bodyRot: new THREE.Euler(0, 0, 0),
    bodyScale: new THREE.Vector3(1, 1, 1),
    headRot: new THREE.Euler(0, 0, 0),
    leftEyeScaleY: 1,
    rightEyeScaleY: 1,
    leftArmRot: new THREE.Euler(0, 0, 0),
    rightArmRot: new THREE.Euler(0, 0, 0),
    leftLegRot: new THREE.Euler(0, 0, 0),
    rightLegRot: new THREE.Euler(0, 0, 0),
    weaponPos: new THREE.Vector3(0, 0, 0.1),
    weaponRot: new THREE.Euler(Math.PI / 4, 0, 0),
    slashArcOpacity: 0,
    slashArcRot: new THREE.Euler(-Math.PI / 2, 0, 0),
  };
}

export class AnimationBlendManager {
  private layerWeights: Map<AnimationLayerType, number> = new Map([
    ["BASE", 1.0],
    ["LOWER_BODY", 1.0],
    ["UPPER_BODY", 1.0],
    ["HEAD", 1.0],
    ["SECONDARY", 1.0],
  ]);

  public setLayerWeight(layer: AnimationLayerType, weight: number): void {
    this.layerWeights.set(layer, Math.max(0, Math.min(1, weight)));
  }

  public getLayerWeight(layer: AnimationLayerType): number {
    return this.layerWeights.get(layer) ?? 1.0;
  }

  /**
   * Spherically interpolates / blends two rig poses based on blend weight (0..1)
   */
  public blendPoses(poseA: RigPose, poseB: RigPose, weight: number): RigPose {
    const w = Math.max(0, Math.min(1, weight));
    const invW = 1 - w;

    const out = createDefaultPose();
    out.rootY = poseA.rootY * invW + poseB.rootY * w;

    out.bodyPos.copy(poseA.bodyPos).lerp(poseB.bodyPos, w);
    this.lerpEuler(out.bodyRot, poseA.bodyRot, poseB.bodyRot, w);
    out.bodyScale.copy(poseA.bodyScale).lerp(poseB.bodyScale, w);

    this.lerpEuler(out.headRot, poseA.headRot, poseB.headRot, w);
    out.leftEyeScaleY = poseA.leftEyeScaleY * invW + poseB.leftEyeScaleY * w;
    out.rightEyeScaleY = poseA.rightEyeScaleY * invW + poseB.rightEyeScaleY * w;

    this.lerpEuler(out.leftArmRot, poseA.leftArmRot, poseB.leftArmRot, w);
    this.lerpEuler(out.rightArmRot, poseA.rightArmRot, poseB.rightArmRot, w);
    this.lerpEuler(out.leftLegRot, poseA.leftLegRot, poseB.leftLegRot, w);
    this.lerpEuler(out.rightLegRot, poseA.rightLegRot, poseB.rightLegRot, w);

    out.weaponPos.copy(poseA.weaponPos).lerp(poseB.weaponPos, w);
    this.lerpEuler(out.weaponRot, poseA.weaponRot, poseB.weaponRot, w);
    out.slashArcOpacity = poseA.slashArcOpacity * invW + poseB.slashArcOpacity * w;
    this.lerpEuler(out.slashArcRot, poseA.slashArcRot, poseB.slashArcRot, w);

    return out;
  }

  /**
   * Layered blend: combines lower body of locomotion pose with upper body of combat pose.
   */
  public layerCombatPose(locomotionPose: RigPose, combatPose: RigPose, upperBodyWeight = 1.0): RigPose {
    const result = this.blendPoses(locomotionPose, locomotionPose, 0); // clone

    // Retain lower body and root bounce from locomotion
    result.leftLegRot.copy(locomotionPose.leftLegRot);
    result.rightLegRot.copy(locomotionPose.rightLegRot);
    result.rootY = locomotionPose.rootY;

    // Apply upper body from combat pose
    const w = Math.max(0, Math.min(1, upperBodyWeight));
    this.lerpEuler(result.bodyRot, locomotionPose.bodyRot, combatPose.bodyRot, w);
    this.lerpEuler(result.leftArmRot, locomotionPose.leftArmRot, combatPose.leftArmRot, w);
    this.lerpEuler(result.rightArmRot, locomotionPose.rightArmRot, combatPose.rightArmRot, w);
    result.weaponPos.copy(combatPose.weaponPos);
    result.weaponRot.copy(combatPose.weaponRot);
    result.slashArcOpacity = combatPose.slashArcOpacity;
    result.slashArcRot.copy(combatPose.slashArcRot);

    return result;
  }

  private lerpEuler(target: THREE.Euler, a: THREE.Euler, b: THREE.Euler, t: number): void {
    const qa = new THREE.Quaternion().setFromEuler(a);
    const qb = new THREE.Quaternion().setFromEuler(b);
    qa.slerp(qb, t);
    target.setFromQuaternion(qa);
  }
}
