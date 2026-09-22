/**
 * Third-Person Action-RPG Movement Controller
 * Implements camera-relative WASD, normalized diagonal speed, acceleration/deceleration,
 * smooth shortest-path rotation, jump physics, air control, dodge impulse, and collision sliding.
 */

import * as THREE from "three";
import { ControlConfig } from "./controlConfig";
import { CollisionSystem } from "./collisionSystem";
import { CameraController } from "./cameraController";
import { InputManager } from "./inputManager";

export interface MovementUpdateResult {
  isMoving: boolean;
  isGrounded: boolean;
  justLanded: boolean;
  currentSpeed: number;
  moveVector: THREE.Vector3;
}

export class MovementController {
  private config: ControlConfig;
  private collisionSystem: CollisionSystem;
  private cameraController: CameraController;
  private inputManager: InputManager;

  // Position, Velocity, Rotation
  private position = new THREE.Vector3(0, 0, 0);
  private velocity = new THREE.Vector3(0, 0, 0); // Current physical velocity
  private horizontalVelocity = new THREE.Vector2(0, 0); // Planar X, Z velocity
  private characterRotation = 0; // Radians Y facing angle
  private targetRotation = 0;

  // States
  private isGrounded = true;
  private wasGrounded = true;
  private isSprinting = false;
  private isAttacking = false;
  private isDodging = false;
  private dodgeTimer = 0;

  // Movement vector
  private currentMoveDir = new THREE.Vector3();

  constructor(
    initialPos: THREE.Vector3,
    config: ControlConfig,
    collisionSystem: CollisionSystem,
    cameraController: CameraController,
    inputManager: InputManager
  ) {
    this.position.copy(initialPos);
    this.config = config;
    this.collisionSystem = collisionSystem;
    this.cameraController = cameraController;
    this.inputManager = inputManager;
  }

  /**
   * Main physics & movement tick (Frame-rate independent with delta time)
   */
  public update(
    delta: number,
    stamina: number,
    terrainHeightFn: (x: number, z: number) => number
  ): MovementUpdateResult {
    // 1. Read input axes
    const { inputForward, inputRight } = this.inputManager.getMovementAxes();
    const rawInputLength = Math.hypot(inputForward, inputRight);
    const hasMoveInput = rawInputLength > 0.01;

    // 2. Sprint Check (Req 37: Sprint requires movement input)
    const inputState = this.inputManager.getInputState();
    this.isSprinting = hasMoveInput && inputState.sprint && stamina > 2;

    // 3. Compute True Camera-Relative Movement Direction (Req 2, 3, 4, 5, 6, 7, 8)
    const cameraForward = this.cameraController.getCameraForward();
    const cameraRight = this.cameraController.getCameraRight();

    this.currentMoveDir.set(0, 0, 0);
    if (hasMoveInput) {
      // W = +forward, S = -forward, D = +right, A = -right
      this.currentMoveDir
        .addScaledVector(cameraForward, inputForward)
        .addScaledVector(cameraRight, inputRight);

      // Diagonal speed normalization (Req 8: Prevent sqrt(2) speed exploit)
      if (this.currentMoveDir.lengthSq() > 0.0001) {
        this.currentMoveDir.normalize();
      }
    }

    // 4. Determine Target Speed
    let targetSpeed = 0;
    if (hasMoveInput) {
      if (this.isAttacking) {
        targetSpeed = this.config.attackMoveSpeed; // Restricted during attack (Req 49)
      } else if (this.isSprinting) {
        targetSpeed = this.config.sprintSpeed;
      } else {
        targetSpeed = this.config.runSpeed;
      }
    }

    // 5. Acceleration & Deceleration (Req 34, 35, 36)
    const targetVelX = this.currentMoveDir.x * targetSpeed;
    const targetVelZ = this.currentMoveDir.z * targetSpeed;

    // Air control factor (Req 43: 75% control when airborne)
    const controlAuthority = this.isGrounded ? 1.0 : this.config.airControl;

    if (hasMoveInput) {
      const accelRate = this.config.acceleration * controlAuthority * delta;
      this.horizontalVelocity.x = THREE.MathUtils.lerp(this.horizontalVelocity.x, targetVelX, Math.min(1, accelRate));
      this.horizontalVelocity.y = THREE.MathUtils.lerp(this.horizontalVelocity.y, targetVelZ, Math.min(1, accelRate));
    } else {
      // Smooth responsive deceleration
      const decelRate = (this.isSprinting ? this.config.sprintDeceleration : this.config.deceleration) * delta;
      this.horizontalVelocity.x = THREE.MathUtils.lerp(this.horizontalVelocity.x, 0, Math.min(1, decelRate));
      this.horizontalVelocity.y = THREE.MathUtils.lerp(this.horizontalVelocity.y, 0, Math.min(1, decelRate));
      if (this.horizontalVelocity.lengthSq() < 0.005) {
        this.horizontalVelocity.set(0, 0);
      }
    }

    // If active dodging, override horizontal velocity with dodge impulse
    if (this.isDodging) {
      this.dodgeTimer -= delta;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
      }
    }

    // 6. Character Rotation (Req 27, 28, 29, 30, 82, 83, 84, 85, 86)
    // Rotate character ONLY when moving; standing still does not rotate character with camera!
    if (hasMoveInput && !this.isDodging) {
      this.targetRotation = Math.atan2(this.currentMoveDir.x, this.currentMoveDir.z);

      // Shortest angular path interpolation
      let angleDiff = this.targetRotation - this.characterRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStep = Math.min(1, delta * this.config.rotationSpeed);
      this.characterRotation += angleDiff * turnStep;
    }

    // 7. Gravity & Vertical Physics (Req 40, 41, 42)
    this.velocity.y -= this.config.gravity * delta;

    // Apply horizontal velocity
    if (!this.isDodging) {
      this.velocity.x = this.horizontalVelocity.x;
      this.velocity.z = this.horizontalVelocity.y;
    }

    // 8. Obstacle Collision & Wall Sliding (Req 60, 61)
    const desiredDelta = new THREE.Vector3(
      this.velocity.x * delta,
      this.velocity.y * delta,
      this.velocity.z * delta
    );

    const safeDelta = this.collisionSystem.resolvePlayerMovement(
      this.position,
      desiredDelta,
      0.45 // Player collision radius
    );

    this.position.x += safeDelta.x;
    this.position.z += safeDelta.z;
    this.position.y += safeDelta.y;

    // 9. Terrain Height Clamping & Landing Detection (Req 42, 62, 64)
    const groundY = terrainHeightFn(this.position.x, this.position.z);
    this.wasGrounded = this.isGrounded;

    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else if (this.position.y > groundY + 0.15) {
      this.isGrounded = false;
    }

    const justLanded = !this.wasGrounded && this.isGrounded;
    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const isMoving = hasMoveInput || planarSpeed > 0.2;

    return {
      isMoving,
      isGrounded: this.isGrounded,
      justLanded,
      currentSpeed: planarSpeed,
      moveVector: this.currentMoveDir.clone(),
    };
  }

  /**
   * Jump Action (Req 40, 41, 42)
   */
  public jump(): boolean {
    if (this.isGrounded) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
      return true;
    }
    return false;
  }

  /**
   * Dodge Action (Req 44, 45, 46)
   */
  public triggerDodge(impulse = 16.0): THREE.Vector3 {
    this.isDodging = true;
    this.dodgeTimer = this.config.dodgeDuration;

    // Dodge direction: movement direction if moving, otherwise backward relative to facing
    let dashDir: THREE.Vector3;
    if (this.currentMoveDir.lengthSq() > 0.01) {
      dashDir = this.currentMoveDir.clone().normalize();
    } else {
      dashDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.characterRotation
      );
    }

    this.velocity.x = dashDir.x * impulse;
    this.velocity.z = dashDir.z * impulse;
    this.horizontalVelocity.set(this.velocity.x, this.velocity.z);

    return dashDir;
  }

  public setAttacking(attacking: boolean) {
    this.isAttacking = attacking;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.horizontalVelocity.set(0, 0);
  }

  public getRotation(): number {
    return this.characterRotation;
  }

  public setRotation(rot: number) {
    this.characterRotation = rot;
    this.targetRotation = rot;
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  public isSprintActive(): boolean {
    return this.isSprinting;
  }

  public isGroundedState(): boolean {
    return this.isGrounded;
  }
}
