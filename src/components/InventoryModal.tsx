/**
 * Aetheria: Resonant Horizon - Bag & Inventory System
 * Strictly adheres to Design Specification 53 & 55:
 * - Clean grid layout
 * - Dark semi-transparent panels (Dark Charcoal #18181b / neutral-950)
 * - Categories: All, Weapons, Armor, Consumables, Materials, Quest Items
 * - Hover / select preview: Item name, Rarity color, Stats, Description, Sell / Use buttons
 */

import React, { useState } from "react";
import { GameItem, ItemType } from "../types/game";
import { X, Backpack, Sparkles, Swords, Shield, Heart, Check, Coins, BookOpen, Layers } from "lucide-react";
import { audio } from "../game/audio";

interface InventoryModalProps {
  items: GameItem[];
  currency: number;
  onUseItem: (item: GameItem) => void;
  onEquipItem: (item: GameItem) => void;
  onSellItem?: (item: GameItem, price: number) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  items,
  currency,
  onUseItem,
  onEquipItem,
  onSellItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "weapon" | "armor" | "consumable" | "material" | "quest">("all");
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(items[0] || null);

  const getItemCategory = (item: GameItem): "weapon" | "armor" | "material" | "consumable" | "quest" => {
    if (item.category === "quest" || item.id.startsWith("quest_")) return "quest";
    if (item.category) return item.category as any;
    if (item.type === ItemType.WEAPON) return "weapon";
    if (item.type === ItemType.EQUIPMENT) return "armor";
    if (item.type === ItemType.MATERIAL) return "material";
    if (item.type === ItemType.CONSUMABLE) return "consumable";
    return "material";
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return getItemCategory(item) === activeTab;
  });

  const getRarityBadge = (rarity: number) => {
    switch (rarity) {
      case 5:
        return {
          border: "border-amber-400/80",
          bg: "bg-amber-950/20",
          text: "text-amber-400",
          label: "Legendary",
        };
      case 4:
        return {
          border: "border-purple-400/80",
          bg: "bg-purple-950/20",
          text: "text-purple-400",
          label: "Rare",
        };
      case 3:
        return {
          border: "border-cyan-400/80",
          bg: "bg-cyan-950/20",
          text: "text-cyan-300",
          label: "Aetherial",
        };
      case 2:
        return {
          border: "border-emerald-400/80",
          bg: "bg-emerald-950/20",
          text: "text-emerald-300",
          label: "Fine",
        };
      default:
        return {
          border: "border-neutral-700",
          bg: "bg-neutral-900/40",
          text: "text-neutral-300",
          label: "Common",
        };
    }
  };

  const selectedCategory = selectedItem ? getItemCategory(selectedItem) : "material";
  const rarityInfo = selectedItem ? getRarityBadge(selectedItem.rarity) : getRarityBadge(1);
  const atkBonus = selectedItem?.stats?.atk || selectedItem?.statBonus?.atk;
  const defBonus = selectedItem?.stats?.def || selectedItem?.statBonus?.def;
  const hpBonus = selectedItem?.stats?.hp || selectedItem?.buffEffect?.value;
  const sellPrice = selectedItem ? (selectedItem.rarity || 1) * 35 : 25;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto font-sans">
      <div className="w-full max-w-4xl bg-[#18181b]/95 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Backpack className="w-5 h-5 text-cyan-400" />
              Inventory & Pouch
            </h2>
            <div className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{currency.toLocaleString()} Aether Shards</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters (Req 55 Categories: All, Weapons, Armor, Consumables, Materials, Quest Items) */}
        <div className="flex border-b border-neutral-800/80 bg-neutral-900/40 px-6 pt-2 overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "weapon", label: "Weapons" },
            { id: "armor", label: "Armor" },
            { id: "consumable", label: "Consumables" },
            { id: "material", label: "Materials" },
            { id: "quest", label: "Quest Items" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                audio.playButtonClickSound();
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
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
          {/* Items Grid (Req 55) */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                No items in this category
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const category = getItemCategory(item);
                  const badge = getRarityBadge(item.rarity);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        audio.playCollectSound();
                      }}
                      className={`relative aspect-square rounded-2xl border p-2 flex flex-col items-center justify-between transition-all ${
                        isSelected
                          ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105 bg-cyan-950/40 shadow-xl"
                          : `${badge.border} ${badge.bg} hover:scale-102 hover:border-cyan-500/40`
                      }`}
                    >
                      {/* Count badge */}
                      {item.count > 1 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-md bg-[#18181b]/90 text-[10px] font-mono text-neutral-200 border border-neutral-700">
                          x{item.count}
                        </span>
                      )}

                      <div className="flex-1 flex items-center justify-center">
                        {category === "weapon" ? (
                          <Swords className="w-7 h-7 text-neutral-200" />
                        ) : category === "armor" ? (
                          <Shield className="w-7 h-7 text-neutral-200" />
                        ) : category === "consumable" ? (
                          <Heart className="w-7 h-7 text-emerald-400" />
                        ) : category === "quest" ? (
                          <BookOpen className="w-7 h-7 text-amber-400" />
                        ) : (
                          <Sparkles className="w-7 h-7 text-cyan-300" />
                        )}
                      </div>

                      <div className="w-full text-center">
                        <div className="text-[11px] font-bold truncate text-neutral-200">{item.name}</div>
                        <div className="text-[9px] text-amber-400">{"★".repeat(item.rarity)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Inspector & Action Preview Panel (Req 55: Hover/select preview, Item name, Rarity color, Stats, Description, Sell / Use buttons) */}
          {selectedItem && (
            <div className="w-80 border-l border-neutral-800/80 p-6 flex flex-col justify-between bg-neutral-900/40 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex flex-col items-center p-4 rounded-2xl bg-[#18181b]/80 border border-neutral-800">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 mb-2 shadow-inner">
                    {selectedCategory === "weapon" ? (
                      <Swords className="w-8 h-8" />
                    ) : selectedCategory === "armor" ? (
                      <Shield className="w-8 h-8" />
                    ) : selectedCategory === "consumable" ? (
                      <Heart className="w-8 h-8 text-emerald-400" />
                    ) : selectedCategory === "quest" ? (
                      <BookOpen className="w-8 h-8 text-amber-400" />
                    ) : (
                      <Sparkles className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-neutral-100 text-center tracking-wide">
                    {selectedItem.name}
                  </h3>

                  {/* Rarity & Category Pill */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityInfo.border} ${rarityInfo.bg} ${rarityInfo.text}`}>
                      {rarityInfo.label}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-800">
                      {selectedCategory}
                    </span>
                  </div>
                </div>

                {/* Combat Attributes / Stats (Req 55) */}
                {(atkBonus || defBonus || hpBonus) && (
                  <div className="p-3 bg-[#18181b]/80 rounded-2xl border border-neutral-800 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Item Attributes
                    </div>
                    {atkBonus && (
                      <div className="text-xs font-semibold text-rose-300 flex justify-between">
                        <span>ATK Power</span>
                        <span className="font-mono">+{atkBonus}</span>
                      </div>
                    )}
                    {defBonus && (
                      <div className="text-xs font-semibold text-sky-300 flex justify-between">
                        <span>Defense</span>
                        <span className="font-mono">+{defBonus}</span>
                      </div>
                    )}
                    {hpBonus && (
                      <div className="text-xs font-semibold text-emerald-300 flex justify-between">
                        <span>HP Effect</span>
                        <span className="font-mono">+{hpBonus}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lore / Description (Req 55) */}
                <div className="text-xs text-neutral-300 leading-relaxed bg-[#18181b]/60 p-3.5 rounded-2xl border border-neutral-800/80">
                  {selectedItem.description}
                </div>
              </div>

              {/* Action Buttons: Sell / Use / Equip (Req 55) */}
              <div className="pt-4 space-y-2">
                {selectedCategory === "consumable" && (
                  <button
                    onClick={() => {
                      onUseItem(selectedItem);
                      audio.playCollectSound();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Use Item
                  </button>
                )}

                {(selectedCategory === "weapon" || selectedCategory === "armor") && (
                  <button
                    onClick={() => {
                      onEquipItem(selectedItem);
                      audio.playFanfare();
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Equip to Character
                  </button>
                )}

                {/* Sell Button (Req 55) - Quest items cannot be sold */}
                {selectedCategory !== "quest" && (
                  <button
                    onClick={() => {
                      if (onSellItem) {
                        onSellItem(selectedItem, sellPrice);
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-amber-300 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    Sell for {sellPrice} Shards
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
