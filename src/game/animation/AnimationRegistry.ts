/**
 * AnimationRegistry - Central management for all animation controllers,
 * distance-based Level-of-Detail (LOD) skeletal throttling, and entity lifecycle.
 */

import * as THREE from "three";
import { AnimationController } from "./AnimationController";
import { MonsterAnimationController } from "./MonsterAnimationController";
import { BossAnimationController } from "./BossAnimationController";
import { NPCAnimationController } from "./NPCAnimationController";

export class AnimationRegistry {
  private playerController: AnimationController;
  private monsterControllers: Map<string, MonsterAnimationController> = new Map();
  private bossController: BossAnimationController;
  private npcControllers: Map<string, NPCAnimationController> = new Map();

  private frameCounter = 0;

  constructor() {
    this.playerController = new AnimationController();
    this.bossController = new BossAnimationController();
  }

  public getPlayerController(): AnimationController {
    return this.playerController;
  }

  public getBossController(): BossAnimationController {
    return this.bossController;
  }

  public registerMonster(id: string, type: "aetherling" | "vanguard"): MonsterAnimationController {
    let controller = this.monsterControllers.get(id);
    if (!controller) {
      controller = new MonsterAnimationController(type);
      this.monsterControllers.set(id, controller);
    }
    return controller;
  }

  public registerNPC(id: string, role: string): NPCAnimationController {
    let controller = this.npcControllers.get(id);
    if (!controller) {
      controller = new NPCAnimationController(id, role);
      this.npcControllers.set(id, controller);
    }
    return controller;
  }

  public getMonster(id: string): MonsterAnimationController | undefined {
    return this.monsterControllers.get(id);
  }

  public getNPC(id: string): NPCAnimationController | undefined {
    return this.npcControllers.get(id);
  }

  public removeEntity(id: string): void {
    this.monsterControllers.delete(id);
    this.npcControllers.delete(id);
  }

  public shouldUpdateEntity(distToPlayer: number, isBoss = false): boolean {
    if (isBoss) return true; // Bosses always receive full frame update (Req 96)
    if (distToPlayer < 25) return true; // Near: full 60fps update
    if (distToPlayer < 55) return this.frameCounter % 2 === 0; // Medium: update every 2nd frame
    return this.frameCounter % 4 === 0; // Far: throttled (Req 95)
  }

  public tickFrame(): void {
    this.frameCounter++;
  }

  public clear(): void {
    this.monsterControllers.clear();
    this.npcControllers.clear();
  }
}
