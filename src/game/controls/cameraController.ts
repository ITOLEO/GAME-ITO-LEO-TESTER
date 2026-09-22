/**
 * Third-Person Action-RPG Camera Controller
 * Handles mouse orbit, pitch clamping, responsive follow, collision avoidance, and dynamic sprint FOV.
 */

import * as THREE from "three";
import { ControlConfig } from "./controlConfig";
import { CollisionSystem } from "./collisionSystem";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private config: ControlConfig;
  private collisionSystem: CollisionSystem;

  // Angles & Distance
  private yaw = 0; // Horizontal orbit (0 - 2PI continuous)
  private pitch = 0.35; // Vertical tilt (clamped)
  private targetDistance = 5.5;
  private currentDistance = 5.5;

  // Photo Mode overrides
  private isPhotoMode = false;
  private photoYawDelta = 0;
  private photoPitchDelta = 0;
  private photoDistance = 5.5;
  private photoHeightOffset = 1.8;

  // Camera Shake
  private shakeIntensity = 0;
  private shakeTimer = 0;

  // Cached Vectors
  private lookTarget = new THREE.Vector3();
  private desiredCamPos = new THREE.Vector3();
  private currentCamPos = new THREE.Vector3();
  private cameraForward = new THREE.Vector3(0, 0, -1);
  private cameraRight = new THREE.Vector3(1, 0, 0);
  private readonly worldUp = new THREE.Vector3(0, 1, 0);

  constructor(camera: THREE.PerspectiveCamera, config: ControlConfig, collisionSystem: CollisionSystem) {
    this.camera = camera;
    this.config = config;
    this.collisionSystem = collisionSystem;
    this.targetDistance = config.cameraDistance;
    this.currentDistance = config.cameraDistance;
    this.currentCamPos.copy(this.camera.position);
  }

  /**
   * Process mouse movement to update camera yaw and pitch
   * Mouse Right -> Camera view rotates Right (yaw decreases)
   * Mouse Left -> Camera view rotates Left (yaw increases)
   * Mouse Up -> Camera tilts upward (pitch decreases)
   * Mouse Down -> Camera tilts downward (pitch increases)
   */
  public handleMouseMove(deltaX: number, deltaY: number) {
    const sensitivity = this.config.cameraSensitivity;

    if (this.isPhotoMode) {
      this.photoYawDelta -= deltaX * sensitivity;
      this.photoPitchDelta = Math.max(
        -0.5,
        Math.min(0.5, this.photoPitchDelta + deltaY * sensitivity)
      );
      return;
    }

    this.yaw -= deltaX * sensitivity;

    // Normalize yaw to [0, 2*PI)
    const twoPi = Math.PI * 2;
    this.yaw = (this.yaw % twoPi + twoPi) % twoPi;

    // Pitch clamping (Req 15, 17)
    this.pitch = Math.max(
      this.config.cameraPitchMin,
      Math.min(this.config.cameraPitchMax, this.pitch + deltaY * (sensitivity * 0.9))
    );
  }

  /**
   * Handle mouse wheel zoom
   */
  public handleWheelZoom(deltaY: number) {
    if (this.isPhotoMode) {
      this.photoDistance = Math.max(
        2.0,
        Math.min(12.0, this.photoDistance + deltaY * 0.005)
      );
    } else {
      this.targetDistance = Math.max(
        this.config.cameraDistanceMin,
        Math.min(this.config.cameraDistanceMax, this.targetDistance + deltaY * 0.006)
      );
    }
  }

  /**
   * Update camera position, look target, collision avoidance, and dynamic FOV
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isMoving: boolean,
    terrainHeightFn: (x: number, z: number) => number
  ) {
    // 1. Dynamic Sprint FOV transition (Req 38)
    const targetFov = isSprinting && isMoving ? this.config.cameraSprintFov : this.config.cameraNormalFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, delta * 7));
      this.camera.updateProjectionMatrix();
    }

    // 2. Compute Look Target (offset at upper torso/head, Req 26)
    const activeHeight = this.isPhotoMode ? this.photoHeightOffset : this.config.cameraLookTargetHeight;
    this.lookTarget.set(playerPos.x, playerPos.y + activeHeight, playerPos.z);

    // 3. Smooth distance adjustment
    const activeTargetDist = this.isPhotoMode ? this.photoDistance : this.targetDistance;
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, activeTargetDist, Math.min(1, delta * 10));

    // 4. Compute spherical orbit offset
    const activeYaw = this.isPhotoMode ? this.yaw + this.photoYawDelta : this.yaw;
    const activePitch = this.isPhotoMode ? this.pitch + this.photoPitchDelta : this.pitch;

    const offsetX = Math.sin(activeYaw) * Math.cos(activePitch) * this.currentDistance;
    const offsetY = Math.sin(activePitch) * this.currentDistance;
    const offsetZ = Math.cos(activeYaw) * Math.cos(activePitch) * this.currentDistance;

    this.desiredCamPos.set(
      this.lookTarget.x + offsetX,
      this.lookTarget.y + offsetY,
      this.lookTarget.z + offsetZ
    );

    // 5. Environmental & Terrain Collision Check (Req 24, 25)
    // Avoids clipping through buildings, pillars, or terrain
    const safeCamPos = this.collisionSystem.resolveCameraObstruction(
      this.lookTarget,
      this.desiredCamPos,
      terrainHeightFn,
      this.config.cameraCollisionRadius
    );

    // 6. Smooth camera follow (Req 21, 22)
    const followFactor = Math.min(1, delta * this.config.cameraFollowSmoothness);
    this.camera.position.lerp(safeCamPos, followFactor);

    // Apply Screen Shake if active
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const decay = Math.max(0, this.shakeTimer);
      const shakeAmt = this.shakeIntensity * decay;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmt;
    }

    this.camera.lookAt(this.lookTarget);

    // 7. Update horizontal forward & right vectors (Req 3)
    this.camera.getWorldDirection(this.cameraForward);
    this.cameraForward.y = 0;
    if (this.cameraForward.lengthSq() > 0.0001) {
      this.cameraForward.normalize();
    } else {
      this.cameraForward.set(0, 0, -1);
    }

    this.cameraRight.crossVectors(this.cameraForward, this.worldUp).normalize();
  }

  /**
   * Returns horizontal forward vector of camera (normalized, Y = 0)
   */
  public getCameraForward(): THREE.Vector3 {
    return this.cameraForward.clone();
  }

  /**
   * Returns horizontal right vector of camera (normalized, Y = 0)
   */
  public getCameraRight(): THREE.Vector3 {
    return this.cameraRight.clone();
  }

  public getYaw(): number {
    return this.yaw;
  }

  public getPitch(): number {
    return this.pitch;
  }

  public getYawDegrees(): number {
    return Math.round((this.yaw * 180) / Math.PI);
  }

  public getPitchDegrees(): number {
    return Math.round((this.pitch * 180) / Math.PI);
  }

  public setSensitivity(sensitivity: number) {
    this.config.cameraSensitivity = sensitivity;
  }

  public setPhotoMode(active: boolean) {
    this.isPhotoMode = active;
    if (active) {
      this.photoYawDelta = 0;
      this.photoPitchDelta = 0;
      this.photoDistance = this.currentDistance;
    }
  }

  public setPhotoParams(distance: number, heightOffset: number) {
    this.photoDistance = distance;
    this.photoHeightOffset = heightOffset;
  }

  public punchInDistance(shortDist: number, durationMs = 800) {
    const originalDist = this.targetDistance;
    this.targetDistance = shortDist;
    setTimeout(() => {
      this.targetDistance = originalDist;
    }, durationMs);
  }

  public shake(intensity: number, durationMs = 300) {
    this.shakeIntensity = intensity;
    this.shakeTimer = durationMs / 1000;
  }
}
