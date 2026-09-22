/**
 * Aetheria: Resonant Horizon - In-Game HUD & Combat UI Overlay
 */

import React from "react";
import {
  PlayableCharacter,
  FloatingDamage,
  ActiveElementalReaction,
  WorldTimeState,
  Quest,
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
  onOpenModal: (modal: "character" | "inventory" | "quest" | "crafting" | "oracle" | "map" | "settings" | "archive" | "achievement" | "shop") => void;
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
  onOpenModal,
  bossState,
  floatingDamages,
  activeReactions,
  notifications,
  minimapData,
  isMuted,
  onToggleMute,
}) => {
  const activeChar = party[activeCharIndex] || party[0];
  const hpPct = Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100));
  const staPct = Math.max(0, Math.min(100, (playerStats.stamina / playerStats.maxStamina) * 100));
  const ultPct = Math.max(0, Math.min(100, (playerStats.energy / activeChar.ultimateEnergyCost) * 100));
  const isUltReady = playerStats.energy >= activeChar.ultimateEnergyCost;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 overflow-hidden">
      {/* 1. TOP BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Mini-map & Coordinates */}
        <div className="flex items-start gap-3">
          <div className="relative w-36 h-36 rounded-full border-2 border-cyan-400/50 bg-neutral-950/80 backdrop-blur-md shadow-lg shadow-cyan-950/50 overflow-hidden flex items-center justify-center pointer-events-auto">
            {/* North marker */}
            <div className="absolute top-1 text-[10px] font-bold text-cyan-400 tracking-wider">N</div>

            {/* Minimap canvas simulation */}
            <div className="relative w-full h-full">
              {/* Radar Grid Circles */}
              <div className="absolute inset-3 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-8 rounded-full border border-cyan-500/20" />

              {/* Player Arrow at center */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-cyan-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
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
                    ? "bg-blue-400 shadow-blue-400/80"
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

            {/* Region Label */}
            <div className="absolute bottom-1 bg-black/60 px-2 py-0.5 rounded text-[9px] text-cyan-200 tracking-wide">
              Sunvale Reach
            </div>
          </div>

          {/* Active Quest Pinned Card */}
          {activeQuest && (
            <div className="pointer-events-auto bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 rounded-xl p-3 max-w-xs shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                  {activeQuest.category}
                </span>
              </div>
              <h4 className="text-sm font-bold text-neutral-100 mb-1">{activeQuest.title}</h4>
              <div className="space-y-1 text-xs text-neutral-300">
                {activeQuest.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center justify-between gap-3">
                    <span className={obj.completed ? "line-through text-neutral-500" : ""}>{obj.description}</span>
                    <span className="text-cyan-400 font-mono">
                      {obj.currentCount}/{obj.targetCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top-Center: Boss Bar (if active) */}
        {bossState && (
          <div className="flex-1 max-w-xl mx-6">
            <div className="bg-neutral-950/90 backdrop-blur-md border border-red-500/40 rounded-xl p-3 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="font-bold text-sm tracking-wide text-red-100 uppercase">{bossState.name}</span>
                </div>
                <span className="text-xs font-mono text-red-300">
                  {bossState.hp} / {bossState.maxHp}
                </span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-red-950 relative">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 via-red-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${(bossState.hp / bossState.maxHp) * 100}%` }}
                />
              </div>
              {bossState.isVulnerable && (
                <div className="mt-1.5 text-center text-xs font-bold text-amber-300 tracking-widest uppercase animate-bounce">
                  ⚡ STAGGERED! VULNERABLE TO 200% CRITICAL DAMAGE! ⚡
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top-Right: Quick Action Menu & Clock */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Currencies Bar */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="bg-neutral-950/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-amber-300 font-mono font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{currency.toLocaleString()}</span>
            </div>
            <div className="bg-neutral-950/80 backdrop-blur-md border border-purple-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-purple-300 font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{astralPrisms.toLocaleString()}</span>
            </div>
          </div>

          {/* World Clock & Weather */}
          <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <div>
              <div className="font-semibold text-neutral-100">
                {String(Math.floor(worldTime.hour)).padStart(2, "0")}:{String(worldTime.minute).padStart(2, "0")}
              </div>
              <div className="text-[10px] text-cyan-300">{worldTime.weather}</div>
            </div>
          </div>

          {/* Nav Modals */}
          <button
            onClick={() => onOpenModal("character")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Character Roster [C]"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("inventory")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Inventory & Gear [B]"
          >
            <Backpack className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("quest")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Quest Journal [J]"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("crafting")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Alchemy & Hearth [K]"
          >
            <FlaskConical className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("archive")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-cyan-400 transition-all active:scale-95"
            title="World Archive & Bestiary [Y]"
          >
            <BookMarked className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("achievement")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-amber-400 transition-all active:scale-95"
            title="Achievements [U]"
          >
            <Trophy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("shop")}
            className="p-2.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 rounded-xl text-purple-300 transition-all active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            title="Astral Invocations & Hub [P]"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("oracle")}
            className="p-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded-xl text-cyan-300 transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            title="Ancient Aether Oracle [O]"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenModal("map")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="World Map [M]"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => onOpenModal("settings")}
            className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 transition-all active:scale-95"
            title="Settings & Saves [ESC]"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER SCREEN NOTIFICATIONS & INTERACT PROMPT */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* Interaction Banner */}
        {interactPrompt && (
          <button
            onClick={onInteract}
            className="pointer-events-auto bg-neutral-950/90 hover:bg-neutral-900 border-2 border-cyan-400/80 text-cyan-200 font-bold px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.4)] tracking-wide text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            {interactPrompt}
          </button>
        )}

        {/* Floating Damage Numbers */}
        <div className="relative w-0 h-0">
          {floatingDamages.map((dmg) => (
            <div
              key={dmg.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 font-black text-xl animate-fade-up pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                dmg.isCrit
                  ? "text-amber-300 text-2xl scale-125"
                  : dmg.element === "Ember"
                  ? "text-red-400"
                  : dmg.element === "Volt"
                  ? "text-violet-400"
                  : dmg.element === "Gale"
                  ? "text-emerald-400"
                  : "text-white"
              }`}
            >
              {dmg.reactionName && <div className="text-xs uppercase tracking-wider text-orange-300">{dmg.reactionName}</div>}
              {dmg.amount}
            </div>
          ))}
        </div>

        {/* Reaction Popups */}
        <div className="space-y-1 text-center">
          {activeReactions.map((reac) => (
            <div
              key={reac.id}
              className="text-sm font-black tracking-widest uppercase px-4 py-1 rounded-full bg-black/60 border border-orange-400/50 text-orange-300 animate-bounce"
            >
              ⚡ {reac.name} — {reac.description} ⚡
            </div>
          ))}
        </div>
      </div>

      {/* 3. BOTTOM SECTION */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Notification Feed */}
        <div className="flex flex-col gap-1.5 max-w-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-neutral-950/85 backdrop-blur-md border border-neutral-700/60 rounded-lg px-3 py-1.5 text-xs text-neutral-200 shadow-md flex items-center gap-2 animate-fade-in"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{n.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom-Center: Active Character Health, Stamina & Energy */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full">
          {/* Health Bar */}
          <div className="w-full bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 rounded-xl p-3 shadow-xl">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-neutral-100 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeChar.avatarColor }} />
                {activeChar.name} - Lv.{activeChar.level}
              </span>
              <span className="font-mono text-cyan-300">
                {playerStats.hp} / {playerStats.maxHp}
              </span>
            </div>
            {/* HP Fill */}
            <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-200"
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* Stamina Bar */}
            <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
                style={{ width: `${staPct}%` }}
              />
            </div>
          </div>

          {/* Combat Hotkeys Dock */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Left Click: Attack */}
            <button
              onClick={onTriggerAttack}
              className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 shadow-lg text-neutral-200 transition-all active:scale-95"
              title="Normal Attack Combo [L-Click]"
            >
              <Swords className="w-6 h-6 text-neutral-100 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-neutral-400 mt-0.5">L-Click</span>
            </button>

            {/* Right Click: Dodge */}
            <button
              onClick={onTriggerDodge}
              className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 shadow-lg text-neutral-200 transition-all active:scale-95"
              title="Dodge Roll [R-Click]"
            >
              <Wind className="w-6 h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-neutral-400 mt-0.5">R-Click</span>
            </button>

            {/* Q: Character Skill */}
            <button
              onClick={onTriggerSkill}
              className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 shadow-lg text-neutral-200 transition-all active:scale-95"
              title={`${activeChar.skillName} [Q]`}
            >
              <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-neutral-400 mt-0.5">Q</span>
            </button>

            {/* R: Ultimate Burst */}
            <button
              onClick={onTriggerUltimate}
              className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-xl transition-all active:scale-95 ${
                isUltReady
                  ? "bg-gradient-to-tr from-amber-600 to-rose-600 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse"
                  : "bg-neutral-900/90 border-neutral-700/80 text-neutral-500"
              }`}
              title={`${activeChar.ultimateName} [R]`}
            >
              <Sparkles className="w-7 h-7" />
              <span className="text-[10px] font-bold mt-0.5">R - BURST</span>
              {/* Radial Energy Gauge */}
              <div
                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 pointer-events-none"
                style={{ opacity: isUltReady ? 1 : ultPct / 100 }}
              />
            </button>
          </div>
        </div>

        {/* Bottom-Right: Party Switching Deck (1, 2, 3) */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {party.map((char, idx) => {
            const isActive = idx === activeCharIndex;
            return (
              <button
                key={char.id}
                onClick={() => onSwitchCharacter(idx)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left ${
                  isActive
                    ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-105"
                    : "bg-neutral-950/80 hover:bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                {/* Hotkey number */}
                <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-200 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                {/* Avatar Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                  style={{ backgroundColor: char.avatarColor }}
                >
                  {char.name[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-100">{char.name}</div>
                  <div className="text-[10px] text-neutral-400">{char.element}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
