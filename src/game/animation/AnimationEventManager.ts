/**
 * AnimationEventManager - Synchronizes combat events, footstep contacts,
 * VFX emissions, and projectile spawns with precise animation frames.
 */

import { AnimationEventName, AnimationEventPayload, AnimationEventListener } from "./animationTypes";

export class AnimationEventManager {
  private listeners: Map<AnimationEventName, Set<AnimationEventListener>> = new Map();
  private triggeredFrames: Set<string> = new Set();

  constructor() {
    const events: AnimationEventName[] = [
      "OnStart",
      "OnAnticipation",
      "OnHit",
      "OnImpact",
      "OnRecovery",
      "OnComplete",
      "OnFootstep",
      "OnVFX",
      "OnSound",
      "OnProjectileSpawn",
    ];
    events.forEach((ev) => this.listeners.set(ev, new Set()));
  }

  public subscribe(event: AnimationEventName, listener: AnimationEventListener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set?.delete(listener);
  }

  public emit(payload: AnimationEventPayload): void {
    const set = this.listeners.get(payload.eventName);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error in animation event listener [${payload.eventName}]:`, err);
        }
      });
    }
  }

  /**
   * Helper to trigger a one-shot event during an animation timeline window
   * without firing every sub-frame.
   */
  public triggerOnceInWindow(
    actionId: string,
    normalizedTime: number,
    windowStart: number,
    windowEnd: number,
    eventPayload: AnimationEventPayload
  ): boolean {
    const key = `${actionId}_${eventPayload.eventName}`;
    if (normalizedTime >= windowStart && normalizedTime <= windowEnd) {
      if (!this.triggeredFrames.has(key)) {
        this.triggeredFrames.add(key);
        this.emit(eventPayload);
        return true;
      }
    } else if (normalizedTime < windowStart || normalizedTime > windowEnd + 0.1) {
      // Reset trigger when leaving window
      this.triggeredFrames.delete(key);
    }
    return false;
  }

  public resetAction(actionId: string): void {
    const keysToDelete: string[] = [];
    this.triggeredFrames.forEach((key) => {
      if (key.startsWith(actionId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => this.triggeredFrames.delete(k));
  }

  public clear(): void {
    this.triggeredFrames.clear();
    this.listeners.clear();
  }
}
