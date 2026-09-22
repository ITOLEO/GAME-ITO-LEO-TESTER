/**
 * Aetheria: Resonant Horizon - Bag & Inventory System
 */

import React, { useState } from "react";
import { GameItem, ItemType } from "../types/game";
import { X, Backpack, Sparkles, Swords, Shield, Heart, Check } from "lucide-react";
import { audio } from "../game/audio";

interface InventoryModalProps {
  items: GameItem[];
  currency: number;
  onUseItem: (item: GameItem) => void;
  onEquipItem: (item: GameItem) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  items,
  currency,
  onUseItem,
  onEquipItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "weapon" | "armor" | "material" | "consumable">("all");
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(items[0] || null);

  const getItemCategory = (item: GameItem): "weapon" | "armor" | "material" | "consumable" | "other" => {
    if (item.category) return item.category;
    if (item.type === ItemType.WEAPON) return "weapon";
    if (item.type === ItemType.EQUIPMENT) return "armor";
    if (item.type === ItemType.MATERIAL) return "material";
    if (item.type === ItemType.CONSUMABLE) return "consumable";
    return "other";
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return getItemCategory(item) === activeTab;
  });

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5:
        return "border-amber-400/80 bg-amber-950/20 text-amber-300";
      case 4:
        return "border-purple-400/80 bg-purple-950/20 text-purple-300";
      case 3:
        return "border-cyan-400/80 bg-cyan-950/20 text-cyan-300";
      case 2:
        return "border-emerald-400/80 bg-emerald-950/20 text-emerald-300";
      default:
        return "border-neutral-700 bg-neutral-900/40 text-neutral-300";
    }
  };

  const selectedCategory = selectedItem ? getItemCategory(selectedItem) : "other";
  const atkBonus = selectedItem?.stats?.atk || selectedItem?.statBonus?.atk;
  const defBonus = selectedItem?.stats?.def || selectedItem?.statBonus?.def;
  const hpBonus = selectedItem?.stats?.hp || selectedItem?.buffEffect?.value;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-4xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Backpack className="w-5 h-5 text-cyan-400" />
              Traveler's Pouch & Equipment
            </h2>
            <div className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
              ✦ {currency.toLocaleString()} Aether Shards
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-6 pt-2">
          {[
            { id: "all", label: "All Items" },
            { id: "weapon", label: "Weapons" },
            { id: "armor", label: "Artifacts" },
            { id: "consumable", label: "Consumables" },
            { id: "material", label: "Materials" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                audio.playButtonClickSound();
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Items Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const category = getItemCategory(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      audio.playCollectSound();
                    }}
                    className={`relative aspect-square rounded-xl border p-2 flex flex-col items-center justify-between transition-all ${
                      isSelected
                        ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105 bg-cyan-950/30 shadow-lg"
                        : `${getRarityColor(item.rarity)} hover:scale-102`
                    }`}
                  >
                    {/* Item count badge */}
                    {item.count > 1 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-neutral-950/80 text-[10px] font-mono text-neutral-200">
                        x{item.count}
                      </span>
                    )}

                    <div className="flex-1 flex items-center justify-center">
                      {category === "weapon" ? (
                        <Swords className="w-8 h-8 opacity-90" />
                      ) : category === "armor" ? (
                        <Shield className="w-8 h-8 opacity-90" />
                      ) : category === "consumable" ? (
                        <Heart className="w-8 h-8 opacity-90" />
                      ) : (
                        <Sparkles className="w-8 h-8 opacity-90" />
                      )}
                    </div>

                    <div className="w-full text-center">
                      <div className="text-[11px] font-bold truncate text-neutral-200">{item.name}</div>
                      <div className="text-[9px] text-amber-300">{"★".repeat(item.rarity)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Inspector Panel */}
          {selectedItem && (
            <div className="w-72 border-l border-neutral-800 p-6 flex flex-col justify-between bg-neutral-900/30 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex flex-col items-center p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 mb-2">
                    {selectedCategory === "weapon" ? (
                      <Swords className="w-8 h-8" />
                    ) : selectedCategory === "armor" ? (
                      <Shield className="w-8 h-8" />
                    ) : selectedCategory === "consumable" ? (
                      <Heart className="w-8 h-8" />
                    ) : (
                      <Sparkles className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-neutral-100 text-center">{selectedItem.name}</h3>
                  <div className="text-xs text-amber-400 mt-0.5">{"★".repeat(selectedItem.rarity)}</div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 mt-1 px-2 py-0.5 rounded bg-neutral-800">
                    {selectedCategory}
                  </span>
                </div>

                {/* Stats / Effects */}
                {(atkBonus || defBonus || hpBonus) && (
                  <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Combat Attributes</div>
                    {atkBonus && (
                      <div className="text-xs font-semibold text-rose-300 flex justify-between">
                        <span>ATK Power</span>
                        <span>+{atkBonus}</span>
                      </div>
                    )}
                    {defBonus && (
                      <div className="text-xs font-semibold text-blue-300 flex justify-between">
                        <span>Defense</span>
                        <span>+{defBonus}</span>
                      </div>
                    )}
                    {hpBonus && (
                      <div className="text-xs font-semibold text-emerald-300 flex justify-between">
                        <span>Health Restore</span>
                        <span>+{hpBonus}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lore / Description */}
                <div className="text-xs text-neutral-300 leading-relaxed font-sans bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/60">
                  {selectedItem.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                {selectedCategory === "consumable" && (
                  <button
                    onClick={() => onUseItem(selectedItem)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Use / Consume Item
                  </button>
                )}
                {(selectedCategory === "weapon" || selectedCategory === "armor") && (
                  <button
                    onClick={() => onEquipItem(selectedItem)}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Equip to Active Character
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
