/**
 * Aetheria: Resonant Horizon - Cinematic NPC Dialogue & Relationship System
 */

import React, { useState } from "react";
import { NPCData, GameItem, NPCRelationship } from "../types/game";
import { MessageSquare, ArrowRight, X, Heart, Gift, Sparkles, BookOpen } from "lucide-react";

interface DialogueBoxProps {
  npc: NPCData;
  relationship?: NPCRelationship;
  inventory?: GameItem[];
  onSelectOption: (option: { label: string; response: string; action?: string; questId?: string }) => void;
  onGiveGift?: (npcId: string, item: GameItem) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  npc,
  relationship,
  inventory = [],
  onSelectOption,
  onGiveGift,
  onClose,
}) => {
  const [currentText, setCurrentText] = useState(npc.dialogue.greeting);
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [giftSuccessMsg, setGiftSuccessMsg] = useState<string | null>(null);

  // Filter giftable items (materials and consumables)
  const giftableItems = inventory.filter(
    (item) => (item.type === "material" || item.type === "consumable") && item.count > 0
  );

  const affinity = relationship?.affinity ?? 20;
  const level = relationship?.level ?? "Stranger";

  const handleGiveGift = (item: GameItem) => {
    if (onGiveGift) {
      onGiveGift(npc.id, item);
      setGiftSuccessMsg(`Gifted ${item.name}! Affinity with ${npc.name} increased!`);
      setCurrentText(
        `"Oh, is this for me? How wonderfully thoughtful of you! Thank you, traveler!"`
      );
      setShowGiftDrawer(false);
      setTimeout(() => setGiftSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 bg-black/40 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-3xl mx-4 bg-neutral-950/95 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
        {/* Header with NPC Name, Role & Relationship Level */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-900/60 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-200 text-lg shadow-inner">
              {npc.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-100">{npc.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                  {level} ({affinity}%)
                </span>
              </div>
              <p className="text-xs text-cyan-400 tracking-wide">{npc.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGiveGift && (
              <button
                onClick={() => setShowGiftDrawer(!showGiftDrawer)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-rose-500/40 rounded-xl text-xs font-medium text-rose-300 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Gift className="w-3.5 h-3.5 text-rose-400" />
                <span>{showGiftDrawer ? "Hide Gifts" : "Offer Gift"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gift Success Notification */}
        {giftSuccessMsg && (
          <div className="bg-rose-950/40 border border-rose-500/50 p-2.5 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>{giftSuccessMsg}</span>
          </div>
        )}

        {/* Gift Selector Drawer */}
        {showGiftDrawer && (
          <div className="bg-neutral-900/80 border border-rose-500/30 rounded-xl p-3 flex flex-col gap-2">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              <span>Select an item from your pack to gift {npc.name}:</span>
            </div>
            {giftableItems.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-2">
                No giftable flora, elixirs, or crystals in your inventory.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pt-1">
                {giftableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleGiveGift(item)}
                    className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-400/50 rounded-lg text-left transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-neutral-200 font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-neutral-400">Qty: {item.count}</div>
                    </div>
                    <Heart className="w-3.5 h-3.5 text-rose-400/60" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dialogue Body */}
        <div className="min-h-[70px] text-neutral-200 text-sm leading-relaxed font-sans bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
          <p>{currentText}</p>
        </div>

        {/* Unlocked Confidant Lore (if relationship level > stranger) */}
        {relationship && relationship.unlockedLore && relationship.unlockedLore.length > 0 && (
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Confidant Lore: </span>
              {relationship.unlockedLore[0]}
            </div>
          </div>
        )}

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
