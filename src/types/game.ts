/**
 * Aetheria: Resonant Horizon - Core Types and Definitions
 */

export enum AetherElement {
  EMBER = "Ember",     // Fire
  TIDE = "Tide",       // Water
  GALE = "Gale",       // Wind
  STONE = "Stone",     // Earth / Defense
  BLOOM = "Bloom",     // Flora / Nature / Healing
  VOLT = "Volt",       // Lightning
}

export enum WeaponType {
  SWORD = "Sword",
  GREATSWORD = "Greatsword",
  CATALYST = "Catalyst",
  SPEAR = "Spear",
  DUAL_BLADES = "Dual Blades",
}

export enum ItemRarity {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export enum ItemType {
  WEAPON = "weapon",
  EQUIPMENT = "equipment",
  MATERIAL = "material",
  CONSUMABLE = "consumable",
  QUEST = "quest",
}

export enum EquipmentSlot {
  WEAPON = "weapon",
  HEAD = "head",
  BODY = "body",
  GLOVES = "gloves",
  BOOTS = "boots",
  ACCESSORY = "accessory",
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  critRate: number; // 0.05 = 5%
  critDmg: number;  // 0.50 = 50%
  aetherMastery: number;
}

export interface PlayableCharacter {
  id: string;
  name: string;
  title: string;
  element: AetherElement;
  weaponType: WeaponType;
  level: number;
  exp: number;
  maxExp: number;
  ascension: number; // 0, 1, 2, 3
  stats: CharacterStats;
  skillName: string;
  skillDescription: string;
  skillCooldown: number; // seconds
  ultimateName: string;
  ultimateDescription: string;
  ultimateEnergyCost: number;
  avatarColor: string;
  accentColor: string;
  bio: string;
  equipped: Partial<Record<EquipmentSlot, GameItem>>;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  category?: "weapon" | "armor" | "material" | "consumable" | "quest";
  rarity: ItemRarity;
  slot?: EquipmentSlot;
  weaponType?: WeaponType;
  level?: number;
  maxLevel?: number;
  count: number;
  statBonus?: Partial<CharacterStats>;
  stats?: {
    hp?: number;
    atk?: number;
    def?: number;
  };
  buffEffect?: {
    type: "heal" | "atk_boost" | "stamina_boost" | "defense_boost";
    value: number;
    durationSeconds?: number;
  };
  iconColor: string;
}

export interface CraftingIngredient {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: string;
  description: string;
  ingredients: CraftingIngredient[];
  outputItemId: string;
  outputCount: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  chapter?: number;
  category: "Main Story" | "Side Quest" | "Daily Quest" | "World Quest";
  description: string;
  locationName: string;
  objectives: QuestObjective[];
  rewards: {
    exp: number;
    currency: number;
    items?: { item: GameItem; count: number }[];
  };
  status: "available" | "active" | "completed";
  npcGiver?: string;
  dialogueOnComplete?: string[];
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  region: string;
  position: [number, number, number];
  dialogue: {
    greeting: string;
    storyDialogue?: string[];
    options: {
      label: string;
      response: string;
      action?: "open_shop" | "open_crafting" | "start_quest" | "claim_quest";
      questId?: string;
    }[];
  };
}

export interface ActiveElementalReaction {
  id: string;
  name: string;
  description: string;
  color: string;
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

export interface FloatingDamage {
  id: string;
  amount: number;
  isCrit: boolean;
  element?: AetherElement;
  x: number;
  y: number;
  z: number;
  reactionName?: string;
}

export interface WorldTimeState {
  hour: number; // 0 to 24
  minute: number;
  timeScale?: number; // 1 min real = 1 hour game, etc.
  phase?: "Dawn" | "Day" | "Dusk" | "Night";
  weather: "Clear" | "Aether Bloom" | "Starlight Sky" | "Rain" | "Sunny Breeze" | string;
  timeMultiplier?: number;
}

export interface WaystonePoint {
  id: string;
  name: string;
  region: string;
  position: [number, number, number];
  unlocked: boolean;
  description: string;
}

export interface PlayerCustomization {
  name: string;
  bodyType: "Aetherial Scout" | "Aetherial Knight";
  hairStyle: "Spiky Breeze" | "Twin Ribbons" | "Flowing Mane" | "Short Rogue";
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfitVariant: "Sunvale Wanderer" | "Aether Vanguard" | "Starfire Robes";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "Combat" | "Exploration" | "Story" | "Collection" | "Character" | "Boss";
  rewardGold: number;
  rewardPrisms: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  title: string;
  category: "Elite" | "World Boss" | "Wild Aetherling" | "Automaton";
  habitat: string;
  element: AetherElement;
  weakness: AetherElement;
  drops: string[];
  lore: string;
  defeatedCount: number;
  combatTips: string;
  dangerLevel: number;
}

export interface CodexLoreEntry {
  id: string;
  title: string;
  category: "Factions" | "Regions" | "History" | "Creatures" | "Artifacts" | "Mysteries";
  preview: string;
  content: string;
  unlocked: boolean;
  unlockedBy: string;
}

export interface GraphicsSettings {
  quality: "Low" | "Medium" | "High" | "Ultra";
  renderDistance: number;
  shadows: boolean;
  particles: boolean;
  screenShake: boolean;
  cameraSensitivity: number;
}

export interface Faction {
  id: string;
  name: string;
  title: string;
  description: string;
  philosophy: string;
  headquarters: string;
  leader: string;
  reputation: number;
  standing: "Neutral" | "Friendly" | "Honored" | "Exalted";
  rewards: { standing: string; rewardDesc: string; unlocked: boolean }[];
  bannerColor: string;
}

export interface NPCRelationship {
  npcId: string;
  affinity: number;
  level: "Stranger" | "Acquaintance" | "Confidant" | "Sworn Ally";
  favoriteGifts: string[];
  unlockedLore: string[];
  giftsGiven?: number;
}

export type EmoteType = "wave" | "sit" | "dance" | "victory" | "bow" | "laugh";

export interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  keyHint: string;
  completed: boolean;
}

export interface DebugStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeEnemies: number;
  playerX: number;
  playerY: number;
  playerZ: number;
  timeString: string;
  weather: string;
}

export interface GameSaveState {
  version: number;
  playerId: string;
  playerProfile: PlayerCustomization;
  party: PlayableCharacter[];
  activeCharacterIndex: number;
  currency: number; // Aether Shards / Gold
  astralPrisms?: number;
  eventEmbers?: number;
  inventory: GameItem[];
  quests: Quest[];
  activeQuestId: string | null;
  unlockedWaystones: string[];
  openedChests: string[];
  collectedNodes: Record<string, number>; // id -> respawn timestamp
  worldTime: WorldTimeState;
  reputation: Record<string, number>;
  defeatedBosses: string[];
  achievements?: Achievement[];
  bestiaryKills?: Record<string, number>;
  lastSaved: number;
}
