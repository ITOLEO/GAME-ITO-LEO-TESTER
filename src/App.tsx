/**
 * Aetheria: Resonant Horizon - Master Application Entry Point
 * 3D Anime Open-World Action RPG
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ThreeEngine } from "./game/threeEngine";
import { audio } from "./game/audio";
import {
  INITIAL_CHARACTERS,
  INITIAL_ITEMS,
  INITIAL_QUESTS,
  INITIAL_NPCS,
  INITIAL_RECIPES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_BESTIARY,
  INITIAL_CODEX,
} from "./game/initialData";
import {
  PlayableCharacter,
  GameItem,
  Quest,
  NPCData,
  CraftingRecipe,
  CraftingIngredient,
  WorldTimeState,
  FloatingDamage,
  ActiveElementalReaction,
  ItemType,
  ItemRarity,
  Achievement,
  BestiaryEntry,
  CodexLoreEntry,
} from "./types/game";

import { GameHUD } from "./components/GameHUD";
import { DialogueBox } from "./components/DialogueBox";
import { CharacterModal } from "./components/CharacterModal";
import { InventoryModal } from "./components/InventoryModal";
import { QuestModal } from "./components/QuestModal";
import { CraftingModal } from "./components/CraftingModal";
import { OracleModal } from "./components/OracleModal";
import { WorldMapModal } from "./components/WorldMapModal";
import { SettingsModal } from "./components/SettingsModal";
import { CharacterCreator } from "./components/CharacterCreator";
import { ArchiveModal } from "./components/ArchiveModal";
import { AchievementModal } from "./components/AchievementModal";
import { ShopModal } from "./components/ShopModal";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // Core Game State
  const [party, setParty] = useState<PlayableCharacter[]>(() => {
    const saved = localStorage.getItem("aetheria_party");
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  const [inventory, setInventory] = useState<GameItem[]>(() => {
    const saved = localStorage.getItem("aetheria_inventory");
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  const [currency, setCurrency] = useState<number>(() => {
    const saved = localStorage.getItem("aetheria_currency");
    return saved ? Number(saved) : 650;
  });
  const [astralPrisms, setAstralPrisms] = useState<number>(() => {
    const saved = localStorage.getItem("aetheria_astral_prisms");
    return saved ? Number(saved) : 320;
  });
  const [eventEmbers, setEventEmbers] = useState<number>(() => {
    const saved = localStorage.getItem("aetheria_event_embers");
    return saved ? Number(saved) : 80;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem("aetheria_achievements");
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });
  const [bestiary, setBestiary] = useState<BestiaryEntry[]>(() => {
    const saved = localStorage.getItem("aetheria_bestiary");
    return saved ? JSON.parse(saved) : INITIAL_BESTIARY;
  });
  const [codex, setCodex] = useState<CodexLoreEntry[]>(() => {
    const saved = localStorage.getItem("aetheria_codex");
    return saved ? JSON.parse(saved) : INITIAL_CODEX;
  });

  const [graphicsQuality, setGraphicsQuality] = useState<"Low" | "Medium" | "High" | "Ultra">("High");
  const [screenShake, setScreenShake] = useState(true);

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem("aetheria_quests");
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });
  const [activeQuestId, setActiveQuestId] = useState<string>("quest_prologue");

  const [unlockedWaystones, setUnlockedWaystones] = useState<string[]>(() => {
    const saved = localStorage.getItem("aetheria_waystones");
    return saved ? JSON.parse(saved) : ["way_haven"];
  });

  // Player live stats (synced from engine)
  const [playerStats, setPlayerStats] = useState({
    hp: 1250,
    maxHp: 1250,
    stamina: 100,
    maxStamina: 100,
    energy: 40,
    maxEnergy: 100,
  });

  // World simulation
  const [worldTime, setWorldTime] = useState<WorldTimeState>({
    hour: 10,
    minute: 30,
    weather: "Sunny Breeze",
    timeMultiplier: 1.0,
  });

  // Visual & combat feedback
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const currentActionRef = useRef<(() => void) | undefined>(undefined);
  const [bossState, setBossState] = useState<{
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
    isVulnerable: boolean;
  } | null>(null);

  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [activeReactions, setActiveReactions] = useState<ActiveElementalReaction[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type?: string }[]>([]);

  const [minimapData, setMinimapData] = useState<{
    playerPos: [number, number];
    playerRot: number;
    entities: { id: string; type: "enemy" | "npc" | "chest" | "waystone" | "node"; pos: [number, number]; name: string }[];
  }>({
    playerPos: [0, 0],
    playerRot: 0,
    entities: [],
  });

  // Active Modals & Dialogues
  const [activeModal, setActiveModal] = useState<
    "character" | "inventory" | "quest" | "crafting" | "oracle" | "map" | "settings" | "archive" | "achievement" | "shop" | null
  >(null);
  const [activeNPC, setActiveNPC] = useState<NPCData | null>(null);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(() => {
    return !localStorage.getItem("aetheria_profile_created");
  });
  const [isMuted, setIsMuted] = useState(false);

  // Notification helper
  const addNotification = useCallback((text: string, type: "quest" | "level" | "item" | "boss" = "quest") => {
    const id = Math.random().toString();
    setNotifications((prev) => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // 1. Initialize 3D Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new ThreeEngine(containerRef.current, party[activeCharIndex], {
      onInteractPrompt: (prompt, action) => {
        setInteractPrompt(prompt);
        currentActionRef.current = action;
      },
      onPlayerStatsUpdate: (stats) => {
        setPlayerStats(stats);
      },
      onDamageNumber: (dmg) => {
        setFloatingDamages((prev) => [...prev.slice(-8), dmg]);
        setTimeout(() => {
          setFloatingDamages((prev) => prev.filter((d) => d.id !== dmg.id));
        }, 850);
      },
      onElementalReaction: (reaction) => {
        setActiveReactions((prev) => [...prev.slice(-2), reaction]);
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 2200);
      },
      onNotification: (text, type) => {
        addNotification(text, type);
      },
      onEnemyKilled: (enemyId, enemyName) => {
        // 1. Update Bestiary kills & discovery
        setBestiary((prev) =>
          prev.map((entry) => {
            const isMatch =
              (enemyId.startsWith("stalker") && entry.id === "best_stalker") ||
              (enemyId === "boss_titan" && entry.id === "best_pyro_titan") ||
              (enemyId.startsWith("automaton") && entry.id === "best_automaton") ||
              (enemyId.startsWith("slime") && entry.id === "best_slime");
            if (isMatch) {
              const newKills = entry.defeatedCount + 1;
              return {
                ...entry,
                discovered: true,
                defeatedCount: newKills,
                dropsRevealed: newKills >= 3,
                loreUnlocked: newKills >= 5,
              };
            }
            return entry;
          })
        );

        // 2. Update Achievements
        setAchievements((prev) =>
          prev.map((ach) => {
            if (ach.id === "ach_first_blood" && !ach.completed) {
              addNotification(`Achievement Unlocked: ${ach.title}!`, "boss");
              return { ...ach, progress: 1, completed: true };
            }
            if (ach.id === "ach_cleansing" && !ach.completed && enemyId.startsWith("stalker")) {
              const nextVal = Math.min(ach.maxProgress, ach.progress + 1);
              if (nextVal >= ach.maxProgress) {
                addNotification(`Achievement Unlocked: ${ach.title}!`, "boss");
              }
              return { ...ach, progress: nextVal, completed: nextVal >= ach.maxProgress };
            }
            if (ach.id === "ach_boss_titan" && !ach.completed && enemyId === "boss_titan") {
              addNotification(`Achievement Unlocked: ${ach.title}!`, "boss");
              return { ...ach, progress: 1, completed: true };
            }
            return ach;
          })
        );

        // 3. Quest update: if Aetherling stalker
        if (enemyId.startsWith("stalker")) {
          setQuests((prev) =>
            prev.map((q) => {
              if (q.id === "quest_prologue") {
                const updated = q.objectives.map((obj) => {
                  if (obj.id === "obj_02" && !obj.completed) {
                    const newCount = Math.min(obj.targetCount, obj.currentCount + 1);
                    return { ...obj, currentCount: newCount, completed: newCount >= obj.targetCount };
                  }
                  return obj;
                });
                return { ...q, objectives: updated };
              }
              return q;
            })
          );
        } else if (enemyId === "boss_titan") {
          // Boss defeated!
          addNotification("🏆 WORLD BOSS DEFEATED! The Calamity Ley Line is Restored!", "boss");
          setCurrency((c) => c + 1500);
          setAstralPrisms((p) => p + 60);
          // Add Heart of Ignis reward
          setInventory((inv) => [
            ...inv,
            {
              id: `drop_titan_${Date.now()}`,
              name: "Heart of Ignis",
              type: ItemType.MATERIAL,
              category: "material",
              rarity: ItemRarity.LEGENDARY,
              count: 1,
              description: "A pulsating magma crystal from the fallen Volcanic Titan. Used in top-tier ascension.",
              iconColor: "#ef4444",
            },
          ]);
        }
        // Grant Aether shards
        setCurrency((c) => c + 85);
      },
      onCollectItem: (itemId, count, name) => {
        setInventory((prev) => {
          const existing = prev.find((i) => i.id === itemId);
          if (existing) {
            return prev.map((i) => (i.id === itemId ? { ...i, count: i.count + count } : i));
          } else {
            return [
              ...prev,
              {
                id: itemId,
                name,
                type: ItemType.MATERIAL,
                category: "material",
                rarity: ItemRarity.RARE,
                count,
                description: `A fine resource harvested in the Sunvale Highlands.`,
                iconColor: "#06b6d4",
              },
            ];
          }
        });
      },
      onWaystoneUnlocked: (waystoneId, name) => {
        setUnlockedWaystones((prev) => (prev.includes(waystoneId) ? prev : [...prev, waystoneId]));
        // Quest objective 1 update
        setQuests((prev) =>
          prev.map((q) => {
            if (q.id === "quest_prologue") {
              const updated = q.objectives.map((obj) => {
                if (obj.id === "obj_01") return { ...obj, completed: true, currentCount: 1 };
                return obj;
              });
              return { ...q, objectives: updated };
            }
            return q;
          })
        );
      },
      onChestOpened: (chestId) => {
        setCurrency((c) => c + 120);
        addNotification("Obtained 120x Aether Shards & 2x Vitality Elixirs!", "item");
        setInventory((prev) =>
          prev.map((i) => (i.id === "con_vitality_pot" ? { ...i, count: i.count + 2 } : i))
        );
      },
      onBossStateUpdate: (boss) => {
        setBossState(boss);
      },
      onMinimapUpdate: (data) => {
        setMinimapData(data);
      },
    });

    engineRef.current = engine;

    const handleResize = () => engine.handleResize();
    window.addEventListener("resize", handleResize);

    // Custom NPC dialogue open listener
    const handleOpenDialogue = (e: any) => {
      const npcId = e.detail;
      const npc = INITIAL_NPCS.find((n) => n.id === npcId);
      if (npc) {
        setActiveNPC(npc);
      }
    };
    window.addEventListener("open_npc_dialogue", handleOpenDialogue);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("open_npc_dialogue", handleOpenDialogue);
      engine.dispose();
    };
  }, []);

  // 2. Clock & Ambient Sound Loop
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setWorldTime((prev) => {
        let newMin = prev.minute + 1;
        let newHour = prev.hour;
        if (newMin >= 60) {
          newMin = 0;
          newHour = (newHour + 1) % 24;
        }
        return { ...prev, hour: newHour, minute: newMin };
      });
    }, 2000);

    return () => clearInterval(clockInterval);
  }, []);

  // 3. Switch Character
  const handleSwitchCharacter = (idx: number) => {
    if (idx < 0 || idx >= party.length) return;
    setActiveCharIndex(idx);
    const selected = party[idx];
    if (engineRef.current) {
      engineRef.current.setCharacter(selected);
    }
    audio.playFanfare();
    addNotification(`Resonance Shift: ${selected.name} (${selected.element})!`, "level");
  };

  // 4. Keyboard Shortcuts for Modals & Party
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Digit1") handleSwitchCharacter(0);
      else if (e.code === "Digit2") handleSwitchCharacter(1);
      else if (e.code === "Digit3") handleSwitchCharacter(2);
      else if (e.code === "KeyC") {
        setActiveModal((curr) => (curr === "character" ? null : "character"));
      } else if (e.code === "KeyB") {
        setActiveModal((curr) => (curr === "inventory" ? null : "inventory"));
      } else if (e.code === "KeyJ") {
        setActiveModal((curr) => (curr === "quest" ? null : "quest"));
      } else if (e.code === "KeyK") {
        setActiveModal((curr) => (curr === "crafting" ? null : "crafting"));
      } else if (e.code === "KeyO") {
        setActiveModal((curr) => (curr === "oracle" ? null : "oracle"));
      } else if (e.code === "KeyM") {
        setActiveModal((curr) => (curr === "map" ? null : "map"));
      } else if (e.code === "KeyY") {
        setActiveModal((curr) => (curr === "archive" ? null : "archive"));
      } else if (e.code === "KeyU") {
        setActiveModal((curr) => (curr === "achievement" ? null : "achievement"));
      } else if (e.code === "KeyP") {
        setActiveModal((curr) => (curr === "shop" ? null : "shop"));
      } else if (e.code === "Escape") {
        if (activeNPC) {
          setActiveNPC(null);
        } else if (activeModal) {
          setActiveModal(null);
        } else {
          setActiveModal("settings");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [party, activeModal, activeNPC]);

  // 5. Progression Handlers
  const handleLevelUp = (charId: string) => {
    const char = party.find((c) => c.id === charId);
    if (!char) return;
    const cost = char.level * 80;
    if (currency < cost) return;

    setCurrency((c) => c - cost);
    setParty((prev) =>
      prev.map((c) => {
        if (c.id === charId) {
          return {
            ...c,
            level: c.level + 1,
            stats: {
              ...c.stats,
              maxHp: c.stats.maxHp + 65,
              hp: c.stats.maxHp + 65,
              atk: c.stats.atk + 12,
              def: c.stats.def + 6,
            },
          };
        }
        return c;
      })
    );
    audio.playFanfare();
    addNotification(`${char.name} reached Level ${char.level + 1}! (+Stats)`, "level");
  };

  const handleAscend = (charId: string) => {
    setParty((prev) =>
      prev.map((c) => {
        if (c.id === charId) {
          return {
            ...c,
            ascension: c.ascension + 1,
            stats: {
              ...c.stats,
              atk: c.stats.atk + 35,
              critRate: c.stats.critRate + 0.05,
              aetherMastery: c.stats.aetherMastery + 40,
            },
          };
        }
        return c;
      })
    );
    audio.playFanfare();
    addNotification("Character Ascension Rank Unlocked! Level cap increased!", "level");
  };

  // 6. Inventory Handlers
  const handleUseItem = (item: GameItem) => {
    if (item.count <= 0) return;

    // Heal active character
    const healAmount = item.stats?.hp || item.buffEffect?.value || 400;
    setPlayerStats((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
    }));

    setInventory((prev) =>
      prev
        .map((i) => (i.id === item.id ? { ...i, count: i.count - 1 } : i))
        .filter((i) => i.count > 0)
    );

    audio.playCollectSound();
    addNotification(`Used ${item.name}! (+${healAmount} HP)`, "item");
  };

  const handleEquipItem = (item: GameItem) => {
    const active = party[activeCharIndex];
    if (!active) return;

    const atk = item.stats?.atk || item.statBonus?.atk || 0;
    const def = item.stats?.def || item.statBonus?.def || 0;

    setParty((prev) =>
      prev.map((c, idx) => {
        if (idx === activeCharIndex) {
          return {
            ...c,
            stats: {
              ...c.stats,
              atk: c.stats.atk + atk,
              def: c.stats.def + def,
            },
          };
        }
        return c;
      })
    );

    audio.playFanfare();
    addNotification(`Equipped ${item.name} to ${active.name}!`, "item");
  };

  // 7. Crafting
  const handleCraftRecipe = (recipe: CraftingRecipe) => {
    // Deduct ingredients
    setInventory((prev) => {
      let updated = [...prev];
      recipe.ingredients.forEach((ing: CraftingIngredient) => {
        updated = updated
          .map((item) => (item.id === ing.itemId ? { ...item, count: item.count - ing.count } : item))
          .filter((item) => item.count > 0);
      });

      // Add output item
      const existing = updated.find((i) => i.id === recipe.outputItemId);
      if (existing) {
        return updated.map((i) =>
          i.id === recipe.outputItemId ? { ...i, count: i.count + recipe.outputCount } : i
        );
      } else {
        return [
          ...updated,
          {
            id: recipe.outputItemId,
            name: recipe.name,
            type: ItemType.CONSUMABLE,
            category: "consumable",
            rarity: ItemRarity.EPIC,
            count: recipe.outputCount,
            description: recipe.description,
            stats: { hp: 600 },
            iconColor: "#10b981",
          },
        ];
      }
    });

    addNotification(`Synthesized: ${recipe.name}!`, "item");
  };

  // 8. Save / Load & Cloud Sync
  const handleManualSave = (slot: number) => {
    const saveData = {
      party,
      inventory,
      currency,
      astralPrisms,
      eventEmbers,
      achievements,
      bestiary,
      codex,
      quests,
      activeQuestId,
      unlockedWaystones,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`aetheria_save_slot_${slot}`, JSON.stringify(saveData));
  };

  const handleManualLoad = (slot: number) => {
    const raw = localStorage.getItem(`aetheria_save_slot_${slot}`);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.party) setParty(data.party);
      if (data.inventory) setInventory(data.inventory);
      if (data.currency) setCurrency(data.currency);
      if (data.astralPrisms) setAstralPrisms(data.astralPrisms);
      if (data.eventEmbers) setEventEmbers(data.eventEmbers);
      if (data.achievements) setAchievements(data.achievements);
      if (data.bestiary) setBestiary(data.bestiary);
      if (data.codex) setCodex(data.codex);
      if (data.quests) setQuests(data.quests);
      if (data.activeQuestId) setActiveQuestId(data.activeQuestId);
      if (data.unlockedWaystones) setUnlockedWaystones(data.unlockedWaystones);
      addNotification(`Loaded Slot ${slot} successfully!`, "quest");
    }
  };

  const handleExportSave = () => {
    const saveData = {
      party,
      inventory,
      currency,
      astralPrisms,
      eventEmbers,
      achievements,
      bestiary,
      codex,
      quests,
      activeQuestId,
      unlockedWaystones,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Aetheria_Save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSave = (content: string) => {
    try {
      const data = JSON.parse(content);
      if (data.party) setParty(data.party);
      if (data.inventory) setInventory(data.inventory);
      if (data.currency) setCurrency(data.currency);
      if (data.astralPrisms) setAstralPrisms(data.astralPrisms);
      if (data.eventEmbers) setEventEmbers(data.eventEmbers);
      if (data.achievements) setAchievements(data.achievements);
      if (data.bestiary) setBestiary(data.bestiary);
      if (data.codex) setCodex(data.codex);
      if (data.quests) setQuests(data.quests);
      if (data.activeQuestId) setActiveQuestId(data.activeQuestId);
      if (data.unlockedWaystones) setUnlockedWaystones(data.unlockedWaystones);
      addNotification("Save imported successfully!", "quest");
    } catch (e) {
      addNotification("Invalid save format!", "boss");
    }
  };

  const handleCloudSync = async () => {
    try {
      const saveData = {
        party,
        inventory,
        currency,
        astralPrisms,
        eventEmbers,
        achievements,
        bestiary,
        codex,
        quests,
        activeQuestId,
        unlockedWaystones,
      };
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "traveler_main", saveData }),
      });
      if (res.ok) {
        addNotification("Synced to Aetheria Cloud Server!", "quest");
      }
    } catch (e) {
      console.error("Cloud sync error:", e);
    }
  };

  // 9. Fast Travel
  const handleFastTravel = (pos: [number, number, number]) => {
    if (engineRef.current) {
      engineRef.current.teleportTo(pos);
    }
  };

  // 10. Achievements, Bestiary & Economy Handlers
  const handleClaimAchievement = (id: string) => {
    const ach = achievements.find((a) => a.id === id);
    if (!ach || !ach.completed || ach.claimed) return;

    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, claimed: true } : a))
    );

    setCurrency((c) => c + (ach.rewardGold || 0));
    setAstralPrisms((p) => p + (ach.rewardPrisms || 0));

    audio.playFanfare();
    addNotification(`Claimed ${ach.title}! (+${ach.rewardPrisms || 0} Astral Prisms)`, "quest");
  };

  const handleWish = (bannerId: string, count: 1 | 10) => {
    const cost = count * 160;
    if (astralPrisms < cost) {
      addNotification("Not enough Astral Prisms for Invocation!", "boss");
      return;
    }

    setAstralPrisms((p) => p - cost);

    const pullPool: { name: string; rarity: ItemRarity; desc: string; color: string }[] = [
      { name: "Radiant Sunblade", rarity: ItemRarity.LEGENDARY, desc: "A 5-star solar longsword glowing with stellar heat.", color: "#f59e0b" },
      { name: "Astral Core", rarity: ItemRarity.EPIC, desc: "A concentrated star condensed into ascension fuel.", color: "#8b5cf6" },
      { name: "Zephyr Bow", rarity: ItemRarity.EPIC, desc: "A 4-star lightweight recurve that fires gale needles.", color: "#06b6d4" },
      { name: "Iron Greatsword", rarity: ItemRarity.COMMON, desc: "Sturdy standard blade.", color: "#94a3b8" },
      { name: "Aether Prism Shard", rarity: ItemRarity.RARE, desc: "A sparkling crystalline remnant.", color: "#38bdf8" },
    ];

    const rewards: GameItem[] = [];
    for (let i = 0; i < count; i++) {
      const isFiveStar = Math.random() < 0.08 || (count === 10 && i === 9);
      const isFourStar = Math.random() < 0.25;
      const pick = isFiveStar ? pullPool[0] : isFourStar ? pullPool[1 + Math.floor(Math.random() * 2)] : pullPool[3 + Math.floor(Math.random() * 2)];

      rewards.push({
        id: `wish_${Date.now()}_${i}`,
        name: pick.name,
        type: ItemType.WEAPON,
        category: "weapon",
        rarity: pick.rarity,
        count: 1,
        description: pick.desc,
        stats: { atk: pick.rarity === ItemRarity.LEGENDARY ? 95 : 45 },
        iconColor: pick.color,
      });
    }

    setInventory((prev) => [...prev, ...rewards]);
    audio.playFanfare();
    addNotification(`Invocation Success! Acquired ${count} resonant items!`, "quest");
  };

  const handleExchange = (from: "shards" | "prisms", to: "prisms" | "embers", amount: number) => {
    if (from === "shards") {
      const cost = amount * 10;
      if (currency < cost) {
        addNotification("Not enough Aether Shards!", "boss");
        return;
      }
      setCurrency((c) => c - cost);
      if (to === "prisms") setAstralPrisms((p) => p + amount);
      audio.playCollectSound();
      addNotification(`Exchanged for ${amount} Astral Prisms!`, "item");
    } else {
      if (astralPrisms < amount) {
        addNotification("Not enough Astral Prisms!", "boss");
        return;
      }
      setAstralPrisms((p) => p - amount);
      if (to === "embers") setEventEmbers((e) => e + amount * 2);
      audio.playCollectSound();
      addNotification(`Exchanged for ${amount * 2} Event Embers!`, "item");
    }
  };

  const handlePurchasePassTier = (tierId: number) => {
    const cost = 250;
    if (astralPrisms < cost) {
      addNotification("Not enough Astral Prisms to advance Leyline Pass!", "boss");
      return;
    }
    setAstralPrisms((p) => p - cost);
    setCurrency((c) => c + 1000);
    audio.playFanfare();
    addNotification(`Tier ${tierId} Claimed! (+1000 Shards & Materials)`, "quest");
  };

  // Active quest data
  const currentActiveQuest = quests.find((q) => q.id === activeQuestId) || quests[0] || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. Primary Game HUD Overlay */}
      <GameHUD
        party={party}
        activeCharIndex={activeCharIndex}
        playerStats={playerStats}
        currency={currency}
        astralPrisms={astralPrisms}
        worldTime={worldTime}
        activeQuest={currentActiveQuest}
        interactPrompt={interactPrompt}
        onInteract={() => currentActionRef.current && currentActionRef.current()}
        onSwitchCharacter={handleSwitchCharacter}
        onTriggerAttack={() => engineRef.current?.triggerAttack()}
        onTriggerSkill={() => engineRef.current?.triggerSkill()}
        onTriggerUltimate={() => engineRef.current?.triggerUltimate()}
        onTriggerDodge={() => engineRef.current?.triggerDodge()}
        onOpenModal={(modal) => setActiveModal(modal)}
        bossState={bossState}
        floatingDamages={floatingDamages}
        activeReactions={activeReactions}
        notifications={notifications}
        minimapData={minimapData}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = audio.toggleMute();
          setIsMuted(muted);
        }}
      />

      {/* 3. Character Creator Modal (Initial Welcome / Customization) */}
      {isCustomizing && (
        <CharacterCreator
          onComplete={(profile) => {
            setParty((prev) =>
              prev.map((c, idx) =>
                idx === 0
                  ? {
                      ...c,
                      name: profile.name,
                      avatarColor: profile.avatarColor,
                      accentColor: profile.accentColor,
                    }
                  : c
              )
            );
            localStorage.setItem("aetheria_profile_created", "true");
            setIsCustomizing(false);
            if (engineRef.current) {
              engineRef.current.setCharacter({
                ...party[0],
                name: profile.name,
                avatarColor: profile.avatarColor,
                accentColor: profile.accentColor,
              });
            }
            addNotification(`Welcome to Aetheria, ${profile.name}!`, "quest");
          }}
        />
      )}

      {/* 4. Cinematic Dialogue Box (NPC Interaction) */}
      {activeNPC && (
        <DialogueBox
          npc={activeNPC}
          onSelectOption={(opt) => {
            if (opt.action === "open_alchemy") {
              setActiveNPC(null);
              setActiveModal("crafting");
            } else if (opt.action === "claim_quest" || opt.questId) {
              // Complete quest objective
              setQuests((prev) =>
                prev.map((q) => {
                  if (q.id === "quest_prologue") {
                    const updated = q.objectives.map((obj) => {
                      if (obj.id === "obj_03") return { ...obj, completed: true, currentCount: 1 };
                      return obj;
                    });
                    const allDone = updated.every((o) => o.completed);
                    return { ...q, objectives: updated, status: allDone ? "completed" : q.status };
                  }
                  return q;
                })
              );
              setCurrency((c) => c + 300);
              addNotification("Quest Chronicle Updated! (+300 Shards)", "quest");
              audio.playFanfare();
            }
          }}
          onClose={() => setActiveNPC(null)}
        />
      )}

      {/* 5. Modals */}
      {activeModal === "character" && (
        <CharacterModal
          party={party}
          activeCharIndex={activeCharIndex}
          inventory={inventory}
          currency={currency}
          onSelectCharacter={(idx) => handleSwitchCharacter(idx)}
          onLevelUp={handleLevelUp}
          onAscend={handleAscend}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "inventory" && (
        <InventoryModal
          items={inventory}
          currency={currency}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "quest" && (
        <QuestModal
          quests={quests}
          activeQuestId={activeQuestId}
          onTrackQuest={(id) => {
            setActiveQuestId(id);
            addNotification("Now tracking quest!", "quest");
          }}
          onClaimQuest={(id) => {
            setQuests((prev) =>
              prev.map((q) => (q.id === id ? { ...q, status: "completed" as const } : q))
            );
            setCurrency((c) => c + 500);
            addNotification("Claimed quest rewards! (+500 Shards)", "quest");
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "crafting" && (
        <CraftingModal
          recipes={INITIAL_RECIPES}
          inventory={inventory}
          onCraftRecipe={handleCraftRecipe}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "oracle" && (
        <OracleModal
          party={party}
          activeQuest={currentActiveQuest}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "map" && (
        <WorldMapModal
          playerPos={minimapData.playerPos}
          unlockedWaystones={unlockedWaystones}
          onFastTravel={handleFastTravel}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "settings" && (
        <SettingsModal
          onManualSave={handleManualSave}
          onManualLoad={handleManualLoad}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
          onCloudSync={handleCloudSync}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = audio.toggleMute();
            setIsMuted(muted);
          }}
          graphicsQuality={graphicsQuality}
          onChangeGraphics={(q) => {
            setGraphicsQuality(q);
            engineRef.current?.setGraphicsQuality(q);
          }}
          screenShake={screenShake}
          onToggleScreenShake={() => {
            setScreenShake((prev) => {
              const next = !prev;
              engineRef.current?.setScreenShake(next);
              return next;
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "archive" && (
        <ArchiveModal
          bestiary={bestiary}
          codex={codex}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "achievement" && (
        <AchievementModal
          achievements={achievements}
          currency={currency}
          astralPrisms={astralPrisms}
          onClaimAchievement={handleClaimAchievement}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "shop" && (
        <ShopModal
          currency={currency}
          astralPrisms={astralPrisms}
          eventEmbers={eventEmbers}
          onPerformWish={(count) => handleWish("featured", count as 1 | 10)}
          onExchangePrisms={(amount) => handleExchange("shards", "prisms", amount)}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
