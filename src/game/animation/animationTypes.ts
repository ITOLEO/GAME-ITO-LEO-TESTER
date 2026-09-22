/**
 * Aetheria: Resonant Horizon - Master Animation System Types
 * Exclusively focused on animation quality, state machines, blending, and polish.
 */

import * as THREE from "three";
import { WeaponType } from "../../types/game";

export type AnimationState =
  | "IDLE"
  | "WALK"
  | "RUN"
  | "SPRINT"
  | "START_MOVEMENT"
  | "STOP_MOVEMENT"
  | "JUMP_START"
  | "JUMP"
  | "FALL"
  | "LAND"
  | "DODGE"
  | "ATTACK_01"
  | "ATTACK_02"
  | "ATTACK_03"
  | "HEAVY_ATTACK"
  | "SKILL"
  | "ULTIMATE"
  | "HIT"
  | "STAGGER"
  | "DEATH"
  | "EQUIP"
  | "UNEQUIP"
  | "EMOTE_WAVE"
  | "EMOTE_SIT"
  | "EMOTE_DANCE"
  | "EMOTE_VICTORY"
  | "EMOTE_BOW";

export type BossAnimationState =
  | "BOSS_IDLE"
  | "BOSS_CHASE"
  | "BOSS_ATTACK_CLAW"
  | "BOSS_GROUND_SLAM"
  | "BOSS_ROAR"
  | "BOSS_PHASE_TRANSITION"
  | "BOSS_ENRAGED_IDLE"
  | "BOSS_ENRAGED_ATTACK"
  | "BOSS_STAGGER"
  | "BOSS_DEATH";

export type MonsterAnimationState =
  | "MONSTER_IDLE"
  | "MONSTER_SNIFF"
  | "MONSTER_ALERT"
  | "MONSTER_WALK"
  | "MONSTER_RUN"
  | "MONSTER_ATTACK_BITE"
  | "MONSTER_ATTACK_CLAW"
  | "MONSTER_ATTACK_POUNCE"
  | "MONSTER_HIT"
  | "MONSTER_STAGGER"
  | "MONSTER_DEATH";

export type NPCAnimationState =
  | "NPC_IDLE"
  | "NPC_SPECIAL_IDLE" // Merchant sorting, Blacksmith hammering, etc.
  | "NPC_TALK"
  | "NPC_LOOK_AROUND"
  | "NPC_TURN_TO_PLAYER"
  | "NPC_WALK";

export type AnimationLayerType =
  | "BASE"       // Full body base movement (Idle, Walk, Run, Sprint, Fall)
  | "LOWER_BODY" // Legs & hips for locomotion when upper body is busy
  | "UPPER_BODY" // Torso, arms, weapon for attacks & casting while moving
  | "HEAD"       // Head tracking, looking around, facial expressions & blinking
  | "SECONDARY"; // Cloth, hair, ribbons, accessories spring physics

export enum AnimationPriority {
  IDLE = 10,
  MOVEMENT = 20,
  HIT = 30,
  STAGGER = 40,
  DODGE = 50,
  ATTACK = 60,
  HEAVY_ATTACK = 70,
  SKILL = 80,
  ULTIMATE = 90,
  CUTSCENE = 95,
  DEATH = 100,
}

export type AnimationEventName =
  | "OnStart"
  | "OnAnticipation"
  | "OnHit"
  | "OnImpact"
  | "OnRecovery"
  | "OnComplete"
  | "OnFootstep"
  | "OnVFX"
  | "OnSound"
  | "OnProjectileSpawn";

export interface AnimationEventPayload {
  eventName: AnimationEventName;
  state: AnimationState | BossAnimationState | MonsterAnimationState | NPCAnimationState;
  normalizedTime: number; // 0.0 to 1.0
  surface?: string;
  intensity?: number;
  customData?: any;
}

export type AnimationEventListener = (payload: AnimationEventPayload) => void;

export interface AnimationTransitionConfig {
  from: AnimationState | "*";
  to: AnimationState;
  duration: number; // Duration in seconds for blending
  canInterrupt: boolean;
  priority: AnimationPriority;
  cancelWindowStart?: number; // 0.0 to 1.0 normalized time where cancel is allowed
}

export interface HitReactionVector {
  direction: "FRONT" | "BACK" | "LEFT" | "RIGHT";
  intensity: number; // 0.5 = light, 1.0 = normal, 1.5 = heavy/critical
  attackerPosition?: THREE.Vector3;
}

export interface AnimationDebugData {
  currentState: string;
  previousState: string;
  normalizedTime: number;
  blendWeight: number;
  playbackSpeed: number;
  currentEvent: string;
  isGrounded: boolean;
  characterVelocity: [number, number, number];
  planarSpeed: number;
  weaponType: WeaponType | string;
  activeLayer: string;
  testModeActive: boolean;
  testState: AnimationState;
  secondaryPhysicsActive: boolean;
}
