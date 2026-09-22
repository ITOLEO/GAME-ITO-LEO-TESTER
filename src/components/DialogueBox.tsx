/**
 * Aetheria: Resonant Horizon - Cinematic NPC Dialogue System
 */

import React from "react";
import { NPCData } from "../types/game";
import { MessageSquare, ArrowRight, X } from "lucide-react";

interface DialogueBoxProps {
  npc: NPCData;
  onSelectOption: (option: { label: string; response: string; action?: string; questId?: string }) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ npc, onSelectOption, onClose }) => {
  const [currentText, setCurrentText] = React.useState(npc.dialogue.greeting);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 bg-black/40 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-3xl mx-4 bg-neutral-950/95 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col gap-4">
        {/* Header with NPC Name & Role */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-200 text-lg shadow-inner">
              {npc.name[0]}
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">{npc.name}</h3>
              <p className="text-xs text-cyan-400 tracking-wide">{npc.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialogue Body */}
        <div className="min-h-[70px] text-neutral-200 text-sm leading-relaxed font-sans bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
          <p>{currentText}</p>
        </div>

        {/* Player Response Choices */}
        <div className="flex flex-col gap-2 pt-1">
          {npc.dialogue.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentText(opt.response);
                onSelectOption(opt);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/90 hover:bg-cyan-950/70 border border-neutral-800 hover:border-cyan-500/60 text-sm text-neutral-200 hover:text-cyan-200 transition-all text-left group"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400 opacity-70 group-hover:opacity-100" />
                {opt.label}
              </span>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
