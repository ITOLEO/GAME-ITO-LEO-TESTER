/**
 * NPCAnimationController - Living NPC behavior engine.
 * Generates role-specific idle gestures, conversation head-tracking,
 * and smooth turning to face the player upon interaction.
 */

import * as THREE from "three";
import { NPCAnimationState } from "./animationTypes";

export class NPCAnimationController {
  private currentState: NPCAnimationState = "NPC_IDLE";
  private animTimer = 0;
  private currentYaw = 0;
  private targetYaw = 0;
  private isInteractingWithPlayer = false;

  constructor(
    public readonly id: string,
    public readonly role: string
  ) {
    this.animTimer = Math.random() * 10;
  }

  public setInteracting(interacting: boolean, playerPos?: THREE.Vector3, npcPos?: THREE.Vector3) {
    this.isInteractingWithPlayer = interacting;
    if (interacting && playerPos && npcPos) {
      this.currentState = "NPC_TALK";
      const dx = playerPos.x - npcPos.x;
      const dz = playerPos.z - npcPos.z;
      this.targetYaw = Math.atan2(dx, dz);
    } else {
      this.currentState = "NPC_IDLE";
    }
  }

  public update(delta: number, npcMesh: THREE.Group, playerPos?: THREE.Vector3) {
    this.animTimer += delta;
    const t = this.animTimer;

    // 1. Smooth rotation toward player when in dialogue (Req 66, 67)
    if (this.isInteractingWithPlayer) {
      let diff = this.targetYaw - this.currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentYaw += diff * Math.min(1.0, delta * 6.0);
      npcMesh.rotation.y = this.currentYaw;
    }

    // 2. Role-specific living idle behaviors (Req 64, 65)
    const breath = Math.sin(t * 1.6) * 0.03;
    npcMesh.scale.set(1.0, 1.0 + breath, 1.0);

    if (this.id === "thorne") {
      // Elder Thorne: Pondering, stroking beard, nodding sagely
      const nod = Math.sin(t * 0.8) * 0.05;
      npcMesh.rotation.x = 0.04 + nod;
      if (this.isInteractingWithPlayer) {
        npcMesh.rotation.x = Math.sin(t * 3.0) * 0.06;
      }
    } else if (this.id === "seraphina") {
      // Seraphina Alchemist: Checking vials, gentle sway
      npcMesh.rotation.z = Math.sin(t * 1.2) * 0.04;
      npcMesh.position.y += Math.sin(t * 2.0) * 0.005;
    } else if (this.id === "gerald") {
      // Gerald the Smith: Hammering rhythm / inspecting steel
      const hammer = Math.sin(t * 2.8);
      if (hammer > 0.4) {
        npcMesh.rotation.x = 0.15; // Striking down on anvil
      } else {
        npcMesh.rotation.x = -0.05; // Lifting arm
      }
    } else if (this.id === "sylas") {
      // Sylas Explorer: Scanning horizon, turning head left & right
      const scan = Math.sin(t * 0.6) * 0.25;
      if (!this.isInteractingWithPlayer) {
        npcMesh.rotation.y = scan;
      }
    }
  }
}
