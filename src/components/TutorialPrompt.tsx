/**
 * Aetheria: Resonant Horizon - Dynamic In-World Natural Tutorial Prompt
 */

import React from "react";
import { TutorialStep } from "../types/game";
import { Compass, CheckCircle2, Award, Sparkles, X } from "lucide-react";

interface TutorialPromptProps {
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  allCompleted: boolean;
  onDismiss: () => void;
}

export const TutorialPrompt: React.FC<TutorialPromptProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  allCompleted,
  onDismiss,
}) => {
  if (allCompleted) {
    return (
      <div className="absolute top-20 left-6 z-30 max-w-sm w-full bg-gradient-to-r from-neutral-950/95 to-cyan-950/90 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Tutorial Complete!
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <h4 className="text-sm font-bold text-neutral-100">Initiate of the Horizon</h4>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
          You have mastered core locomotion, resonant combat, and world exploration. Go forth and unveil the ancient mysteries of Aetheria!
        </p>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="absolute top-20 left-6 z-30 max-w-sm w-full bg-neutral-950/90 border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md pointer-events-auto transition-all animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Top Step Counter & Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
            Guide Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
          title="Minimize tutorial"
        >
          Skip Guide
        </button>
      </div>

      {/* Title & Keycap Hint */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-neutral-100">{currentStep.title}</h4>
          <p className="text-xs text-neutral-300 mt-1 leading-snug">{currentStep.instruction}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1 bg-neutral-900 border border-cyan-500/50 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-cyan-300 shadow-inner">
          {currentStep.keyHint}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-neutral-800/50">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < stepIndex
                ? "bg-emerald-400"
                : i === stepIndex
                ? "bg-cyan-400 animate-pulse"
                : "bg-neutral-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
