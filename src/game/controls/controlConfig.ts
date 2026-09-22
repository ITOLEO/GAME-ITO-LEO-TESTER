/**
 * Master Control Configuration
 * Centralized, tunable parameters for the 3D Third-Person Action-RPG Control System
 */

export interface ControlConfig {
  // Movement Speeds (m/s)
  walkSpeed: number;
  runSpeed: number;
  sprintSpeed: number;
  attackMoveSpeed: number;

  // Acceleration & Deceleration (m/s²)
  acceleration: number;
  deceleration: number;
  sprintDeceleration: number;

  // Character Turning (rad/s)
  rotationSpeed: number;

  // Camera Settings
  cameraSensitivity: number;
  cameraDistance: number;
  cameraDistanceMin: number;
  cameraDistanceMax: number;
  cameraHeight: number;
  cameraLookTargetHeight: number;
  cameraPitchMin: number;
  cameraPitchMax: number;
  cameraFollowSmoothness: number;
  cameraCollisionRadius: number;
  cameraNormalFov: number;
  cameraSprintFov: number;

  // Jump & Physics
  jumpForce: number;
  gravity: number;
  airControl: number; // 0.0 - 1.0 (75% default)

  // Dodge
  dodgeImpulse: number;
  dodgeDuration: number;
  dodgeIFrameDuration: number;

  // Combat Buffering
  attackBufferDuration: number;
}

export const DEFAULT_CONTROL_CONFIG: ControlConfig = {
  walkSpeed: 3.5,
  runSpeed: 5.6,
  sprintSpeed: 9.2,
  attackMoveSpeed: 1.6,

  acceleration: 24.0,
  deceleration: 26.0,
  sprintDeceleration: 16.0,

  rotationSpeed: 13.5, // Smooth responsive turn

  cameraSensitivity: 0.0035,
  cameraDistance: 5.5,
  cameraDistanceMin: 2.8,
  cameraDistanceMax: 9.5,
  cameraHeight: 1.8,
  cameraLookTargetHeight: 1.5, // Upper chest / head
  cameraPitchMin: 0.06, // ~3.5 degrees (keeps above ground)
  cameraPitchMax: 1.22, // ~70 degrees (prevents flip)
  cameraFollowSmoothness: 14.0,
  cameraCollisionRadius: 0.4,
  cameraNormalFov: 58,
  cameraSprintFov: 64,

  jumpForce: 8.5,
  gravity: 22.0,
  airControl: 0.75, // 75% horizontal steering in mid-air

  dodgeImpulse: 16.0,
  dodgeDuration: 0.35,
  dodgeIFrameDuration: 0.25,

  attackBufferDuration: 0.25,
};
