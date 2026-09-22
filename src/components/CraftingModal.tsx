/**
 * Aetheria: Resonant Horizon - Alchemy & Cooking Hearth
 */

import React, { useState } from "react";
import { CraftingRecipe, CraftingIngredient, GameItem } from "../types/game";
import { X, FlaskConical, Sparkles, Check } from "lucide-react";
import { audio } from "../game/audio";

interface CraftingModalProps {
  recipes: CraftingRecipe[];
  inventory: GameItem[];
  onCraftRecipe: (recipe: CraftingRecipe) => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  recipes,
  inventory,
  onCraftRecipe,
  onClose,
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || "");
  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];

  const getItemCount = (itemId: string) => {
    return inventory.find((i) => i.id === itemId)?.count || 0;
  };

  const canCraft = selectedRecipe?.ingredients.every(
    (ing: CraftingIngredient) => getItemCount(ing.itemId) >= ing.count
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              Sunvale Alchemy & Hearth
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Recipes List */}
          <div className="w-72 border-r border-neutral-800 p-4 space-y-2 bg-neutral-900/20 overflow-y-auto">
            {recipes.map((r) => {
              const isSelected = r.id === selectedRecipeId;
              const craftable = r.ingredients.every((ing: CraftingIngredient) => getItemCount(ing.itemId) >= ing.count);
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRecipeId(r.id);
                    audio.playCollectSound();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 shadow-md"
                      : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800 text-neutral-400"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-neutral-100">{r.name}</div>
                    <div className="text-[10px] text-cyan-400 uppercase">{r.category}</div>
                  </div>
                  {craftable ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-neutral-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Recipe Details & Crafting Action */}
          {selectedRecipe && (
            <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase font-semibold text-cyan-400 tracking-wider">
                    {selectedRecipe.category}
                  </div>
                  <h3 className="text-2xl font-black text-neutral-100 mt-1">{selectedRecipe.name}</h3>
                  <p className="text-sm text-neutral-300 mt-2 leading-relaxed bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                    {selectedRecipe.description}
                  </p>
                </div>

                {/* Required Ingredients */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                    Required Reagents
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRecipe.ingredients.map((ing: CraftingIngredient) => {
                      const current = getItemCount(ing.itemId);
                      const hasEnough = current >= ing.count;
                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-semibold text-neutral-200">
                              {ing.itemId.replace("mat_", "").replace(/_/g, " ")}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-mono font-bold ${
                              hasEnough ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {current} / {ing.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Brew Action */}
              <div className="pt-4 border-t border-neutral-800">
                <button
                  disabled={!canCraft}
                  onClick={() => {
                    onCraftRecipe(selectedRecipe);
                    audio.playFanfare();
                  }}
                  className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FlaskConical className="w-4 h-4" />
                  {canCraft ? `Synthesize ${selectedRecipe.name}` : "Missing Reagents"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
