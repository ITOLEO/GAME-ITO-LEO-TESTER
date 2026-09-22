/**
 * Aetheria: Resonant Horizon - World Archive (Bestiary, Codex & Flora)
 * Requirements: 56. Collection System, 57. Bestiary, 58. Codex / Lore
 */

import React, { useState } from "react";
import { BestiaryEntry, CodexLoreEntry, AetherElement, Faction } from "../types/game";
import {
  X,
  BookOpen,
  Skull,
  Scroll,
  Sparkles,
  ShieldAlert,
  Flame,
  Droplets,
  Wind,
  Zap,
  Mountain,
  Leaf,
  CheckCircle2,
  Lock,
  Compass,
  Shield,
  Award,
} from "lucide-react";
import { audio } from "../game/audio";

interface ArchiveModalProps {
  bestiary: BestiaryEntry[];
  codex: CodexLoreEntry[];
  factions?: Faction[];
  onClose: () => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  bestiary,
  codex,
  factions = [],
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"bestiary" | "codex" | "factions" | "flora">("bestiary");

  // Bestiary State
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(bestiary[0]?.id || "");
  const [bestiaryFilter, setBestiaryFilter] = useState<string>("All");

  // Codex State
  const [selectedCodexId, setSelectedCodexId] = useState<string>(codex[0]?.id || "");
  const [codexCategory, setCodexCategory] = useState<string>("All");

  const selectedEnemy = bestiary.find((b) => b.id === selectedEnemyId) || bestiary[0];
  const selectedCodex = codex.find((c) => c.id === selectedCodexId) || codex[0];

  const filteredBestiary = bestiary.filter((b) => {
    if (bestiaryFilter === "All") return true;
    return b.category === bestiaryFilter;
  });

  const filteredCodex = codex.filter((c) => {
    if (codexCategory === "All") return true;
    return c.category === codexCategory;
  });

  const getElementBadge = (el: AetherElement) => {
    switch (el) {
      case AetherElement.EMBER:
        return { color: "text-rose-400 bg-rose-950/60 border-rose-600/40", icon: Flame };
      case AetherElement.TIDE:
        return { color: "text-sky-400 bg-sky-950/60 border-sky-600/40", icon: Droplets };
      case AetherElement.GALE:
        return { color: "text-teal-400 bg-teal-950/60 border-teal-600/40", icon: Wind };
      case AetherElement.VOLT:
        return { color: "text-purple-400 bg-purple-950/60 border-purple-600/40", icon: Zap };
      case AetherElement.STONE:
        return { color: "text-amber-400 bg-amber-950/60 border-amber-600/40", icon: Mountain };
      case AetherElement.BLOOM:
        return { color: "text-emerald-400 bg-emerald-950/60 border-emerald-600/40", icon: Leaf };
      default:
        return { color: "text-cyan-400 bg-cyan-950/60 border-cyan-600/40", icon: Sparkles };
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-5xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              World Archive & Codex
            </h2>
            <span className="text-xs text-neutral-400 font-mono">Sunvale Chronicles v1.2</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-6 pt-2">
          {[
            { id: "bestiary", label: "Bestiary & Entities", icon: Skull },
            { id: "codex", label: "Historical Codex & Lore", icon: Scroll },
            { id: "factions", label: "Factions & Alliances", icon: Shield },
            { id: "flora", label: "Flora & Ley Minerals", icon: Leaf },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  audio.playButtonClickSound();
                }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area: Bestiary */}
        {activeTab === "bestiary" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar list */}
            <div className="w-80 border-r border-neutral-800 p-4 flex flex-col gap-3 bg-neutral-900/20">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-neutral-800">
                {["All", "World Boss", "Wild Aetherling", "Automaton"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setBestiaryFilter(cat);
                      audio.playButtonClickSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      bestiaryFilter === cat
                        ? "bg-cyan-950 border border-cyan-500/80 text-cyan-300"
                        : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredBestiary.map((enemy) => {
                  const isSelected = enemy.id === selectedEnemy?.id;
                  const affinity = getElementBadge(enemy.element);
                  const Icon = affinity.icon;
                  return (
                    <button
                      key={enemy.id}
                      onClick={() => {
                        setSelectedEnemyId(enemy.id);
                        audio.playCollectSound();
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "bg-cyan-950/50 border-cyan-400 shadow-md scale-[1.01]"
                          : "bg-neutral-900/50 hover:bg-neutral-800/60 border-neutral-800 text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${affinity.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                            {enemy.name}
                            {enemy.category === "World Boss" && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-rose-950 border border-rose-600/50 text-rose-300">
                                BOSS
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">{enemy.title}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-cyan-400">
                          {"★".repeat(enemy.dangerLevel)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dossier Detail */}
            {selectedEnemy && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                <div className="flex items-start justify-between p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-cyan-300">
                        {selectedEnemy.category}
                      </span>
                      <span className="text-xs text-neutral-400">Habitat: {selectedEnemy.habitat}</span>
                    </div>
                    <h3 className="text-xl font-black text-neutral-100 mt-1">{selectedEnemy.name}</h3>
                    <p className="text-xs text-neutral-400 italic font-serif">{selectedEnemy.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-neutral-400 font-mono">Danger Rating</span>
                    <span className="text-sm font-bold text-amber-400 tracking-widest">
                      {"★".repeat(selectedEnemy.dangerLevel)}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Defeated: {selectedEnemy.defeatedCount} times
                    </span>
                  </div>
                </div>

                {/* Elemental Affinities Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                    <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Inherent Element</div>
                    <div className="flex items-center gap-2">
                      {React.createElement(getElementBadge(selectedEnemy.element).icon, {
                        className: "w-4 h-4 text-cyan-400",
                      })}
                      <span className="text-xs font-bold text-neutral-200">{selectedEnemy.element} Affinity</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                    <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Elemental Weakness</div>
                    <div className="flex items-center gap-2">
                      {React.createElement(getElementBadge(selectedEnemy.weakness).icon, {
                        className: "w-4 h-4 text-rose-400",
                      })}
                      <span className="text-xs font-bold text-rose-300">{selectedEnemy.weakness} Vulnerability</span>
                    </div>
                  </div>
                </div>

                {/* Lore Dossier */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Natural History & Lore</h4>
                  <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed font-sans">
                    {selectedEnemy.lore}
                  </div>
                </div>

                {/* Tactical Combat Advice */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Tactical Combat Strategy
                  </h4>
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
                    {selectedEnemy.combatTips}
                  </div>
                </div>

                {/* Drops */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Confirmed Drops</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnemy.drops.map((drop, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {drop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Area: Historical Codex */}
        {activeTab === "codex" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Category Filter & List */}
            <div className="w-80 border-r border-neutral-800 p-4 flex flex-col gap-3 bg-neutral-900/20">
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-neutral-800">
                {["All", "Factions", "Regions", "History", "Mysteries"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCodexCategory(cat);
                      audio.playButtonClickSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      codexCategory === cat
                        ? "bg-cyan-950 border border-cyan-500/80 text-cyan-300"
                        : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredCodex.map((entry) => {
                  const isSelected = entry.id === selectedCodex?.id;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSelectedCodexId(entry.id);
                        audio.playCollectSound();
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? "bg-cyan-950/50 border-cyan-400 shadow-md scale-[1.01]"
                          : "bg-neutral-900/50 hover:bg-neutral-800/60 border-neutral-800 text-neutral-300"
                      }`}
                    >
                      {entry.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-neutral-100">{entry.title}</div>
                        <div className="text-[10px] text-neutral-400 line-clamp-1">{entry.preview}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Codex Entry Detail */}
            {selectedCodex && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-cyan-300">
                      {selectedCodex.category}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Unlocked by: <strong className="text-neutral-200">{selectedCodex.unlockedBy}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-neutral-100 mt-2">{selectedCodex.title}</h3>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/30 border border-neutral-800/80 space-y-4">
                  <p className="text-sm text-neutral-200 leading-relaxed font-serif tracking-wide whitespace-pre-line">
                    {selectedCodex.unlocked
                      ? selectedCodex.content
                      : "This entry is currently sealed. Explore the Sunvale Highlands and investigate ancient ruins to decipher this record."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Area: Factions & Alliances */}
        {activeTab === "factions" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Regional Factions & Diplomatic Standing
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Earn reputation through quests, exploration, and aid to unlock blueprints, titles, and exclusive armaments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {factions.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                        style={{
                          borderColor: `${fac.bannerColor}60`,
                          backgroundColor: `${fac.bannerColor}15`,
                          color: fac.bannerColor,
                        }}
                      >
                        {fac.standing}
                      </div>
                      <span className="text-xs font-mono text-neutral-400">{fac.reputation} / 1000 Rep</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-neutral-100">{fac.name}</h4>
                      <div className="text-xs text-cyan-400 font-medium">{fac.title}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (fac.reputation / 1000) * 100)}%`,
                          backgroundColor: fac.bannerColor,
                        }}
                      />
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed font-sans pt-1">
                      {fac.description}
                    </p>

                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80 space-y-1 text-xs">
                      <div className="text-[11px] text-neutral-400">
                        <span className="font-bold text-neutral-300">Leader:</span> {fac.leader}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        <span className="font-bold text-neutral-300">HQ:</span> {fac.headquarters}
                      </div>
                      <div className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-900">
                        "{fac.philosophy}"
                      </div>
                    </div>
                  </div>

                  {/* Standing Milestones */}
                  <div className="border-t border-neutral-800/80 pt-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Faction Rewards
                    </span>
                    {fac.rewards.map((r, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                          r.unlocked
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            : "bg-neutral-950/50 border-neutral-800 text-neutral-500"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {r.unlocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                          )}
                          <span className="truncate">{r.rewardDesc}</span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0 ml-2">{r.standing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area: Flora & Minerals */}
        {activeTab === "flora" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Discovered Botanical & Geological Specimens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: "Sunvale Goldpetal",
                  type: "Flora",
                  color: "border-amber-500/40 bg-amber-950/20",
                  desc: "Fragrant golden petals bathed in coastal sunlight. Essential for brewing Vitality draughts and restoring stamina.",
                  location: "Sunvale Haven & River Meadows",
                },
                {
                  name: "Aether Crystal Cluster",
                  type: "Mineral",
                  color: "border-cyan-500/40 bg-cyan-950/20",
                  desc: "Luminescent mineral crystallizing along Ley Line faultlines. Catalyzes high-potency energy potions and weapon ascension.",
                  location: "Whispering Glade & Cave Entrances",
                },
                {
                  name: "Magma Basalt Ore",
                  type: "Volcanic Mineral",
                  color: "border-rose-500/40 bg-rose-950/20",
                  desc: "Sulfur-fused igneous rock extracted from the Caldera Foothills. Resists extreme temperatures and empowers fire cleaves.",
                  location: "Molten Caldera Perimeter",
                },
                {
                  name: "Verdant Dewdrop",
                  type: "Flora Extract",
                  color: "border-emerald-500/40 bg-emerald-950/20",
                  desc: "Morning condensation harvested from ancient moss. Amplifies Bloom elemental reactions and natural regeneration.",
                  location: "Forest Depths & Springs",
                },
                {
                  name: "Ancient Precursor Gear",
                  type: "Relic Material",
                  color: "border-purple-500/40 bg-purple-950/20",
                  desc: "Clockwork mechanism forged with non-corroding celestial bronze. Used by Blacksmith Gerald for artifact reforging.",
                  location: "Ruins of the First Beacon",
                },
                {
                  name: "Heart of Ignis",
                  type: "Boss Core",
                  color: "border-amber-400/80 bg-amber-950/40",
                  desc: "The pulsing, fiery core of the defeated Ignis-Titan. Infused with primordial heat, capable of unlocking 5-star weapon ascension.",
                  location: "Dropped by World Boss: Ignis-Titan",
                },
              ].map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${item.color} flex flex-col justify-between space-y-2`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-100">{item.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{item.type}</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 pt-2 border-t border-neutral-800">
                    <Compass className="w-3 h-3" /> {item.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
