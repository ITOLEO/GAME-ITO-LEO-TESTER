/**
 * Aetheria: Resonant Horizon - Astral Hub & Monetization Architecture
 * Requirements: 59. Economy, 60. Monetization Architecture (Cosmetics, Invocations, Leyline Pass, fair gameplay)
 */

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Crown,
  ShieldCheck,
  Feather,
  RefreshCw,
  Gift,
  Coins,
  ArrowRight,
  Flame,
} from "lucide-react";
import { audio } from "../game/audio";

interface ShopModalProps {
  currency: number;
  astralPrisms: number;
  eventEmbers: number;
  onExchangePrisms: (amount: number) => void;
  onPerformWish: (count: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  currency,
  astralPrisms,
  eventEmbers,
  onExchangePrisms,
  onPerformWish,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"wish" | "battlepass" | "wardrobe" | "exchange">("wish");
  const [wishHistory, setWishHistory] = useState<string[]>([]);
  const [pityCount, setPityCount] = useState<number>(14);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleWish = (count: number) => {
    const cost = count * 160;
    if (astralPrisms < cost) {
      setErrorBanner("Insufficient Astral Prisms! Complete quests and achievements to gather more.");
      setTimeout(() => setErrorBanner(null), 3500);
      return;
    }
    setErrorBanner(null);
    audio.playCollectSound();
    onPerformWish(count);
    setPityCount((prev) => (prev + count) % 90);

    const pullPool = [
      "4★ Zephyr's Gale Crest (Artifact)",
      "4★ Obsidian Greatsword",
      "3★ Aether Forged Broadsword",
      "3★ Sunvale Longbow",
      "5★ Starlight Primordial Catalyst (Legendary!)",
      "3★ Crystallized Aether Chunk (x5)",
      "4★ Pyroclasm Ring of Ember",
      "3★ Alchemical Restorative Draught (x3)",
    ];

    const newPulls: string[] = [];
    for (let i = 0; i < count; i++) {
      const is5Star = Math.random() < 0.05 || pityCount + i >= 80;
      if (is5Star) {
        newPulls.push("🌟 5★ Zephyr - The Frostbloom Resonator!");
      } else {
        newPulls.push(pullPool[Math.floor(Math.random() * pullPool.length)]);
      }
    }
    setWishHistory(newPulls);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-5xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header with Currencies */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Astral Exchange & Leyline Hub
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              Fair Play Guarantee: No Pay-to-Win
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {currency.toLocaleString()} Shards
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {astralPrisms.toLocaleString()} Prisms
            </div>
            <div className="px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              {eventEmbers.toLocaleString()} Embers
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-6 pt-2">
          {[
            { id: "wish", label: "Astral Invocations", icon: Sparkles },
            { id: "battlepass", label: "Leyline Chronicle (Pass)", icon: Crown },
            { id: "wardrobe", label: "Glider & Cosmetics", icon: Feather },
            { id: "exchange", label: "Shard Exchange", icon: RefreshCw },
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
                    ? "border-purple-400 text-purple-300"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {errorBanner && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center justify-between">
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Astral Invocations */}
        {activeTab === "wish" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Banner Card */}
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/50 bg-gradient-to-r from-purple-950/80 via-neutral-900/90 to-cyan-950/80 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-900/80 border border-purple-400 text-purple-200">
                    Featured Resonance Event
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">Ends in: 14 Days</span>
                </div>
                <h3 className="text-2xl font-black text-neutral-100 tracking-wide">
                  Tidal Bloom: Zephyr of the Silent Waters
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  Attune your astral focus to summon rare 4★ and 5★ aether weapons and character resonances.
                  Guaranteed 4★ or higher item every 10 Invocations.
                </p>
                <div className="text-[11px] font-mono text-purple-300 flex items-center gap-2">
                  <span>Pity Counter: {pityCount} / 90 pulls to guaranteed 5★</span>
                </div>
              </div>

              {/* Wish Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleWish(1)}
                  className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-purple-500/50 text-purple-200 font-bold text-xs shadow-md transition-all active:scale-95 flex flex-col items-center"
                >
                  <span>1x Invocation</span>
                  <span className="text-[10px] text-purple-400 font-mono">160 Prisms</span>
                </button>
                <button
                  onClick={() => handleWish(10)}
                  className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex flex-col items-center"
                >
                  <span>10x Invocations</span>
                  <span className="text-[10px] text-purple-200 font-mono">1,600 Prisms</span>
                </button>
              </div>
            </div>

            {/* Results Area */}
            {wishHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Latest Invocation Manifestation
                  </h4>
                  <button
                    onClick={() => setWishHistory([])}
                    className="text-[10px] text-neutral-400 hover:text-neutral-200"
                  >
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {wishHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 flex items-center gap-2 animate-fadeIn"
                    >
                      <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Leyline Chronicle (Battle Pass) */}
        {activeTab === "battlepass" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Season 1 Chronicle</span>
                <h3 className="text-lg font-black text-neutral-100">The Whispering Glade Expedition</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Complete daily bounties and weekly boss hunts to unlock tier rewards.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 font-mono">Chronicle Level</span>
                <div className="text-2xl font-black text-amber-300">Lv. 12 / 50</div>
              </div>
            </div>

            {/* Reward Tiers Showcase */}
            <div className="space-y-3">
              {[
                { level: 5, free: "500x Aether Shards", gnostic: "50x Astral Prisms + 4★ Catalyst" },
                { level: 10, free: "3x Vitality Elixirs", gnostic: "100x Astral Prisms + Glider Skin" },
                { level: 20, free: "1,000x Aether Shards", gnostic: "Heart of Ignis + 200x Prisms" },
                { level: 30, free: "10x Aether Crystal Fragments", gnostic: "5★ Weapon Selector Chest" },
              ].map((tier) => (
                <div key={tier.level} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-amber-300 text-sm">
                      Lv.{tier.level}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">
                        Free Track: <span className="text-cyan-300">{tier.free}</span>
                      </div>
                      <div className="text-xs font-semibold text-purple-300 mt-0.5">
                        Gnostic Pass: <span>{tier.gnostic}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300">
                    Unlocked
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Glider & Cosmetics */}
        {activeTab === "wardrobe" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Traveler Glider Wings & Aesthetic Customizations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Wings of the First Zephyr", type: "Glider Wings", color: "text-cyan-400", desc: "Default aetherial glider crafted by Elder Thorne. Graceful teal plumage." },
                { name: "Wings of the Obsidian Drake", type: "Glider Wings", color: "text-rose-400", desc: "Forged with heat-resistant vulcanite feathers. Emits subtle ember trails." },
                { name: "Starlit Astral Veil", type: "Glider Wings", color: "text-purple-400", desc: "Woven from cosmic dust captured at celestial altitudes. Radiant violet glow." },
              ].map((cosmetic, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cosmetic.color}`}>{cosmetic.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{cosmetic.type}</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{cosmetic.desc}</p>
                  </div>
                  <button className="w-full py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all">
                    Equip Visual Appearance
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Shard & Prism Exchange */}
        {activeTab === "exchange" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="max-w-lg mx-auto p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" /> In-Game Currency Conversion
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Convert your hard-earned Aether Shards into Astral Prisms to invoke characters and weapons, or vice versa.
                No real-money purchase required.
              </p>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-200">500 Aether Shards</div>
                  <div className="text-[10px] text-neutral-400 font-mono">Gameplay Currency</div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-purple-300">50 Astral Prisms</div>
                  <div className="text-[10px] text-neutral-400 font-mono">Invocation Gem</div>
                </div>
              </div>

              <button
                onClick={() => onExchangePrisms(50)}
                disabled={currency < 500}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Convert 500 Shards ➔ 50 Prisms
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
