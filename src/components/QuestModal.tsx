/**
 * Aetheria: Resonant Horizon - Quest Journal & Objective Tracker
 */

import React, { useState } from "react";
import { Quest } from "../types/game";
import { X, BookOpen, CheckCircle2, Circle, Gift, Compass } from "lucide-react";
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
  const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || quests[0]?.id || "");
  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || quests[0];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Quest Journal & Chronicles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest List & Details */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Quest List */}
          <div className="w-72 border-r border-neutral-800 p-4 space-y-2 bg-neutral-900/20 overflow-y-auto">
            {quests.map((q) => {
              const isSelected = q.id === selectedQuestId;
              const isTracked = q.id === activeQuestId;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestId(q.id);
                    audio.playButtonClickSound();
                  }}
                  className={`w-full flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-md"
                      : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400">{q.category}</span>
                    {q.status === "completed" ? (
                      <span className="text-[10px] text-emerald-400 font-bold">COMPLETED</span>
                    ) : isTracked ? (
                      <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                        <Compass className="w-3 h-3" /> TRACKED
                      </span>
                    ) : null}
                  </div>
                  <div className="font-bold text-sm text-neutral-100">{q.title}</div>
                  <div className="text-xs text-neutral-400">Chapter {q.chapter}</div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Quest Details */}
          {selectedQuest && (
            <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
                    {selectedQuest.category} • Chapter {selectedQuest.chapter}
                  </div>
                  <h3 className="text-2xl font-black text-neutral-100 mt-1">{selectedQuest.title}</h3>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                    {selectedQuest.description}
                  </p>
                </div>

                {/* Objectives */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Objectives</h4>
                  <div className="space-y-2">
                    {selectedQuest.objectives.map((obj) => (
                      <div
                        key={obj.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800"
                      >
                        <div className="flex items-center gap-3">
                          {obj.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${obj.completed ? "line-through text-neutral-500" : "text-neutral-200"}`}>
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

                {/* Rewards */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" /> Rewards
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Adventure EXP</div>
                      <div className="text-base font-bold text-cyan-300">+{selectedQuest.rewards.exp}</div>
                    </div>
                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Aether Shards</div>
                      <div className="text-base font-bold text-amber-300">+{selectedQuest.rewards.currency}</div>
                    </div>
                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-center">
                      <div className="text-xs text-neutral-400">Materials</div>
                      <div className="text-xs font-bold text-purple-300 mt-1">
                        {selectedQuest.rewards.items?.map((i) => `${i.item.name} x${i.count}`).join(", ") || "None"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                {selectedQuest.status !== "completed" && (
                  <button
                    onClick={() => {
                      onTrackQuest(selectedQuest.id);
                      audio.playCollectSound();
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      selectedQuest.id === activeQuestId
                        ? "bg-neutral-800 text-neutral-400 cursor-default"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    {selectedQuest.id === activeQuestId ? "Currently Tracked" : "Track This Quest"}
                  </button>
                )}

                {selectedQuest.status === "completed" && (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-xl bg-neutral-800 text-emerald-400 font-bold text-sm cursor-default flex items-center justify-center gap-2"
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
