/**
 * Centralized Input Manager
 * Handles event-based input tracking, pointer lock, stuck-key prevention,
 * input buffering, and context-aware action routing.
 */

export type InputContext = "GAMEPLAY" | "MENU" | "DIALOGUE" | "DEAD";

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  dodge: boolean;
  interact: boolean;
  attack: boolean;
  skill1: boolean;
  ultimate: boolean;
}

export interface InputCallbacks {
  onInteract?: () => void;
  onAttack?: (isHeavy?: boolean) => void;
  onDodge?: () => void;
  onJump?: () => void;
  onSkill?: () => void;
  onUltimate?: () => void;
  onMenuToggle?: () => void;
  onInventoryToggle?: () => void;
  onCharacterToggle?: () => void;
  onQuestToggle?: () => void;
  onMapToggle?: () => void;
  onPhotoModeToggle?: () => void;
  onDebugToggle?: () => void;
}

export class InputManager {
  private container: HTMLElement;
  private callbacks: InputCallbacks;

  // Active raw keys
  private keysPressed: Record<string, boolean> = {};

  // State
  private context: InputContext = "GAMEPLAY";
  private isPointerLocked = false;
  private isMouseDown = false;

  // Mouse delta
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private lastClientX = 0;
  private lastClientY = 0;
  private hasMouseMovement = false;

  // Wheel delta
  private wheelDelta = 0;

  // Attack Buffering
  private attackBufferTimer = 0;
  private readonly attackBufferDuration = 0.25; // 250ms

  // Event cleanup
  private cleanupFns: (() => void)[] = [];

  constructor(container: HTMLElement, callbacks: InputCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  public setContext(newContext: InputContext) {
    if (this.context === newContext) return;
    this.context = newContext;
    if (newContext !== "GAMEPLAY") {
      this.resetMovementKeys();
      this.releasePointerLock();
    }
  }

  public getContext(): InputContext {
    return this.context;
  }

  private bindEvents() {
    // 1. Keydown
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typing in form input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      this.keysPressed[e.code] = true;

      // Global shortcuts (ESC closes modals or toggles menu)
      if (e.code === "Escape") {
        this.releasePointerLock();
        this.callbacks.onMenuToggle?.();
        return;
      }

      if (e.code === "Backquote" || e.code === "F1") {
        this.callbacks.onDebugToggle?.();
        return;
      }

      // If not in GAMEPLAY, do not process gameplay triggers
      if (this.context !== "GAMEPLAY") {
        return;
      }

      // Gameplay Action Keys
      if (e.code === "KeyE") {
        this.callbacks.onInteract?.();
      } else if (e.code === "Space") {
        e.preventDefault();
        this.callbacks.onJump?.();
      } else if (e.code === "KeyQ" || e.code === "Digit1") {
        this.callbacks.onSkill?.();
      } else if (e.code === "KeyR" || e.code === "Digit4") {
        this.callbacks.onUltimate?.();
      } else if (e.code === "KeyI" || e.code === "KeyB") {
        this.callbacks.onInventoryToggle?.();
      } else if (e.code === "KeyC") {
        this.callbacks.onCharacterToggle?.();
      } else if (e.code === "KeyJ") {
        this.callbacks.onQuestToggle?.();
      } else if (e.code === "KeyM") {
        this.callbacks.onMapToggle?.();
      } else if (e.code === "KeyF") {
        this.callbacks.onPhotoModeToggle?.();
      }
    };

    // 2. Keyup
    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.code] = false;
    };

    // 3. Prevent Stuck Keys on Window Blur & Visibility Change (Req 10)
    const onBlur = () => {
      this.resetMovementKeys();
    };

    const onFocus = () => {
      this.resetMovementKeys();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.resetMovementKeys();
      }
    };

    // 4. Pointer Lock Change
    const onPointerLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      // Reset accumulated mouse delta to avoid camera jumps
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
      this.hasMouseMovement = false;
    };

    // 5. Container Click -> Request Pointer Lock
    const onContainerClick = (e: MouseEvent) => {
      if (this.context !== "GAMEPLAY") return;
      // Do not re-request if already locked
      if (!this.isPointerLocked && document.pointerLockElement !== this.container) {
        try {
          this.container.requestPointerLock?.();
        } catch {
          // Handled gracefully in iframe/browser permissions
        }
      }
    };

    // 6. Mouse Down
    const onMouseDown = (e: MouseEvent) => {
      if (this.context !== "GAMEPLAY") return;
      this.isMouseDown = true;
      this.lastClientX = e.clientX;
      this.lastClientY = e.clientY;

      if (e.button === 0) {
        // Left click = Primary Attack (or buffer attack)
        this.triggerAttackInput(false);
      } else if (e.button === 2) {
        // Right click = Dodge / Dash
        this.callbacks.onDodge?.();
      }
    };

    // 7. Mouse Up
    const onMouseUp = () => {
      this.isMouseDown = false;
    };

    // 8. Mouse Move (Captures camera delta)
    const onMouseMove = (e: MouseEvent) => {
      if (this.context !== "GAMEPLAY") return;

      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
        this.hasMouseMovement = true;
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastClientX;
        const dy = e.clientY - this.lastClientY;
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;
        this.mouseDeltaX += dx;
        this.mouseDeltaY += dy;
        this.hasMouseMovement = true;
      }
    };

    // 9. Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      if (this.context !== "GAMEPLAY") return;
      this.wheelDelta += e.deltaY;
    };

    // 10. Context menu prevention strictly on container (Req 57, 58)
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Attach listeners
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerlockchange", onPointerLockChange);

    this.container.addEventListener("click", onContainerClick);
    this.container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    this.container.addEventListener("wheel", onWheel, { passive: true });
    this.container.addEventListener("contextmenu", onContextMenu);

    this.cleanupFns.push(
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => window.removeEventListener("blur", onBlur),
      () => window.removeEventListener("focus", onFocus),
      () => document.removeEventListener("visibilitychange", onVisibilityChange),
      () => document.removeEventListener("pointerlockchange", onPointerLockChange),
      () => this.container.removeEventListener("click", onContainerClick),
      () => this.container.removeEventListener("mousedown", onMouseDown),
      () => window.removeEventListener("mouseup", onMouseUp),
      () => window.removeEventListener("mousemove", onMouseMove),
      () => this.container.removeEventListener("wheel", onWheel),
      () => this.container.removeEventListener("contextmenu", onContextMenu)
    );
  }

  public resetMovementKeys() {
    this.keysPressed = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this.isMouseDown = false;
  }

  public releasePointerLock() {
    if (document.pointerLockElement === this.container) {
      document.exitPointerLock?.();
    }
    this.isPointerLocked = false;
  }

  public requestPointerLock() {
    if (this.context === "GAMEPLAY" && document.pointerLockElement !== this.container) {
      this.container.requestPointerLock?.();
    }
  }

  /**
   * Consumes and clears accumulated mouse delta for camera control
   */
  public consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.hasMouseMovement = false;
    return delta;
  }

  /**
   * Consumes wheel delta for camera zoom
   */
  public consumeWheelDelta(): number {
    const delta = this.wheelDelta;
    this.wheelDelta = 0;
    return delta;
  }

  /**
   * Returns current input state
   */
  public getInputState(): InputState {
    const active = this.context === "GAMEPLAY";
    return {
      forward: active && !!(this.keysPressed["KeyW"] || this.keysPressed["ArrowUp"]),
      backward: active && !!(this.keysPressed["KeyS"] || this.keysPressed["ArrowDown"]),
      left: active && !!(this.keysPressed["KeyA"] || this.keysPressed["ArrowLeft"]),
      right: active && !!(this.keysPressed["KeyD"] || this.keysPressed["ArrowRight"]),
      sprint: active && !!(this.keysPressed["ShiftLeft"] || this.keysPressed["ShiftRight"]),
      jump: active && !!this.keysPressed["Space"],
      dodge: false, // Event driven via trigger
      interact: active && !!this.keysPressed["KeyE"],
      attack: false, // Event driven via trigger
      skill1: active && !!(this.keysPressed["KeyQ"] || this.keysPressed["Digit1"]),
      ultimate: active && !!(this.keysPressed["KeyR"] || this.keysPressed["Digit4"]),
    };
  }

  /**
   * Computes normalized raw movement axes:
   * inputForward: +1 for W (away from camera), -1 for S (toward camera)
   * inputRight: +1 for D (right relative to camera), -1 for A (left relative to camera)
   */
  public getMovementAxes(): { inputForward: number; inputRight: number } {
    if (this.context !== "GAMEPLAY") {
      return { inputForward: 0, inputRight: 0 };
    }

    let inputForward = 0;
    let inputRight = 0;

    if (this.keysPressed["KeyW"] || this.keysPressed["ArrowUp"]) inputForward += 1;
    if (this.keysPressed["KeyS"] || this.keysPressed["ArrowDown"]) inputForward -= 1;
    if (this.keysPressed["KeyD"] || this.keysPressed["ArrowRight"]) inputRight += 1;
    if (this.keysPressed["KeyA"] || this.keysPressed["ArrowLeft"]) inputRight -= 1;

    return { inputForward, inputRight };
  }

  /**
   * Attack Buffering System (Req 48)
   */
  public triggerAttackInput(isHeavy = false) {
    if (this.context !== "GAMEPLAY") return;
    this.attackBufferTimer = this.attackBufferDuration;
    this.callbacks.onAttack?.(isHeavy);
  }

  public updateBuffer(delta: number) {
    if (this.attackBufferTimer > 0) {
      this.attackBufferTimer = Math.max(0, this.attackBufferTimer - delta);
    }
  }

  public consumeAttackBuffer(): boolean {
    if (this.attackBufferTimer > 0) {
      this.attackBufferTimer = 0;
      return true;
    }
    return false;
  }

  public isKeyActive(code: string): boolean {
    return !!this.keysPressed[code];
  }

  public getRawKeysPressed(): Record<string, boolean> {
    return { ...this.keysPressed };
  }

  public getPointerLockState(): boolean {
    return this.isPointerLocked;
  }

  public destroy() {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }
}
