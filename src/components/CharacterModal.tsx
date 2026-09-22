/**
 * Aetheria: Resonant Horizon - Character Roster & Progression Modal
 */

import React, { useState } from "react";
import { PlayableCharacter, GameItem, EquipmentSlot } from "../types/game";
import { X, Shield, Zap, Heart, Sparkles, ArrowUpCircle, Flame } from "lucide-react";
import { audio } from "../game/audio";

interface CharacterModalProps {
  party: PlayableCharacter[];
  activeCharIndex: number;
  inventory: GameItem[];
  currency: number;
  onSelectCharacter: (idx: number) => void;
  onLevelUp: (charId: string) => void;
  onAscend: (charId: string) => void;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  party,
  activeCharIndex,
  currency,
  onSelectCharacter,
  onLevelUp,
  onAscend,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(activeCharIndex);
  const char = party[selectedIdx] || party[0];

  const levelUpCost = char.level * 80;
  const canLevelUp = currency >= levelUpCost && char.level < (char.ascension + 1) * 20;
  const canAscend = char.level >= (char.ascension + 1) * 20 && char.ascension < 3;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Character Roster & Ascension
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
              Shards: {currency}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Left Tabs + Main Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Character List */}
          <div className="w-64 border-r border-neutral-800 p-4 space-y-2 bg-neutral-900/20 overflow-y-auto">
            {party.map((c, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedIdx(idx);
                    onSelectCharacter(idx);
                    audio.playButtonClickSound();
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-md scale-[1.02]"
                      : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0"
                    style={{ backgroundColor: c.avatarColor }}
                  >
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-neutral-100 truncate">{c.name}</div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <span>Lv.{c.level}</span>
                      <span>•</span>
                      <span className="text-cyan-400">{c.element}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Character Details & Progression */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Top Identity Card */}
            <div className="flex items-start justify-between bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
              <div>
                <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">{char.title}</div>
                <h3 className="text-2xl font-black text-neutral-100 mt-0.5">{char.name}</h3>
                <p className="text-xs text-neutral-400 max-w-md mt-1">{char.bio}</p>
              </div>

              {/* Level & Ascension Status */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Character Level</div>
                  <div className="text-xl font-black text-cyan-300">
                    Lv. {char.level} <span className="text-xs text-neutral-500">/ {(char.ascension + 1) * 20}</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Ascension Rank {char.ascension}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={!canLevelUp}
                    onClick={() => onLevelUp(char.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Level Up ({levelUpCost} Shards)
                  </button>
                  {canAscend && (
                    <button
                      onClick={() => onAscend(char.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md animate-pulse transition-all active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ascend Character!
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Combat Attributes Grid */}
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Attributes & Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Max Health</div>
                    <div className="text-sm font-bold text-neutral-100">{char.stats.maxHp}</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Attack Power</div>
                    <div className="text-sm font-bold text-neutral-100">{char.stats.atk}</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Defense</div>
                    <div className="text-sm font-bold text-neutral-100">{char.stats.def}</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Critical Rate</div>
                    <div className="text-sm font-bold text-neutral-100">{(char.stats.critRate * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Critical DMG</div>
                    <div className="text-sm font-bold text-neutral-100">{(char.stats.critDmg * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs text-neutral-400">Aether Mastery</div>
                    <div className="text-sm font-bold text-neutral-100">{char.stats.aetherMastery}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Talents (Skill & Ultimate) */}
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Combat Talents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Skill */}
                <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase">Elemental Skill [Q]</span>
                    <span className="text-[10px] text-neutral-500 font-mono">CD: {char.skillCooldown}s</span>
                  </div>
                  <div className="font-bold text-sm text-neutral-100">{char.skillName}</div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{char.skillDescription}</p>
                </div>

                {/* Ultimate */}
                <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase">Elemental Burst [R]</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Cost: {char.ultimateEnergyCost} Energy</span>
                  </div>
                  <div className="font-bold text-sm text-neutral-100">{char.ultimateName}</div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{char.ultimateDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
