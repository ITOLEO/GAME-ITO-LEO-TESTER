/**
 * SecondaryMotionSystem - Physics-based damped spring inertia for hair spikes,
 * flowing cape/scarf, accessories, and clothing follow-through.
 * Simulates weight, momentum, drag, and settling response.
 */

import * as THREE from "three";

export interface SpringChainNode {
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  damping: number; // 0.7 - 0.88
  stiffness: number; // 120 - 240
  drag: number;
}

export class SecondaryMotionSystem {
  private capeSpring: SpringChainNode = {
    currentPos: new THREE.Vector3(0, 0, 0),
    targetPos: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    damping: 0.82,
    stiffness: 160,
    drag: 0.88,
  };

  private hairSprings: SpringChainNode[] = [];
  private previousCharacterPos = new THREE.Vector3();
  private characterVelocity = new THREE.Vector3();
  private characterAngularVelocity = 0;
  private previousCharacterRot = 0;

  constructor(hairCount = 7) {
    for (let i = 0; i < hairCount; i++) {
      this.hairSprings.push({
        currentPos: new THREE.Vector3(0, 0, 0),
        targetPos: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        damping: 0.78 + (i % 3) * 0.03,
        stiffness: 210 - (i % 3) * 20,
        drag: 0.85,
      });
    }
  }

  /**
   * Updates spring nodes based on character linear and angular momentum.
   */
  public update(
    delta: number,
    charPos: THREE.Vector3,
    charRotY: number,
    isSprinting: boolean,
    isAirborne: boolean
  ): void {
    const dt = Math.min(delta, 0.05);

    // Calculate real-time motion velocity
    this.characterVelocity.copy(charPos).sub(this.previousCharacterPos).divideScalar(Math.max(dt, 0.001));
    this.previousCharacterPos.copy(charPos);

    // Angular velocity
    let rotDiff = charRotY - this.previousCharacterRot;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.characterAngularVelocity = rotDiff / Math.max(dt, 0.001);
    this.previousCharacterRot = charRotY;

    // Local forward & right vectors
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), charRotY);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), charRotY);

    const fwdSpeed = this.characterVelocity.dot(forward);
    const sideSpeed = this.characterVelocity.dot(right);
    const upSpeed = this.characterVelocity.y;

    // 1. Cape Target Inertia (Lifts back during forward run, sways during turns)
    const capeLift = Math.min(1.2, fwdSpeed * (isSprinting ? 0.09 : 0.06));
    const capeSide = -sideSpeed * 0.05 - this.characterAngularVelocity * 0.12;
    const capeVertical = -upSpeed * 0.04;

    this.capeSpring.targetPos.set(
      capeSide,
      0.2 + capeLift + (isAirborne ? 0.3 : 0),
      capeVertical
    );

    this.stepSpring(this.capeSpring, dt);

    // 2. Hair Spikes Inertia
    for (let i = 0; i < this.hairSprings.length; i++) {
      const spring = this.hairSprings[i];
      const stagger = (i - 3) * 0.08;
      const targetX = -sideSpeed * 0.03 - this.characterAngularVelocity * 0.08 + stagger;
      const targetY = (fwdSpeed > 0.5 ? -0.1 : 0) - upSpeed * 0.03;
      const targetZ = -fwdSpeed * 0.035;

      spring.targetPos.set(targetX, targetY, targetZ);
      this.stepSpring(spring, dt);
    }
  }

  private stepSpring(node: SpringChainNode, dt: number): void {
    // F = -k * (x - target) - c * v
    const displacement = new THREE.Vector3().copy(node.currentPos).sub(node.targetPos);
    const springForce = displacement.multiplyScalar(-node.stiffness);
    const dampingForce = new THREE.Vector3().copy(node.velocity).multiplyScalar(node.damping * 20);

    const acceleration = springForce.sub(dampingForce);
    node.velocity.addScaledVector(acceleration, dt);
    node.velocity.multiplyScalar(node.drag);
    node.currentPos.addScaledVector(node.velocity, dt);
  }

  public getCapeOffset(): { rotX: number; rotZ: number } {
    return {
      rotX: this.capeSpring.currentPos.y,
      rotZ: this.capeSpring.currentPos.x,
    };
  }

  public getHairOffset(index: number): { rotX: number; rotY: number; rotZ: number } {
    if (index >= 0 && index < this.hairSprings.length) {
      const s = this.hairSprings[index];
      return {
        rotX: s.currentPos.z,
        rotY: s.currentPos.x * 0.5,
        rotZ: s.currentPos.x,
      };
    }
    return { rotX: 0, rotY: 0, rotZ: 0 };
  }
}
