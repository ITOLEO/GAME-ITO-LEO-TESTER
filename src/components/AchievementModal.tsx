/**
 * Aetheria: Resonant Horizon - Achievements System
 * Requirement: 55. Achievement System
 */

import React, { useState } from "react";
import { Achievement } from "../types/game";
import {
  X,
  Trophy,
  Sparkles,
  CheckCircle2,
  Gift,
  Compass,
  MapPin,
  Swords,
  Zap,
  Flame,
  FlaskConical,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { audio } from "../game/audio";

interface AchievementModalProps {
  achievements: Achievement[];
  currency: number;
  astralPrisms: number;
  onClaimAchievement: (achievementId: string) => void;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievements,
  currency,
  astralPrisms,
  onClaimAchievement,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Story", "Combat", "Exploration", "Boss", "Collection", "Character"];

  const filteredAchievements = achievements.filter((ach) => {
    if (activeCategory === "All") return true;
    return ach.category === activeCategory;
  });

  const completedCount = achievements.filter((a) => a.completed).length;
  const claimedCount = achievements.filter((a) => a.claimed).length;
  const totalPrismsAvailable = achievements.reduce((sum, a) => sum + (a.claimed ? a.rewardPrisms : 0), 0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return Compass;
      case "MapPin":
        return MapPin;
      case "Swords":
        return Swords;
      case "Zap":
        return Zap;
      case "Flame":
        return Flame;
      case "FlaskConical":
        return FlaskConical;
      case "Globe":
        return Globe;
      case "ShieldAlert":
        return ShieldAlert;
      default:
        return Trophy;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Leyline Records & Achievements
            </h2>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                ✦ {currency.toLocaleString()} Shards
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                {astralPrisms.toLocaleString()} Prisms
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Milestone Summary Header */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-900/30 border-b border-neutral-800 text-center">
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
            <div className="text-[10px] uppercase font-bold text-neutral-400">Total Unlocked</div>
            <div className="text-lg font-black text-cyan-300">
              {completedCount} / {achievements.length}
            </div>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
            <div className="text-[10px] uppercase font-bold text-neutral-400">Claimed Rewards</div>
            <div className="text-lg font-black text-emerald-300">
              {claimedCount} / {completedCount}
            </div>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
            <div className="text-[10px] uppercase font-bold text-neutral-400">Prisms Acquired</div>
            <div className="text-lg font-black text-purple-300">
              +{totalPrismsAvailable} ✦
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/20 px-6 pt-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                audio.playButtonClickSound();
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievements List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {filteredAchievements.map((ach) => {
            const Icon = getIcon(ach.icon);
            const progressPercent = Math.min(100, (ach.progress / ach.maxProgress) * 100);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  ach.claimed
                    ? "bg-neutral-900/30 border-neutral-800 opacity-70"
                    : ach.completed
                    ? "bg-amber-950/20 border-amber-500/60 shadow-lg"
                    : "bg-neutral-900/50 border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${
                      ach.completed
                        ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100 truncate">{ach.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-800 text-neutral-400 uppercase">
                        {ach.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-3 max-w-md">
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            ach.completed ? "bg-amber-400" : "bg-cyan-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Rewards & Action */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-300 font-mono">+{ach.rewardGold} Shards</div>
                    <div className="text-xs font-bold text-purple-300 font-mono flex items-center justify-end gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      +{ach.rewardPrisms} Prisms
                    </div>
                  </div>

                  {ach.claimed ? (
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Claimed
                    </div>
                  ) : ach.completed ? (
                    <button
                      onClick={() => onClaimAchievement(ach.id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 animate-pulse"
                    >
                      <Gift className="w-4 h-4" />
                      Claim
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs font-medium">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
