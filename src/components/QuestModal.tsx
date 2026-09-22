/**
 * Aetheria: Resonant Horizon - Quest Journal & Objective Tracker
 * Strictly adheres to Design Specifications 53 & 56:
 * - Clean quest log: Main quests, Side quests, Active objectives, Rewards, Track button
 * - Dark semi-transparent panels (Dark Charcoal #18181b / neutral-950)
 * - Accent: Cyan / Blue (#38bdf8 / #06b6d4)
 * - Gold for legend/currency rewards, clean modern sans-serif
 */

import React, { useState } from "react";
import { Quest } from "../types/game";
import { X, BookOpen, CheckCircle2, Circle, Gift, Compass, Sparkles, ChevronRight } from "lucide-react";
import { audio } from "../game/audio";

interface QuestModalProps {
  quests: Quest[];
  activeQuestId: string;
  onTrackQuest: (questId: string) => void;
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quests,
  activeQuestId,
  onTrackQuest,
  onClaimQuest,
  onClose,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "Main Story" | "Side Quest">("all");
  const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || quests[0]?.id || "");

  const filteredQuests = quests.filter((q) => {
    if (filterTab === "all") return true;
    return q.category === filterTab;
  });

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || filteredQuests[0] || quests[0];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto font-sans">
      <div className="w-full max-w-4xl bg-[#18181b]/95 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Quest Log & Chronicles
            </h2>
            <span className="text-xs text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
              {quests.filter((q) => q.status === "completed").length} / {quests.length} Completed
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters (Req 56: Main quests, Side quests) */}
        <div className="flex border-b border-neutral-800/80 bg-neutral-900/30 px-6 pt-2">
          {[
            { id: "all", label: "All Quests" },
            { id: "Main Story", label: "Main Quests" },
            { id: "Side Quest", label: "Side Quests" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterTab(tab.id as any);
                audio.playButtonClickSound();
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                filterTab === tab.id
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Quest List */}
          <div className="w-72 border-r border-neutral-800/80 p-4 space-y-2.5 bg-neutral-900/20 overflow-y-auto">
            {filteredQuests.map((q) => {
              const isSelected = q.id === selectedQuest?.id;
              const isTracked = q.id === activeQuestId;
              const isMain = q.category === "Main Story";

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestId(q.id);
                    audio.playButtonClickSound();
                  }}
                  className={`w-full flex flex-col gap-1 p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/40"
                      : "bg-[#18181b]/80 hover:bg-neutral-900 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        isMain
                          ? "bg-amber-950/70 border border-amber-600/40 text-amber-300"
                          : "bg-cyan-950/70 border border-cyan-600/40 text-cyan-300"
                      }`}
                    >
                      {isMain ? "Main Quest" : "Side Quest"}
                    </span>
                    {q.status === "completed" ? (
                      <span className="text-[10px] text-emerald-400 font-bold">COMPLETED</span>
                    ) : isTracked ? (
                      <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                        <Compass className="w-3 h-3" /> TRACKED
                      </span>
                    ) : null}
                  </div>
                  <div className="font-bold text-sm text-neutral-100 mt-1">{q.title}</div>
                  <div className="text-xs text-neutral-400">Chapter {q.chapter}</div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Quest Details & Active Objectives */}
          {selectedQuest && (
            <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                        selectedQuest.category === "Main Story"
                          ? "bg-amber-950/70 border border-amber-500/50 text-amber-300"
                          : "bg-cyan-950/70 border border-cyan-500/50 text-cyan-300"
                      }`}
                    >
                      {selectedQuest.category === "Main Story" ? "Main Quest" : "Side Quest"}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      Chapter {selectedQuest.chapter}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-neutral-100 mt-2 tracking-wide">
                    {selectedQuest.title}
                  </h3>

                  <p className="text-sm text-neutral-300 mt-2.5 leading-relaxed bg-[#18181b]/70 p-4 rounded-2xl border border-neutral-800">
                    {selectedQuest.description}
                  </p>
                </div>

                {/* Active Objectives (Req 56) */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                    Active Objectives
                  </h4>
                  <div className="space-y-2">
                    {selectedQuest.objectives.map((obj) => (
                      <div
                        key={obj.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          obj.completed
                            ? "bg-neutral-900/40 border-neutral-800 text-neutral-500"
                            : "bg-[#18181b]/80 border-neutral-800 text-neutral-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {obj.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              obj.completed ? "line-through text-neutral-500" : "text-neutral-200 font-medium"
                            }`}
                          >
                            {obj.description}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {obj.currentCount} / {obj.targetCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards (Req 56) */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" /> Quest Rewards
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-[#18181b]/80 rounded-2xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Adventure EXP</div>
                      <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                        +{selectedQuest.rewards.exp}
                      </div>
                    </div>
                    <div className="p-3.5 bg-[#18181b]/80 rounded-2xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Aether Shards</div>
                      <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                        +{selectedQuest.rewards.currency}
                      </div>
                    </div>
                    <div className="p-3.5 bg-[#18181b]/80 rounded-2xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Materials</div>
                      <div className="text-xs font-bold text-purple-300 mt-1 truncate">
                        {selectedQuest.rewards.items?.map((i) => `${i.item.name} x${i.count}`).join(", ") ||
                          "Aether Shards"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Track Button (Req 56) */}
              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                {selectedQuest.status !== "completed" && (
                  <button
                    onClick={() => {
                      onTrackQuest(selectedQuest.id);
                      audio.playCollectSound();
                    }}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      selectedQuest.id === activeQuestId
                        ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    {selectedQuest.id === activeQuestId ? "Currently Tracked" : "Track This Quest"}
                  </button>
                )}

                {selectedQuest.status === "completed" && (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl bg-neutral-900 border border-emerald-500/30 text-emerald-400 font-bold text-sm cursor-default flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Rewards Claimed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
