/**
 * Aetheria: Resonant Horizon - Interactive Regional World Map
 */

import React from "react";
import { X, MapPin, Compass, Sparkles, Navigation } from "lucide-react";
import { audio } from "../game/audio";

interface WorldMapModalProps {
  playerPos: [number, number];
  unlockedWaystones: string[];
  onFastTravel: (pos: [number, number, number]) => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  playerPos,
  unlockedWaystones,
  onFastTravel,
  onClose,
}) => {
  const landmarks = [
    {
      id: "way_haven",
      name: "Sunvale Haven Plaza",
      desc: "Peaceful pastoral township and the heart of the Highlands.",
      pos: [0, -2] as [number, number],
      world3D: [0, 0, -2] as [number, number, number],
      color: "#38bdf8",
    },
    {
      id: "way_glade",
      name: "Whispering Glade Crossing",
      desc: "Dense enchanted woods inhabited by Aetherling beasts and wild herbs.",
      pos: [40, 10] as [number, number],
      world3D: [40, 0, 10] as [number, number, number],
      color: "#22c55e",
    },
    {
      id: "way_ruins",
      name: "Ancient Beacon Sanctum",
      desc: "Crumbling celestial pillars housing the First Beacon and elemental totems.",
      pos: [75, -45] as [number, number],
      world3D: [75, 0, -45] as [number, number, number],
      color: "#a855f7",
    },
    {
      id: "way_caldera",
      name: "Caldera of the Colossus",
      desc: "Magmatic volcanic basin where the ancient Ignis-Titan awakens.",
      pos: [-65, 60] as [number, number],
      world3D: [-65, 0, 60] as [number, number, number],
      color: "#ef4444",
    },
  ];

  // Map coordinate conversion to percentage on 200x200 area (-100 to 100)
  const toMapCoords = (x: number, z: number) => {
    const left = ((x + 100) / 200) * 100;
    const top = ((z + 100) / 200) * 100;
    return { left: `${Math.max(5, Math.min(95, left))}%`, top: `${Math.max(5, Math.min(95, top))}%` };
  };

  const playerMapCoords = toMapCoords(playerPos[0], playerPos[1]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Sunvale Highlands — World Atlas
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              Coordinates: X: {Math.round(playerPos[0])} | Z: {Math.round(playerPos[1])}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas & Landmark Cards */}
        <div className="flex-1 flex overflow-hidden">
          {/* Visual Map Area */}
          <div className="flex-1 relative bg-gradient-to-br from-neutral-950 via-slate-900 to-sky-950 overflow-hidden border-r border-neutral-800 flex items-center justify-center">
            {/* Topographic Contours (decorative background SVG) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 6" />
                <path d="M 10 100 Q 200 40 400 300 T 800 200" fill="none" stroke="#0284c7" strokeWidth="3" opacity="0.6" />
              </svg>
            </div>

            {/* Region Labels */}
            <div className="absolute top-8 left-8 text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              NW: Caldera Range
            </div>
            <div className="absolute top-8 right-8 text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              NE: Ancient Beacon
            </div>
            <div className="absolute bottom-8 left-8 text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              SW: High Steppes
            </div>
            <div className="absolute bottom-8 right-8 text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              SE: Whispering Glade
            </div>

            {/* Player Marker */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
              style={playerMapCoords}
            >
              <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_#38bdf8] flex items-center justify-center animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-md flex items-center justify-center relative z-10" />
              <span className="text-[10px] font-bold text-cyan-200 bg-black/70 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
                You
              </span>
            </div>

            {/* Waystone Landmark Markers */}
            {landmarks.map((lm) => {
              const coords = toMapCoords(lm.pos[0], lm.pos[1]);
              const isUnlocked = unlockedWaystones.includes(lm.id);

              return (
                <div
                  key={lm.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
                  style={coords}
                  onClick={() => {
                    if (isUnlocked) {
                      onFastTravel(lm.world3D);
                      audio.playFanfare();
                      onClose();
                    }
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                      isUnlocked
                        ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)] group-hover:scale-125"
                        : "bg-neutral-900 border-neutral-700 text-neutral-500"
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-200 bg-black/80 px-2 py-0.5 rounded-md mt-1 group-hover:text-cyan-300 whitespace-nowrap shadow">
                    {lm.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Fast Travel Waystones List */}
          <div className="w-80 p-5 overflow-y-auto space-y-4 bg-neutral-900/30">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Waystone Teleportation
            </h3>

            <div className="space-y-3">
              {landmarks.map((lm) => {
                const isUnlocked = unlockedWaystones.includes(lm.id);

                return (
                  <div
                    key={lm.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? "bg-neutral-900/80 border-cyan-500/40"
                        : "bg-neutral-900/30 border-neutral-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-neutral-100">{lm.name}</h4>
                      {isUnlocked ? (
                        <span className="text-[10px] text-emerald-400 font-bold">UNLOCKED</span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-bold">LOCKED</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">{lm.desc}</p>

                    <button
                      disabled={!isUnlocked}
                      onClick={() => {
                        onFastTravel(lm.world3D);
                        audio.playFanfare();
                        onClose();
                      }}
                      className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isUnlocked ? "Fast Travel Here" : "Explore to Unlock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
