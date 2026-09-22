/**
 * AnimationDebuggerModal - Master Animation System Debugger & Test Mode.
 * Fulfills Requirements 97 (Animation Debugger) and 98 (Animation Test Mode).
 */

import React, { useState } from "react";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Shield,
  Sword,
  Sliders,
  X,
  Layers,
} from "lucide-react";
import { AnimationDebugData, AnimationState } from "../game/animation/animationTypes";

interface AnimationDebuggerModalProps {
  debugData: AnimationDebugData;
  onSetTestMode: (active: boolean, state?: AnimationState) => void;
  onScrubTime: (normalizedTime: number) => void;
  onClose: () => void;
}

const TEST_STATES: { label: string; state: AnimationState }[] = [
  { label: "Idle", state: "IDLE" },
  { label: "Walk", state: "WALK" },
  { label: "Run", state: "RUN" },
  { label: "Sprint", state: "SPRINT" },
  { label: "Jump Start", state: "JUMP_START" },
  { label: "Airborne Jump", state: "JUMP" },
  { label: "Falling", state: "FALL" },
  { label: "Impact Landing", state: "LAND" },
  { label: "Dodge Evade", state: "DODGE" },
  { label: "Light Attack 1", state: "ATTACK_01" },
  { label: "Light Attack 2", state: "ATTACK_02" },
  { label: "Light Attack 3", state: "ATTACK_03" },
  { label: "Heavy Attack", state: "HEAVY_ATTACK" },
  { label: "Elemental Skill", state: "SKILL" },
  { label: "Ultimate Burst", state: "ULTIMATE" },
  { label: "Hit Recoil", state: "HIT" },
  { label: "Stagger Loss Balance", state: "STAGGER" },
  { label: "Death Collapse", state: "DEATH" },
  { label: "Draw Equip", state: "EQUIP" },
  { label: "Sheath Unequip", state: "UNEQUIP" },
];

export const AnimationDebuggerModal: React.FC<AnimationDebuggerModalProps> = ({
  debugData,
  onSetTestMode,
  onScrubTime,
  onClose,
}) => {
  const [selectedState, setSelectedState] = useState<AnimationState>(debugData.testState || "IDLE");
  const [scrubValue, setScrubValue] = useState<number>(debugData.normalizedTime);
  const [isPaused, setIsPaused] = useState(false);

  const handleSelectState = (st: AnimationState) => {
    setSelectedState(st);
    onSetTestMode(true, st);
  };

  const handleToggleTestMode = () => {
    const next = !debugData.testModeActive;
    onSetTestMode(next, selectedState);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
    onScrubTime(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-neutral-200 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Master Animation System Inspector
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Real-Time Blend Weights, Rig Poses & Keyframe Test Mode (Req 97 & 98)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Real-Time Telemetry Dashboard (Req 97) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 font-mono text-center text-xs">
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Active State</span>
            <span className="text-sm font-bold text-cyan-400">{debugData.currentState}</span>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Previous State</span>
            <span className="text-sm font-bold text-neutral-300">{debugData.previousState}</span>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Normalized Time</span>
            <span className="text-sm font-bold text-amber-400">{debugData.normalizedTime}</span>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Blend Weight</span>
            <span className="text-sm font-bold text-emerald-400">{debugData.blendWeight}</span>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Planar Speed</span>
            <span className="text-sm font-bold text-purple-400">{debugData.planarSpeed} m/s</span>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase block">Grounded</span>
            <span
              className={`text-sm font-bold ${
                debugData.isGrounded ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {debugData.isGrounded ? "YES" : "AIRBORNE"}
            </span>
          </div>
        </div>

        {/* 2. Layer & Weapon Information */}
        <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-neutral-400">Active Rig Layers:</span>
            <span className="text-cyan-300 font-semibold">{debugData.activeLayer}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-amber-400" />
            <span className="text-neutral-400">Weapon Style:</span>
            <span className="text-amber-300 font-semibold">{debugData.weaponType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-neutral-400">Secondary Spring Physics:</span>
            <span className="text-emerald-300 font-semibold">Active (Hair + Cape + Cloth)</span>
          </div>
        </div>

        {/* 3. Animation Test Mode Controls (Req 98) */}
        <div className="bg-neutral-950/90 p-5 rounded-2xl border border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Developer Animation Test Mode (Req 98)
              </h3>
            </div>
            <button
              onClick={handleToggleTestMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                debugData.testModeActive
                  ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {debugData.testModeActive ? "Test Mode: ACTIVE (Overriding Game)" : "Test Mode: DISABLED"}
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Animation Timeline Scrubber:</span>
              <span className="text-cyan-400 font-bold">
                Normalized Frame: {Math.round(scrubValue * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={scrubValue}
              onChange={handleScrubChange}
              disabled={!debugData.testModeActive}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Animation State Palette */}
          <div>
            <span className="text-xs font-mono text-neutral-400 block mb-2">
              Select Pose / Action to Inspect:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {TEST_STATES.map((item) => {
                const isSelected = selectedState === item.state && debugData.testModeActive;
                return (
                  <button
                    key={item.state}
                    onClick={() => handleSelectState(item.state)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-mono text-left transition-all ${
                      isSelected
                        ? "bg-cyan-500 text-neutral-950 font-bold shadow-md shadow-cyan-500/20"
                        : "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-2 border-t border-neutral-800">
          <span>Press F4 or click close to return to gameplay</span>
          <button
            onClick={() => onSetTestMode(false)}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          >
            Reset to Natural Gameplay
          </button>
        </div>
      </div>
    </div>
  );
};
