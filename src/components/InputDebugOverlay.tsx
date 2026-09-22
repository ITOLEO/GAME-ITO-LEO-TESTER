/**
 * Input & Controls Real-Time Debug Overlay (Req 74)
 * Displays WASD states, camera yaw/pitch, player velocity, movement vector,
 * grounded state, and animation status for control system validation.
 */

import React from "react";
import { Compass, Gauge, Key, Lock, Move, ShieldCheck } from "lucide-react";
import { DebugStats } from "../types/game";

interface InputDebugOverlayProps {
  stats: DebugStats;
  onClose?: () => void;
}

export const InputDebugOverlay: React.FC<InputDebugOverlayProps> = ({ stats, onClose }) => {
  const keys = stats.keysPressed || {};
  const isW = !!(keys["KeyW"] || keys["ArrowUp"]);
  const isA = !!(keys["KeyA"] || keys["ArrowLeft"]);
  const isS = !!(keys["KeyS"] || keys["ArrowDown"]);
  const isD = !!(keys["KeyD"] || keys["ArrowRight"]);
  const isSpace = !!keys["Space"];
  const isShift = !!(keys["ShiftLeft"] || keys["ShiftRight"]);

  const yaw = stats.cameraYawDeg ?? 0;
  const pitch = stats.cameraPitchDeg ?? 0;
  const vel = stats.playerVelocity ?? [0, 0, 0];
  const speed = stats.currentSpeed ?? 0;
  const moveVec = stats.movementVector ?? [0, 0];
  const grounded = stats.isGrounded ?? true;
  const sprinting = stats.isSprinting ?? false;
  const context = stats.inputContext ?? "GAMEPLAY";
  const pointerLocked = stats.pointerLocked ?? false;
  const animState = stats.animState ?? "IDLE";

  return (
    <div
      id="input-debug-overlay"
      className="fixed bottom-24 left-6 z-40 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/80 rounded-xl p-3.5 shadow-2xl text-xs font-mono text-neutral-200 select-none max-w-sm pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Gauge className="w-3.5 h-3.5" />
          <span>Control Diagnostics</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              context === "GAMEPLAY"
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-950/80 text-amber-400 border border-amber-500/40"
            }`}
          >
            {context}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-200 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* WASD & Action Keys Grid */}
      <div className="flex items-center justify-between gap-3 mb-2.5 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/50">
        {/* WASD visualizer */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-7 h-7 flex items-center justify-center rounded font-bold transition-colors ${
              isW
                ? "bg-cyan-500 text-neutral-950 shadow-sm shadow-cyan-500/50"
                : "bg-neutral-800/80 text-neutral-400 border border-neutral-700/60"
            }`}
          >
            W
          </div>
          <div className="flex gap-1">
            <div
              className={`w-7 h-7 flex items-center justify-center rounded font-bold transition-colors ${
                isA
                  ? "bg-cyan-500 text-neutral-950 shadow-sm shadow-cyan-500/50"
                  : "bg-neutral-800/80 text-neutral-400 border border-neutral-700/60"
              }`}
            >
              A
            </div>
            <div
              className={`w-7 h-7 flex items-center justify-center rounded font-bold transition-colors ${
                isS
                  ? "bg-cyan-500 text-neutral-950 shadow-sm shadow-cyan-500/50"
                  : "bg-neutral-800/80 text-neutral-400 border border-neutral-700/60"
              }`}
            >
              S
            </div>
            <div
              className={`w-7 h-7 flex items-center justify-center rounded font-bold transition-colors ${
                isD
                  ? "bg-cyan-500 text-neutral-950 shadow-sm shadow-cyan-500/50"
                  : "bg-neutral-800/80 text-neutral-400 border border-neutral-700/60"
              }`}
            >
              D
            </div>
          </div>
        </div>

        {/* Space & Shift keys */}
        <div className="flex flex-col gap-1.5 text-[11px]">
          <div
            className={`px-2 py-1 rounded text-center font-bold ${
              isShift
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700/60"
            }`}
          >
            SHIFT (Sprint)
          </div>
          <div
            className={`px-2 py-1 rounded text-center font-bold ${
              isSpace
                ? "bg-emerald-500 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700/60"
            }`}
          >
            SPACE (Jump)
          </div>
        </div>
      </div>

      {/* Metrics Readouts */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-neutral-300">
        <div className="flex justify-between">
          <span className="text-neutral-500">Camera Yaw:</span>
          <span className="text-cyan-300 font-bold">{yaw}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Camera Pitch:</span>
          <span className="text-cyan-300 font-bold">{pitch}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Speed:</span>
          <span className="text-emerald-300 font-bold">{speed.toFixed(1)} m/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Grounded:</span>
          <span className={grounded ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
            {grounded ? "YES" : "AIRBORNE"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Velocity:</span>
          <span className="text-neutral-300">
            {vel[0]},{vel[2]}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Anim:</span>
          <span className="text-neutral-200 font-bold">{animState}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Pointer Lock:</span>
          <span className={pointerLocked ? "text-cyan-400" : "text-neutral-400"}>
            {pointerLocked ? "LOCKED" : "FREE"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Move Vector:</span>
          <span className="text-neutral-300">
            [{moveVec[0]}, {moveVec[1]}]
          </span>
        </div>
      </div>
    </div>
  );
};
