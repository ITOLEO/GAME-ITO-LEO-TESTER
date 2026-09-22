/**
 * Aetheria: Resonant Horizon - Developer Debug & Performance Suite
 */

import React, { useEffect, useState } from "react";
import {
  Terminal,
  Activity,
  MapPin,
  ShieldAlert,
  Zap,
  Coins,
  Sparkles,
  CloudSun,
  X,
  PlusCircle,
  CheckCircle,
} from "lucide-react";
import { DebugStats } from "../types/game";

interface DebugConsoleModalProps {
  onClose: () => void;
  getDebugStats: () => DebugStats;
  onTeleport: (coords: [number, number, number]) => void;
  onSpawnEnemy: (type: "stalker" | "automaton" | "boss") => void;
  onToggleGodMode: (enabled: boolean) => void;
  onGrantCurrency: (gold: number, prisms: number) => void;
  onHealAndRefill: () => void;
  onSetTimePreset: (time: "dawn" | "noon" | "dusk" | "midnight") => void;
  onSetWeatherPreset: (weather: "Clear" | "Rain" | "Windstorm" | "Aether Fog" | "Aurora") => void;
  onLevelUpActive: () => void;
  onCompleteActiveQuest: () => void;
  onToggleInputOverlay?: () => void;
  isInputOverlayActive?: boolean;
  onOpenAnimationDebugger?: () => void;
}

export const DebugConsoleModal: React.FC<DebugConsoleModalProps> = ({
  onClose,
  getDebugStats,
  onTeleport,
  onSpawnEnemy,
  onToggleGodMode,
  onGrantCurrency,
  onHealAndRefill,
  onSetTimePreset,
  onSetWeatherPreset,
  onLevelUpActive,
  onCompleteActiveQuest,
  onToggleInputOverlay,
  isInputOverlayActive,
  onOpenAnimationDebugger,
}) => {
  const [stats, setStats] = useState<DebugStats>(getDebugStats());
  const [godModeActive, setGodModeActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getDebugStats());
    }, 400);
    return () => clearInterval(interval);
  }, [getDebugStats]);

  const landmarks: { name: string; pos: [number, number, number]; desc: string }[] = [
    { name: "Sunvale Haven (Village)", pos: [0, 0, 0], desc: "Peaceful settlement hub" },
    { name: "Whispering Glade", pos: [45, 0, 30], desc: "Verdant forest & stalkers" },
    { name: "Ruins of the First Beacon", pos: [75, 0, -45], desc: "Ancient pillars & monolith" },
    { name: "Molten Caldera", pos: [-85, 0, 70], desc: "Boss arena & volcanic basalt" },
    { name: "Leyline Spire Outlook", pos: [-60, 0, -60], desc: "High plateau vantage" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-400/50 flex items-center justify-center text-emerald-400 font-mono">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-neutral-100 uppercase tracking-wider font-mono">
                  Engine Debug & Performance Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DEVELOPER
                </span>
              </div>
              <p className="text-xs text-neutral-400">Real-time telemetry, stage coordinates & sandbox cheats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Live Telemetry Metric Strip */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-3 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Real-Time Performance Metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 font-mono text-center">
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Framerate</span>
                <span className={`text-base font-bold ${stats.fps >= 55 ? "text-emerald-400" : "text-amber-400"}`}>
                  {stats.fps} FPS
                </span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Frame Time</span>
                <span className="text-base font-bold text-cyan-400">{stats.frameTimeMs} ms</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Draw Calls</span>
                <span className="text-base font-bold text-neutral-200">{stats.drawCalls}</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Polygons</span>
                <span className="text-base font-bold text-neutral-200">{stats.triangles.toLocaleString()}</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Enemies Active</span>
                <span className="text-base font-bold text-purple-400">{stats.activeEnemies}</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Position</span>
                <span className="text-xs font-bold text-amber-300">
                  {stats.playerX}, {stats.playerZ}
                </span>
              </div>
            </div>
          </div>

          {/* 1.5 Control & Movement Diagnostics (Req 74) */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Controls & Physics Diagnostics (Req 74)</span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenAnimationDebugger && (
                  <button
                    onClick={onOpenAnimationDebugger}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                  >
                    Animation Suite (F4)
                  </button>
                )}
                {onToggleInputOverlay && (
                  <button
                    onClick={onToggleInputOverlay}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      isInputOverlayActive
                        ? "bg-cyan-500 text-neutral-950 font-bold"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {isInputOverlayActive ? "Hide HUD Overlay" : "Show HUD Overlay"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 font-mono text-center text-xs">
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Camera Yaw</span>
                <span className="text-sm font-bold text-cyan-300">{stats.cameraYawDeg ?? 0}°</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Camera Pitch</span>
                <span className="text-sm font-bold text-cyan-300">{stats.cameraPitchDeg ?? 0}°</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Velocity (X,Z)</span>
                <span className="text-sm font-bold text-neutral-200">
                  {stats.playerVelocity ? `${stats.playerVelocity[0]}, ${stats.playerVelocity[2]}` : "0, 0"}
                </span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Planar Speed</span>
                <span className="text-sm font-bold text-emerald-300">{stats.currentSpeed ?? 0} m/s</span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Grounded</span>
                <span
                  className={`text-sm font-bold ${
                    stats.isGrounded ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {stats.isGrounded ? "YES" : "AIRBORNE"}
                </span>
              </div>
              <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase">Input Context</span>
                <span className="text-xs font-bold text-purple-300">{stats.inputContext ?? "GAMEPLAY"}</span>
              </div>
            </div>
          </div>

          {/* 2. Fast Travel Teleport System */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Instant Landmark Teleportation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {landmarks.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => onTeleport(loc.pos)}
                  className="p-3 bg-neutral-900/60 hover:bg-cyan-950/40 border border-neutral-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-bold text-neutral-200 group-hover:text-cyan-300 font-mono">
                    {loc.name}
                  </div>
                  <div className="text-[11px] text-neutral-400">{loc.desc}</div>
                  <div className="text-[10px] text-cyan-500/80 font-mono mt-1">
                    [{loc.pos[0]}, {loc.pos[1]}, {loc.pos[2]}]
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Entity Spawners & Cheats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Enemy Spawners */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <PlusCircle className="w-4 h-4" />
                <span>Enemy Entity Spawner</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSpawnEnemy("stalker")}
                  className="px-3 py-2 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500/60 rounded-lg text-xs font-mono text-purple-300 transition-all text-center"
                >
                  + Stalker
                </button>
                <button
                  onClick={() => onSpawnEnemy("automaton")}
                  className="px-3 py-2 bg-neutral-950 hover:bg-sky-950/40 border border-neutral-800 hover:border-sky-500/60 rounded-lg text-xs font-mono text-sky-300 transition-all text-center"
                >
                  + Automaton
                </button>
                <button
                  onClick={() => onSpawnEnemy("boss")}
                  className="px-3 py-2 bg-neutral-950 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-500/60 rounded-lg text-xs font-mono text-rose-300 transition-all text-center"
                >
                  + Caldera Boss
                </button>
              </div>
            </div>

            {/* Sandbox Cheats */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Sandbox Privileges & Resources</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const next = !godModeActive;
                    setGodModeActive(next);
                    onToggleGodMode(next);
                  }}
                  className={`px-3 py-2 border rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                    godModeActive
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                      : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>God Mode: {godModeActive ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={onHealAndRefill}
                  className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 transition-all"
                >
                  Heal & Refill Energy
                </button>

                <button
                  onClick={() => onGrantCurrency(2000, 300)}
                  className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-mono text-amber-300 flex items-center justify-center gap-1 transition-all"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>+2000 Shards & 300 Prisms</span>
                </button>

                <button
                  onClick={onLevelUpActive}
                  className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+1000 Char EXP</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Time & Atmosphere Controls */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider">
              <CloudSun className="w-4 h-4" />
              <span>Time of Day & Atmosphere Override</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => onSetTimePreset("dawn")}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-amber-950/40 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-xs font-mono text-amber-200"
              >
                Sunrise / Dawn
              </button>
              <button
                onClick={() => onSetTimePreset("noon")}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-sky-950/40 border border-neutral-800 hover:border-sky-500/40 rounded-lg text-xs font-mono text-sky-200"
              >
                High Noon
              </button>
              <button
                onClick={() => onSetTimePreset("dusk")}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-orange-950/40 border border-neutral-800 hover:border-orange-500/40 rounded-lg text-xs font-mono text-orange-200"
              >
                Twilight / Dusk
              </button>
              <button
                onClick={() => onSetTimePreset("midnight")}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-indigo-950/40 border border-neutral-800 hover:border-indigo-500/40 rounded-lg text-xs font-mono text-indigo-200"
              >
                Starry Midnight
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {(["Clear", "Rain", "Windstorm", "Aether Fog", "Aurora"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => onSetWeatherPreset(w)}
                  className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 rounded-lg text-xs font-mono text-neutral-300"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Quest Cheats */}
          <div className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 p-3 rounded-xl">
            <div className="text-xs text-neutral-300 font-mono">
              Instantly resolve the active quest objective and claim chapter milestones:
            </div>
            <button
              onClick={onCompleteActiveQuest}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Complete Active Quest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
