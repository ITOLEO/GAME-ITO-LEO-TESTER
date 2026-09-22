/**
 * Aetheria: Resonant Horizon - Character Creator & Profile Customizer
 */

import React, { useState } from "react";
import { Sparkles, User, Swords, Shield, Zap, Flame, Compass } from "lucide-react";
import { audio } from "../game/audio";

interface CharacterCreatorProps {
  onComplete: (profile: {
    name: string;
    avatarColor: string;
    accentColor: string;
    element: string;
  }) => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const [name, setName] = useState("Kaelen");
  const [selectedClass, setSelectedClass] = useState<"gale" | "ember" | "volt">("gale");
  const [hairColor, setHairColor] = useState("#38bdf8");
  const [accentColor, setAccentColor] = useState("#0284c7");

  const classes = [
    {
      id: "gale" as const,
      name: "Gale Vanguard",
      element: "Gale",
      icon: Swords,
      color: "#38bdf8",
      desc: "Swift, acrobatic swordmaster channeling wind currents for continuous multi-hit slashes.",
    },
    {
      id: "ember" as const,
      name: "Ember Striker",
      element: "Ember",
      icon: Flame,
      color: "#ef4444",
      desc: "Devastating flame combatant delivering fiery cleaves and high stagger explosions.",
    },
    {
      id: "volt" as const,
      name: "Volt Duelist",
      element: "Volt",
      icon: Zap,
      color: "#8b5cf6",
      desc: "High-speed thunder duelist arcing lightning across groups of foes.",
    },
  ];

  const palette = [
    { name: "Cyan Spark", color: "#38bdf8", accent: "#0284c7" },
    { name: "Sun Amber", color: "#f59e0b", accent: "#d97706" },
    { name: "Crimson Flame", color: "#ef4444", accent: "#b91c1c" },
    { name: "Amethyst Arc", color: "#8b5cf6", accent: "#6d28d9" },
    { name: "Verdant Glade", color: "#22c55e", accent: "#15803d" },
    { name: "Silver Lunar", color: "#e2e8f0", accent: "#64748b" },
  ];

  const handleStart = () => {
    audio.playFanfare();
    onComplete({
      name: name.trim() || "Resonance Traveler",
      avatarColor: hairColor,
      accentColor: accentColor,
      element: classes.find((c) => c.id === selectedClass)?.element || "Gale",
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-2xl bg-neutral-950/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Aetheria: Resonant Horizon
          </div>
          <h1 className="text-3xl font-black text-neutral-100 tracking-tight font-serif">Forge Your Resonator</h1>
          <p className="text-xs text-neutral-400">Attune your soul to the celestial ley lines of the Sunvale Highlands</p>
        </div>

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" /> Traveler Name
          </label>
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-bold"
          />
        </div>

        {/* Combat Discipline */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Starting Resonance Discipline</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {classes.map((cls) => {
              const Icon = cls.icon;
              const isSelected = selectedClass === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls.id);
                    setHairColor(cls.color);
                    audio.playCollectSound();
                  }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-md scale-[1.02]"
                      : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-neutral-100">{cls.name}</span>
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">{cls.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stylized Palette & Hair Color */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Aura & Attire Palette</label>
          <div className="grid grid-cols-6 gap-2">
            {palette.map((p) => {
              const isSelected = hairColor === p.color;
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setHairColor(p.color);
                    setAccentColor(p.accent);
                    audio.playCollectSound();
                  }}
                  className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                    isSelected ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: p.color, borderColor: p.accent }}
                  title={p.name}
                >
                  {isSelected && <Sparkles className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-cyan-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
        >
          <Compass className="w-5 h-5" />
          Enter Aetheria: Sunvale Reach
        </button>
      </div>
    </div>
  );
};
