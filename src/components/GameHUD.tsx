/**
 * Aetheria: Resonant Horizon - In-Game HUD & Combat UI Overlay
 * Strictly follows Design Specifications 53, 54, 57:
 * - Dark semi-transparent panels (Dark Charcoal #18181b / neutral-950)
 * - Accent: Cyan / Blue (#38bdf8 / #06b6d4)
 * - Rare: Purple (#a855f7)
 * - Legendary: Gold (#f59e0b)
 * - Danger: Red (#ef4444)
 * - Top Left: Player name, Level, Health bar, Stamina bar, Active Status Effects
 * - Top Right: Mini-map/compass, Location name, Tracking quest objective, Navigation
 * - Bottom Center/Right: Primary Attack, Skill 1, Skill 2 (Ultimate), Dodge, Consumable quick-slot
 * - Bottom Left: Notification feed & Party status
 * - Damage Numbers: Color-coded (White normal, Yellow/Gold crit, Element colors)
 */

import React, { useState, useEffect } from "react";
import {
  PlayableCharacter,
  FloatingDamage,
  ActiveElementalReaction,
  WorldTimeState,
  Quest,
  EmoteType,
  GameItem,
} from "../types/game";
import {
  Sparkles,
  Swords,
  Wind,
  Shield,
  Compass,
  MapPin,
  Volume2,
  VolumeX,
  BookOpen,
  Backpack,
  User,
  FlaskConical,
  Brain,
  Settings,
  Flame,
  Zap,
  BookMarked,
  Trophy,
  ShoppingBag,
  Coins,
  Camera,
  Terminal,
  Smile,
  Heart,
  Droplet,
  Layers,
} from "lucide-react";

interface GameHUDProps {
  party: PlayableCharacter[];
  activeCharIndex: number;
  playerStats: {
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
    energy: number;
    maxEnergy: number;
  };
  currency?: number;
  astralPrisms?: number;
  worldTime: WorldTimeState;
  activeQuest: Quest | null;
  interactPrompt: string | null;
  onInteract: () => void;
  onSwitchCharacter: (index: number) => void;
  onTriggerAttack: () => void;
  onTriggerSkill: () => void;
  onTriggerUltimate: () => void;
  onTriggerDodge: () => void;
  onTriggerEmote?: (emote: EmoteType) => void;
  quickConsumable?: GameItem | null;
  onUseQuickConsumable?: () => void;
  onOpenModal: (
    modal:
      | "character"
      | "inventory"
      | "quest"
      | "crafting"
      | "oracle"
      | "map"
      | "settings"
      | "archive"
      | "achievement"
      | "shop"
      | "photo"
      | "debug"
  ) => void;
  bossState: { name: string; hp: number; maxHp: number; phase: number; isVulnerable: boolean } | null;
  floatingDamages: FloatingDamage[];
  activeReactions: ActiveElementalReaction[];
  notifications: { id: string; text: string; type?: string }[];
  minimapData: {
    playerPos: [number, number];
    playerRot: number;
    entities: { id: string; type: "enemy" | "npc" | "chest" | "waystone" | "node"; pos: [number, number]; name: string }[];
  };
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  party,
  activeCharIndex,
  playerStats,
  currency = 0,
  astralPrisms = 0,
  worldTime,
  activeQuest,
  interactPrompt,
  onInteract,
  onSwitchCharacter,
  onTriggerAttack,
  onTriggerSkill,
  onTriggerUltimate,
  onTriggerDodge,
  onTriggerEmote,
  quickConsumable,
  onUseQuickConsumable,
  onOpenModal,
  bossState,
  floatingDamages,
  activeReactions,
  notifications,
  minimapData,
  isMuted,
  onToggleMute,
}) => {
  const [showEmoteMenu, setShowEmoteMenu] = useState(false);
  const activeChar = party[activeCharIndex] || party[0];

  const hpPct = Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100));
  const staPct = Math.max(0, Math.min(100, (playerStats.stamina / playerStats.maxStamina) * 100));
  const ultPct = Math.max(0, Math.min(100, (playerStats.energy / activeChar.ultimateEnergyCost) * 100));
  const isUltReady = playerStats.energy >= activeChar.ultimateEnergyCost;

  // Listen for Quick Consumable [Tab] or [4]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab" || e.code === "Digit4") {
        if (onUseQuickConsumable) {
          e.preventDefault();
          onUseQuickConsumable();
        }
      } else if (e.code === "KeyX") {
        setShowEmoteMenu((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUseQuickConsumable]);

  // Determine current location name from coordinates
  const px = minimapData.playerPos[0];
  const pz = minimapData.playerPos[1];
  let locationName = "Sunvale Reach • Meadowlands";
  if (Math.sqrt(px * px + pz * pz) < 26) {
    locationName = "Sunvale Reach • Village Square";
  } else if (Math.sqrt(Math.pow(px + 65, 2) + Math.pow(pz - 60, 2)) < 42) {
    locationName = "Sunvale Reach • Caldera Arena";
  } else if (Math.sqrt(Math.pow(px - 55, 2) + Math.pow(pz + 45, 2)) < 35) {
    locationName = "Sunvale Reach • Aether Glade";
  } else if (Math.sqrt(Math.pow(px + 45, 2) + Math.pow(pz + 50, 2)) < 35) {
    locationName = "Sunvale Reach • Highland Overlook";
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 overflow-hidden font-sans">
      {/* ========================================================= */}
      {/* 1. TOP HEADER SECTION */}
      {/* ========================================================= */}
      <div className="flex items-start justify-between w-full gap-4">
        {/* TOP LEFT: Player Name, Level, Health Bar, Stamina Bar, Status Effects (Req 54) */}
        <div className="flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
          {/* Main Status Panel */}
          <div className="bg-[#18181b]/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 shadow-xl shadow-black/40">
            {/* Header: Avatar, Name, Level, Element */}
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md border border-white/20 relative overflow-hidden"
                style={{ backgroundColor: activeChar.avatarColor }}
              >
                {activeChar.name[0]}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-100 truncate tracking-wide">
                    {activeChar.name}
                  </span>
                  <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                    Lv. {activeChar.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {activeChar.element} Resonance
                  </span>
                </div>
              </div>
            </div>

            {/* Health Bar with numeric indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  HP
                </span>
                <span className="font-bold text-neutral-200">
                  {playerStats.hp} <span className="text-neutral-500">/</span> {playerStats.maxHp}
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-200"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* Stamina Bar */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5 text-amber-400" />
                  Stamina
                </span>
                <span className="text-amber-300 font-semibold">{Math.round(playerStats.stamina)}</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/80">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-150"
                  style={{ width: `${staPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Status Effects (Req 54) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-[#18181b]/85 border border-cyan-500/40 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[11px] text-cyan-300 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Aether Attunement</span>
            </div>
            {playerStats.hp < playerStats.maxHp * 0.3 && (
              <div className="bg-[#18181b]/85 border border-rose-500/60 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[11px] text-rose-400 shadow-md animate-pulse">
                <Shield className="w-3 h-3 text-rose-400" />
                <span>Low Health</span>
              </div>
            )}
            {isUltReady && (
              <div className="bg-[#18181b]/85 border border-amber-400/60 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[11px] text-amber-300 shadow-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Burst Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP CENTER: Boss Arena Health Bar (Req 50 & 54) */}
        {bossState && (
          <div className="flex-1 max-w-lg mx-auto pointer-events-auto">
            <div className="bg-[#18181b]/95 backdrop-blur-md border border-rose-600/50 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="font-bold text-xs tracking-wider text-rose-200 uppercase">
                    {bossState.name}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    Phase {bossState.phase}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-300">
                  {bossState.hp} / {bossState.maxHp}
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-rose-900/60 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-rose-500 to-red-600 rounded-full transition-all duration-300"
                  style={{ width: `${(bossState.hp / bossState.maxHp) * 100}%` }}
                />
              </div>
              {bossState.isVulnerable && (
                <div className="mt-1.5 text-center text-xs font-black text-amber-300 tracking-widest uppercase animate-bounce">
                  ⚡ STAGGERED! VULNERABLE TO 200% CRITICAL DAMAGE! ⚡
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOP RIGHT: Mini-map / Compass, Location name, Pinned Quest, Quick Menu (Req 54) */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Quick Menu, Currencies & World Clock Bar */}
          <div className="flex items-center gap-2">
            {/* Currencies */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="bg-[#18181b]/90 border border-amber-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-amber-300 font-mono font-bold shadow-md">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{currency.toLocaleString()}</span>
              </div>
              <div className="bg-[#18181b]/90 border border-purple-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-purple-300 font-mono font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{astralPrisms.toLocaleString()}</span>
              </div>
            </div>

            {/* World Clock & Weather */}
            <div className="bg-[#18181b]/90 border border-neutral-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs shadow-md">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="font-mono font-bold text-neutral-100">
                  {String(Math.floor(worldTime.hour)).padStart(2, "0")}:{String(worldTime.minute).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-neutral-400 ml-1.5">{worldTime.weather}</span>
              </div>
            </div>

            {/* Navigation Modal Icons */}
            <div className="flex items-center gap-1 bg-[#18181b]/90 border border-neutral-800 rounded-xl p-1 shadow-md">
              <button
                onClick={() => onOpenModal("character")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="Character Roster [C]"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("inventory")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="Inventory & Gear [B]"
              >
                <Backpack className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("quest")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="Quest Journal [J]"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("crafting")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="Alchemy & Hearth [K]"
              >
                <FlaskConical className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("archive")}
                className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/50 rounded-lg transition-all"
                title="World Archive & Bestiary [Y]"
              >
                <BookMarked className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("achievement")}
                className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-amber-950/50 rounded-lg transition-all"
                title="Achievements [U]"
              >
                <Trophy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("shop")}
                className="p-1.5 text-purple-400 hover:text-purple-200 hover:bg-purple-950/50 rounded-lg transition-all"
                title="Astral Hub [P]"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("oracle")}
                className="p-1.5 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/50 rounded-lg transition-all"
                title="Aether Oracle [O]"
              >
                <Brain className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("map")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="World Map [M]"
              >
                <MapPin className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("photo")}
                className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 rounded-lg transition-all"
                title="Photo Studio [F]"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenModal("debug")}
                className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/50 rounded-lg transition-all"
                title="Developer Console [~]"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleMute}
                className="p-1.5 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-all"
                title="Toggle Sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => onOpenModal("settings")}
                className="p-1.5 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-all"
                title="Settings & Saves [ESC]"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini-Map / Radar & Current Location Name (Req 54) */}
          <div className="flex items-start gap-3">
            {/* Tracking Quest Objective Pinned Card (Req 54) */}
            {activeQuest && (
              <div className="bg-[#18181b]/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 max-w-xs shadow-xl text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                    {activeQuest.category === "Main Story" ? "Main Quest" : activeQuest.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-100 mb-1.5">{activeQuest.title}</h4>
                <div className="space-y-1 text-[11px] text-neutral-300">
                  {activeQuest.objectives.map((obj) => (
                    <div key={obj.id} className="flex items-center justify-between gap-3">
                      <span className={obj.completed ? "line-through text-neutral-500" : ""}>
                        {obj.description}
                      </span>
                      <span className="text-cyan-400 font-mono font-semibold">
                        {obj.currentCount}/{obj.targetCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Circular Mini-Map Radar (Req 54) */}
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-36 rounded-full border-2 border-cyan-500/50 bg-[#18181b]/95 backdrop-blur-md shadow-2xl shadow-cyan-950/40 overflow-hidden flex items-center justify-center">
                {/* North Indicator */}
                <div className="absolute top-1 text-[10px] font-black text-cyan-400 tracking-wider">N</div>

                {/* Radar Grid Circles */}
                <div className="absolute inset-3 rounded-full border border-cyan-500/15" />
                <div className="absolute inset-8 rounded-full border border-cyan-500/15" />

                {/* Player Heading Needle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                  style={{ transform: `translate(-50%, -50%) rotate(${minimapData.playerRot + Math.PI}rad)` }}
                >
                  ▲
                </div>

                {/* Entity Blips */}
                {minimapData.entities.map((e) => {
                  const relX = (e.pos[0] - minimapData.playerPos[0]) * 1.1;
                  const relY = (e.pos[1] - minimapData.playerPos[1]) * 1.1;
                  const dist = Math.sqrt(relX * relX + relY * relY);
                  if (dist > 55) return null;

                  const color =
                    e.type === "enemy"
                      ? "bg-rose-500 shadow-rose-500/80"
                      : e.type === "npc"
                      ? "bg-sky-400 shadow-sky-400/80"
                      : e.type === "chest"
                      ? "bg-amber-400 shadow-amber-400/80"
                      : "bg-emerald-400 shadow-emerald-400/80";

                  return (
                    <div
                      key={e.id}
                      className={`absolute w-2 h-2 rounded-full ${color} shadow-[0_0_6px] -translate-x-1/2 -translate-y-1/2`}
                      style={{
                        left: `calc(50% + ${relX}px)`,
                        top: `calc(50% + ${relY}px)`,
                      }}
                      title={e.name}
                    />
                  );
                })}
              </div>

              {/* Location Badge (Req 54) */}
              <div className="mt-1.5 bg-[#18181b]/90 border border-neutral-800 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-cyan-200 tracking-wide shadow-md">
                {locationName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CENTER SCREEN NOTIFICATIONS & INTERACT PROMPT */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* Interaction Banner */}
        {interactPrompt && (
          <button
            onClick={onInteract}
            className="pointer-events-auto bg-[#18181b]/95 hover:bg-neutral-900 border-2 border-cyan-400 text-cyan-200 font-bold px-6 py-2.5 rounded-full shadow-[0_0_24px_rgba(56,189,248,0.5)] tracking-wide text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            {interactPrompt}
          </button>
        )}

        {/* Floating Damage Numbers (Req 57) */}
        <div className="relative w-0 h-0">
          {floatingDamages.map((dmg) => {
            // Req 57 Color Coding:
            // White: normal
            // Yellow/Orange: crit
            // Elemental: element color
            let colorClass = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]";
            if (dmg.isCrit) {
              colorClass = "text-amber-300 text-2xl font-black scale-125 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]";
            } else if (dmg.element === "Ember") {
              colorClass = "text-rose-400 font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]";
            } else if (dmg.element === "Tide") {
              colorClass = "text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]";
            } else if (dmg.element === "Volt") {
              colorClass = "text-purple-400 font-black drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]";
            } else if (dmg.element === "Gale") {
              colorClass = "text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]";
            } else if (dmg.element === "Stone") {
              colorClass = "text-amber-400 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]";
            }

            return (
              <div
                key={dmg.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 font-sans animate-fade-up pointer-events-none select-none ${colorClass}`}
              >
                {dmg.reactionName && (
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-400 drop-shadow-md">
                    {dmg.reactionName}
                  </div>
                )}
                {dmg.amount}
              </div>
            );
          })}
        </div>

        {/* Reaction Popups */}
        <div className="space-y-1 text-center">
          {activeReactions.map((reac) => (
            <div
              key={reac.id}
              className="text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full bg-[#18181b]/95 border border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-bounce"
            >
              ⚡ {reac.name} — {reac.description} ⚡
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BOTTOM SECTION */}
      {/* ========================================================= */}
      <div className="flex items-end justify-between w-full gap-4">
        {/* BOTTOM LEFT: Chat / Notification Feed & Party Status (Req 54) */}
        <div className="flex flex-col gap-3 max-w-sm w-full">
          {/* Subtle Notification Feed (Req 54) */}
          <div className="flex flex-col gap-1.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-[#18181b]/90 backdrop-blur-md border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 shadow-md flex items-center gap-2 animate-fade-in"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>{n.text}</span>
              </div>
            ))}
          </div>

          {/* Party Status Cards [1, 2, 3] (Req 54) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {party.map((char, idx) => {
              const isActive = idx === activeCharIndex;
              const charHpPct = Math.max(0, Math.min(100, (char.stats.hp / char.stats.maxHp) * 100));

              return (
                <button
                  key={char.id}
                  onClick={() => onSwitchCharacter(idx)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-left shadow-lg ${
                    isActive
                      ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.35)] scale-105"
                      : "bg-[#18181b]/90 hover:bg-neutral-800 border-neutral-800 text-neutral-400"
                  }`}
                  title={`Switch to ${char.name} [${idx + 1}]`}
                >
                  {/* Hotkey Number */}
                  <span className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Character Avatar */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-inner relative overflow-hidden"
                    style={{ backgroundColor: char.avatarColor }}
                  >
                    {char.name[0]}
                    {/* Element badge indicator */}
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400" />
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="text-[11px] font-bold text-neutral-100 truncate">{char.name}</div>
                    <div className="w-12 h-1 bg-neutral-900 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${charHpPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CENTER / RIGHT: Combat Action Hotkeys & Consumable Quick-Slot (Req 54) */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Quick Consumable Slot (Req 54: Consumable quick-slot) */}
          <div className="relative">
            <button
              onClick={() => onUseQuickConsumable && onUseQuickConsumable()}
              className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b]/95 hover:bg-neutral-900 border border-neutral-700/80 shadow-xl text-neutral-200 transition-all active:scale-95"
              title={
                quickConsumable
                  ? `Use ${quickConsumable.name} [Tab / 4]`
                  : "Consumable Quick-Slot [Tab / 4]"
              }
            >
              <FlaskConical className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold text-neutral-400 mt-0.5">Tab</span>
              {quickConsumable && quickConsumable.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-emerald-400 shadow">
                  {quickConsumable.count}
                </span>
              )}
            </button>
          </div>

          {/* Primary Attack (Req 54) */}
          <button
            onClick={onTriggerAttack}
            className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b]/95 hover:bg-neutral-900 border border-neutral-700/80 shadow-xl text-neutral-200 transition-all active:scale-95"
            title="Primary Attack Combo [L-Click]"
          >
            <Swords className="w-5 h-5 text-neutral-100 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-neutral-400 mt-0.5">L-Click</span>
          </button>

          {/* Dodge / Dash (Req 54) */}
          <button
            onClick={onTriggerDodge}
            className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b]/95 hover:bg-neutral-900 border border-neutral-700/80 shadow-xl text-neutral-200 transition-all active:scale-95"
            title="Dodge / Dash [Space / R-Click]"
          >
            <Wind className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-neutral-400 mt-0.5">R-Click</span>
          </button>

          {/* Skill 1 (Req 54) */}
          <button
            onClick={onTriggerSkill}
            className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b]/95 hover:bg-neutral-900 border border-neutral-700/80 shadow-xl text-neutral-200 transition-all active:scale-95"
            title={`${activeChar.skillName} [Q]`}
          >
            <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-neutral-400 mt-0.5">Q</span>
          </button>

          {/* Skill 2 / Ultimate Burst (Req 54) */}
          <button
            onClick={onTriggerUltimate}
            className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-2xl transition-all active:scale-95 ${
              isUltReady
                ? "bg-gradient-to-tr from-amber-600 via-rose-600 to-purple-600 border-amber-300 text-white shadow-[0_0_24px_rgba(245,158,11,0.7)] animate-pulse"
                : "bg-[#18181b]/95 border-neutral-700 text-neutral-500"
            }`}
            title={`${activeChar.ultimateName} [R]`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[9px] font-bold mt-0.5 tracking-wider uppercase">
              {isUltReady ? "READY" : "BURST"}
            </span>
            {/* Energy Ring Indicator */}
            <div
              className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 pointer-events-none"
              style={{ opacity: isUltReady ? 1 : ultPct / 100 }}
            />
          </button>

          {/* Emote Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmoteMenu(!showEmoteMenu)}
              className={`flex flex-col items-center justify-center w-11 h-14 rounded-2xl border transition-all active:scale-95 ${
                showEmoteMenu
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-[#18181b]/95 hover:bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200"
              }`}
              title="Emote & Pose Menu [X]"
            >
              <Smile className="w-4 h-4" />
              <span className="text-[8px] font-bold mt-0.5">X</span>
            </button>

            {/* Emote Popover Menu */}
            {showEmoteMenu && (
              <div className="absolute bottom-16 right-0 bg-[#18181b]/95 border border-cyan-500/40 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-32 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="text-[10px] font-bold text-neutral-400 px-2 py-1 uppercase tracking-wider border-b border-neutral-800">
                  Expressions
                </div>
                {[
                  { id: "wave", label: "Wave" },
                  { id: "victory", label: "Victory" },
                  { id: "dance", label: "Dance" },
                  { id: "sit", label: "Rest / Sit" },
                  { id: "bow", label: "Bow" },
                  { id: "laugh", label: "Laugh" },
                ].map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      if (onTriggerEmote) onTriggerEmote(e.id as EmoteType);
                      setShowEmoteMenu(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-cyan-200 hover:bg-cyan-950/50 text-left transition-all"
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
