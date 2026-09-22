/**
 * Aetheria: Resonant Horizon - Complete 3D Game Engine (Three.js)
 * Real-time 3D third-person anime action RPG with exploration, combat & world simulation
 */

import * as THREE from "three";
import {
  AetherElement,
  PlayableCharacter,
  FloatingDamage,
  ActiveElementalReaction,
  EmoteType,
  DebugStats,
} from "../types/game";
import { audio } from "./audio";
import { ControlConfig, DEFAULT_CONTROL_CONFIG } from "./controls/controlConfig";
import { CollisionSystem } from "./controls/collisionSystem";
import { InputManager, InputContext } from "./controls/inputManager";
import { CameraController } from "./controls/cameraController";
import { MovementController } from "./controls/movementController";
import { AnimationRegistry } from "./animation/AnimationRegistry";
import { AnimationController } from "./animation/AnimationController";
import { BossAnimationController } from "./animation/BossAnimationController";
import { AnimeModelParts } from "./animation/PlayerAnimationRig";
import { AnimationDebugData, AnimationState } from "./animation/animationTypes";
import { EnvironmentBuilder } from "./visuals/environmentBuilder";
import { VegetationSystem } from "./visuals/vegetationSystem";
import { CharacterVisualBuilder } from "./visuals/characterVisualBuilder";
import { EntityVisualBuilder } from "./visuals/entityVisualBuilder";
import { WaterSystem } from "./visuals/waterSystem";

export interface EngineCallbacks {
  onInteractPrompt: (prompt: string | null, action?: () => void) => void;
  onPlayerStatsUpdate: (stats: {
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
    energy: number;
    maxEnergy: number;
  }) => void;
  onDamageNumber: (dmg: FloatingDamage) => void;
  onElementalReaction: (reaction: ActiveElementalReaction) => void;
  onNotification: (text: string, type?: "quest" | "level" | "item" | "boss") => void;
  onEnemyKilled: (enemyId: string, enemyName: string) => void;
  onCollectItem: (itemId: string, count: number, name: string) => void;
  onWaystoneUnlocked: (waystoneId: string, name: string) => void;
  onChestOpened: (chestId: string) => void;
  onBossStateUpdate: (boss: { name: string; hp: number; maxHp: number; phase: number; isVulnerable: boolean } | null) => void;
  onMinimapUpdate: (data: {
    playerPos: [number, number];
    playerRot: number;
    entities: { id: string; type: "enemy" | "npc" | "chest" | "waystone" | "node"; pos: [number, number]; name: string }[];
  }) => void;
}

export interface EnemyEntity {
  id: string;
  name: string;
  type: "aetherling" | "vanguard" | "boss";
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  stagger: number;
  maxStagger: number;
  isVulnerable: boolean;
  vulnerableTimer: number;
  atk: number;
  elementStatus?: AetherElement;
  elementStatusTimer: number;
  state: "idle" | "patrol" | "chase" | "attack" | "stagger" | "dead";
  pos: THREE.Vector3;
  spawnPos: THREE.Vector3;
  velocity: THREE.Vector3;
  attackCooldown: number;
  attackTelegraphMesh?: THREE.Mesh;
  phase?: number;
}

export class ThreeEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private callbacks: EngineCallbacks;

  // Sky & Lighting
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private skyMesh: THREE.Mesh;
  private clouds: THREE.Group;

  // Player
  private playerGroup: THREE.Group;
  private playerModel: AnimeModelParts;
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelocity = new THREE.Vector3();
  private playerRotation = 0;
  private isGrounded = true;
  private wasGrounded = true;
  private isSprinting = false;

  // Animation State Machine & Blending (Req 64, 65, 66)
  private animState: "IDLE" | "WALK" | "RUN" | "SPRINT" | "JUMP" | "FALL" | "LAND" | "DODGE" | "ATTACK" | "HEAVY_ATTACK" = "IDLE";
  private attackPhase: "none" | "anticipation" | "strike" | "recovery" = "none";
  private attackPhaseTimer = 0;
  private isHeavyAttack = false;

  // Surface Footsteps (Req 68, 69)
  private footstepAccumulator = 0;
  private currentSurface: "grass" | "dirt" | "stone" | "wood" | "water" = "grass";

  // Atmospheric Weather Particles (Req 52)
  private atmosphericLeaves?: THREE.Points;
  private atmosphericDust?: THREE.Points;
  private atmosphericRain?: THREE.Points;

  // Modular Control System (Req 75-80)
  public controlConfig: ControlConfig = { ...DEFAULT_CONTROL_CONFIG };
  public collisionSystem!: CollisionSystem;
  public inputManager!: InputManager;
  public cameraController!: CameraController;
  public movementController!: MovementController;

  // Master Animation Architecture (Req 1-100)
  public animRegistry: AnimationRegistry = new AnimationRegistry();
  public animationController!: AnimationController;
  public bossAnimationController!: BossAnimationController;

  // Master Modular Visual Upgrade Architecture
  private waterSystem = new WaterSystem();
  private waterSystemUpdater?: (time: number) => void;
  private environmentBuilder = new EnvironmentBuilder();
  private vegetationSystem = new VegetationSystem();
  private characterVisualBuilder = CharacterVisualBuilder.getInstance();
  private entityVisualBuilder = EntityVisualBuilder.getInstance();

  // Combat State
  private activeCharacter: PlayableCharacter;
  private comboStep = 0;
  private comboTimer = 0;
  private isAttacking = false;
  private attackAnimTime = 0;
  private isDodging = false;
  private dodgeTimer = 0;
  private isInvulnerable = false;
  private skillCooldownTimer = 0;
  private isUsingSkill = false;
  private isUsingUltimate = false;
  private timeSlowdown = 1.0;
  private timeSlowdownTimer = 0;
  private screenShakeEnabled = true;

  // Emotes, Photography & Developer Debug
  private activeEmote: EmoteType | null = null;
  private emoteTimer = 0;
  private isPhotoMode = false;
  private photoFov = 58;
  private photoDistance = 5.5;
  private photoHeightOffset = 1.8;
  private photoYawDelta = 0;
  private godMode = false;
  private fpsCounter = 60;
  private frameTimeCounter = 16.6;
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private currentWeatherName = "Clear";
  private currentTimeString = "12:00";

  // World Entities
  private enemies: EnemyEntity[] = [];
  private npcs: { id: string; name: string; role: string; mesh: THREE.Group; pos: THREE.Vector3 }[] = [];
  private chests: { id: string; mesh: THREE.Group; opened: boolean; pos: THREE.Vector3; tier: string }[] = [];
  private waystones: { id: string; name: string; mesh: THREE.Group; unlocked: boolean; pos: THREE.Vector3 }[] = [];
  private nodes: { id: string; type: "crystal" | "herb"; mesh: THREE.Group; collected: boolean; pos: THREE.Vector3 }[] = [];
  private totems: { id: string; element: AetherElement; mesh: THREE.Group; activated: boolean; pos: THREE.Vector3 }[] = [];

  // Particles & VFX
  private particles: { mesh: THREE.Points; velocities: Float32Array; life: number; maxLife: number }[] = [];
  private terrainHeightMap: (x: number, z: number) => number;

  // Animation & Loop
  private reqId: number | null = null;
  private lastTime = performance.now();
  private keysPressed: Record<string, boolean> = {};
  private currentInteractionAction?: () => void;

  constructor(container: HTMLElement, activeChar: PlayableCharacter, callbacks: EngineCallbacks) {
    this.container = container;
    this.activeCharacter = activeChar;
    this.callbacks = callbacks;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xa7d8ff, 0.008);

    // 2. Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 800);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Terrain generator function
    this.terrainHeightMap = (x: number, z: number) => {
      // Gentle rolling plateau with hills
      const h1 = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 2.8;
      const h2 = Math.sin(x * 0.05 + 1.2) * Math.sin(z * 0.05 + 0.8) * 1.2;
      // Village center at (0,0) is flattened
      const distFromCenter = Math.sqrt(x * x + z * z);
      const flattenFactor = Math.min(1, Math.max(0, (distFromCenter - 25) / 30));
      return (h1 + h2) * flattenFactor;
    };

    // 4. Initialize Scene Components
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
    this.scene.add(this.ambientLight);

    // Anime Bounce / Hemisphere Fill Light (sky light & ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x86efac, 0.55);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    this.sunLight.position.set(60, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x8899ff, 0.4);
    this.moonLight.position.set(-60, 70, -50);
    this.scene.add(this.moonLight);

    // Sky Dome
    this.skyMesh = this.buildSkyDome();
    this.scene.add(this.skyMesh);

    // Clouds
    this.clouds = this.buildCloudCover();
    this.scene.add(this.clouds);

    // Atmospheric Fog & Subtle Particles (Req 51, 52)
    this.scene.fog = new THREE.FogExp2(0xa7d8ff, 0.0032);
    this.buildAtmosphericParticles();

    // Initialize Collision & Spatial System early for world building
    this.collisionSystem = new CollisionSystem();

    // Hotkey F3 to toggle Collision Debug Visualizer
    window.addEventListener("keydown", (e) => {
      if (e.key === "F3") {
        this.collisionSystem.toggleDebugVisualizer(this.scene);
      }
    });

    // Build World (Terrain, Village, Ruins, Caldera, Trees)
    this.buildWorld();

    // Build Player Model & Rig
    this.playerGroup = new THREE.Group();
    this.playerModel = this.buildAnimeCharacter(this.activeCharacter);
    this.playerGroup.add(this.playerModel.root);
    this.scene.add(this.playerGroup);

    // Master Animation System Initialization (Req 1-100)
    this.animationController = this.animRegistry.getPlayerController();
    this.bossAnimationController = this.animRegistry.getBossController();
    this.animationController.setModel(this.playerModel, this.activeCharacter.weaponType);

    // Spawn Entities
    this.spawnNPCs();
    this.spawnChests();
    this.spawnWaystones();
    this.spawnGatheringNodes();
    this.spawnTotems();
    this.spawnEnemies();

    // Event Listeners
    this.setupInputs();

    // Start Loop
    this.startLoop();
  }

  // Build vibrant anime sky
  private buildSkyDome(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(450, 32, 16);
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#38bdf8"); // Horizon top cyan
    grad.addColorStop(0.5, "#7dd3fc"); // Mid sky
    grad.addColorStop(0.85, "#bae6fd"); // Near horizon
    grad.addColorStop(1, "#f0f9ff"); // Warm ground edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  // Drifting stylized low-poly cloud puffs
  private buildCloudCover(): THREE.Group {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
    });

    for (let i = 0; i < 28; i++) {
      const cloud = new THREE.Group();
      const puffCount = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffCount; p++) {
        const puffGeo = new THREE.DodecahedronGeometry(8 + Math.random() * 6, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (p - puffCount / 2) * 9 + Math.random() * 4,
          Math.sin(p) * 2,
          Math.random() * 6
        );
        puff.scale.set(1.4, 0.8, 1.2);
        cloud.add(puff);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 450,
        70 + Math.random() * 25,
        (Math.random() - 0.5) * 450
      );
      group.add(cloud);
    }
    return group;
  }

  // Build the complete vertical slice region
  private buildWorld() {
    // 1. Terrain Mesh with multi-band anime coloring and smooth shading
    const terrainSize = 320;
    const terrainSegs = 128;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colorAttr = new Float32Array(posAttr.count * 3);

    const meadowGreen = new THREE.Color(0x4ade80);
    const chartreuseLush = new THREE.Color(0x86efac);
    const deepGlade = new THREE.Color(0x16a34a);
    const cobblestonePath = new THREE.Color(0xd6d3d1);
    const pathDirtEdge = new THREE.Color(0xa8a29e);
    const riverGravel = new THREE.Color(0x78716c);
    const cliffStone = new THREE.Color(0x52525b);
    const calderaBasalt = new THREE.Color(0x1c1917);
    const magmaGlow = new THREE.Color(0xb91c1c);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.terrainHeightMap(x, z);
      posAttr.setY(i, y);

      // Path carving to ruins and glade
      const distToGladePath = Math.abs(z - Math.sin(x * 0.04) * 8);
      const isGladePath = x > -15 && x < 85 && distToGladePath < 4.8;

      // Caldera path
      const calderaT = (-x - 10) / 55;
      const isCalderaPath = x < -10 && x > -68 && Math.abs(z - calderaT * 55) < 4.5;

      // Village central plaza
      const distToCenter = Math.hypot(x, z);
      const isVillagePlaza = distToCenter < 22;

      // Caldera basin
      const distToCaldera = Math.hypot(x - (-65), z - 60);

      let c = meadowGreen.clone();

      if (distToCaldera < 36) {
        c.lerp(calderaBasalt, Math.min(1, (36 - distToCaldera) / 16));
        if (distToCaldera < 20) {
          c.lerp(magmaGlow, Math.sin(x * 0.2 + z * 0.2) * 0.25 + 0.25);
        }
      } else if (isVillagePlaza) {
        c.lerp(cobblestonePath, 0.9);
      } else if (isGladePath || isCalderaPath) {
        const roadCenterDist = isGladePath ? distToGladePath : Math.abs(z - calderaT * 55);
        const roadBlend = Math.min(1, roadCenterDist / 4.8);
        const pathTone = cobblestonePath.clone().lerp(pathDirtEdge, roadBlend);
        c.lerp(pathTone, 0.88);
      } else if (Math.abs(x - 18) < 7.5) {
        c.lerp(riverGravel, 0.85);
      } else if (y > 3.2) {
        c.lerp(cliffStone, Math.min(1, (y - 3.2) / 3.0));
      } else {
        const noise = (Math.sin(x * 0.08) + Math.cos(z * 0.08)) * 0.5;
        if (noise > 0.2) {
          c.lerp(chartreuseLush, 0.45);
        } else if (noise < -0.2) {
          c.lerp(deepGlade, 0.35);
        }
      }

      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }

    terrainGeo.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // 2. Animated River & Physical Arch Bridge
    const waterBridge = this.waterSystem.buildWaterAndBridge(this.scene, this.collisionSystem);
    this.waterSystemUpdater = waterBridge.update;

    // 3. Modular Village Architecture
    const village = this.environmentBuilder.buildVillage(this.scene, this.terrainHeightMap, this.collisionSystem);
    (this as any).windmillBlades = village.windmillBlades;

    // 4. Instanced Vegetation & Distinct Tree Species
    this.vegetationSystem.buildVegetation(this.scene, this.terrainHeightMap, this.collisionSystem);

    // 5. Ancient Ruins
    this.buildAncientRuins();

    // 6. Molten Caldera Boss Arena
    this.buildCalderaArena();
  }

  // Ancient Aether Ruins
  private buildAncientRuins() {
    const ruinsGroup = new THREE.Group();
    const rx = 75;
    const rz = -45;
    const ry = this.terrainHeightMap(rx, rz);

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.1,
    });
    const aetherGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // 4 Broken Columns
    const colCoords = [
      [-10, -10],
      [10, -10],
      [-10, 10],
      [10, 10],
    ];

    colCoords.forEach(([cx, cz], idx) => {
      const height = 7 + Math.random() * 5;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, height, 12), marbleMat);
      col.position.set(cx, height / 2, cz);
      col.castShadow = true;
      ruinsGroup.add(col);

      // Glowing Aether Ring around column
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 24), aetherGlowMat);
      ring.position.set(cx, height * 0.7, cz);
      ring.rotation.x = Math.PI / 2;
      ruinsGroup.add(ring);

      // Register collision for ruins columns
      this.collisionSystem.addCylinderCollider(`ruin_col_${idx}`, rx + cx, rz + cz, 1.4, ry, ry + height);
    });

    // Floating Ancient Monolith Core
    const monoGeo = new THREE.OctahedronGeometry(2.5, 0);
    const monoMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const mono = new THREE.Mesh(monoGeo, monoMat);
    mono.position.set(0, 6, 0);
    ruinsGroup.add(mono);
    (this as any).floatingMonolith = mono;

    const ruLight = new THREE.PointLight(0x38bdf8, 2, 18);
    ruLight.position.set(0, 6, 0);
    ruinsGroup.add(ruLight);

    ruinsGroup.position.set(rx, ry, rz);
    this.scene.add(ruinsGroup);
  }

  // Molten Caldera Boss Arena (Req 50: Circular clearing, stone ruins around perimeter, broken pillars, cracked ground, large central space with minimal obstacles, room to dodge)
  private buildCalderaArena() {
    const caldera = new THREE.Group();
    const arenaRadius = 32;

    // Basalt Ring Walls & Perimeter Ruins Material
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.92,
      flatShading: true,
    });
    const brokenMarbleMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.75,
    });
    const magmaRuneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.5,
    });

    // Circular arena cracked floor slabs
    const floorGeo = new THREE.CircleGeometry(arenaRadius, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.9,
    });
    const arenaFloor = new THREE.Mesh(floorGeo, floorMat);
    arenaFloor.rotateX(-Math.PI / 2);
    arenaFloor.position.y = 0.05;
    arenaFloor.receiveShadow = true;
    caldera.add(arenaFloor);

    // Glowing ancient rune ring in floor (perimeter inner boundary)
    const runeRing = new THREE.Mesh(
      new THREE.RingGeometry(arenaRadius * 0.65, arenaRadius * 0.7, 36),
      magmaRuneMat
    );
    runeRing.rotateX(-Math.PI / 2);
    runeRing.position.y = 0.08;
    caldera.add(runeRing);

    // Perimeter ruins: Broken pillars and stone arches around edge (keeping center free of obstacles)
    const pillarCount = 20;
    for (let a = 0; a < pillarCount; a++) {
      const theta = (a / pillarCount) * Math.PI * 2;
      const dist = arenaRadius - 1.5;
      const px = Math.cos(theta) * dist;
      const pz = Math.sin(theta) * dist;
      const height = 4.5 + (a % 4) * 2.8;

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.2, height, 8),
        brokenMarbleMat
      );
      pillar.position.set(px, height / 2, pz);
      pillar.rotation.y = a * 0.5;
      if (a % 4 === 0) {
        pillar.rotation.z = (Math.random() - 0.5) * 0.25;
      }
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      caldera.add(pillar);

      // Register collision for caldera perimeter pillars
      this.collisionSystem.addCylinderCollider(`caldera_pillar_${a}`, -65 + px, 60 + pz, 1.8, this.terrainHeightMap(-65, 60), this.terrainHeightMap(-65, 60) + height);

      // Warm perimeter braziers every 5 pillars
      if (a % 5 === 0) {
        const brazierLight = new THREE.PointLight(0xf97316, 2.0, 20);
        brazierLight.position.set(px * 0.9, height * 0.75, pz * 0.9);
        caldera.add(brazierLight);
      }
    }

    // Warm magma ambient glow from central subterranean fissure
    const lavaGlow = new THREE.PointLight(0xf97316, 2.5, 45);
    lavaGlow.position.set(0, 4.5, 0);
    caldera.add(lavaGlow);

    const cx = -65;
    const cz = 60;
    caldera.position.set(cx, this.terrainHeightMap(cx, cz) + 0.1, cz);
    this.scene.add(caldera);
  }

  // Atmospheric weather particles (Req 52: subtle falling leaves, dust motes, rain droplets)
  private buildAtmosphericParticles() {
    // 1. Drifting forest leaves / petals (60 particles)
    const leafCount = 60;
    const leafGeo = new THREE.BufferGeometry();
    const leafPos = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount; i++) {
      leafPos[i * 3] = (Math.random() - 0.5) * 70;
      leafPos[i * 3 + 1] = 2 + Math.random() * 12;
      leafPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    leafGeo.setAttribute("position", new THREE.BufferAttribute(leafPos, 3));
    const leafMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
    });
    this.atmosphericLeaves = new THREE.Points(leafGeo, leafMat);
    this.scene.add(this.atmosphericLeaves);

    // 2. Sunlight dust / pollen motes (90 particles)
    const dustCount = 90;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 50;
      dustPos[i * 3 + 1] = 1 + Math.random() * 8;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
    });
    this.atmosphericDust = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.atmosphericDust);

    // 3. Rain particles (200 particles, visible when raining)
    const rainCount = 200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 60;
      rainPos[i * 3 + 1] = Math.random() * 20;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.16,
      transparent: true,
      opacity: 0,
    });
    this.atmosphericRain = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.atmosphericRain);
  }

  // Stylized anime character mesh builder with modular Sockets, Outlines & Weapons (Req 63)
  private buildAnimeCharacter(char: PlayableCharacter): AnimeModelParts {
    return this.characterVisualBuilder.buildCharacter(char);
  }

  // Socket system weapon attachment (Req 63)
  public attachWeaponToSocket(socketName: "rightHand" | "back" | "hip") {
    if (!this.playerModel.sockets[socketName]) return;
    this.playerModel.sockets[socketName].add(this.playerModel.weapon);
    if (socketName === "back") {
      this.playerModel.weapon.position.set(0, 0.2, 0);
      this.playerModel.weapon.rotation.set(0, 0, Math.PI * 0.75);
    } else if (socketName === "hip") {
      this.playerModel.weapon.position.set(0, 0, 0);
      this.playerModel.weapon.rotation.set(Math.PI / 4, 0, 0);
    } else {
      this.playerModel.weapon.position.set(0, 0, 0.1);
      this.playerModel.weapon.rotation.set(Math.PI / 4, 0, 0);
    }
  }

  // Detect surface under position for dynamic footsteps & water interaction (Req 68, 69)
  private getSurfaceAt(x: number, z: number): "grass" | "dirt" | "stone" | "wood" | "water" {
    // River stream running near x = 18
    if (Math.abs(x - 18) < 4.2 && this.playerPos.y <= 0.15) {
      return "water";
    }
    // Wooden bridge deck over river
    if (Math.abs(x - 18) < 4.5 && Math.abs(z) < 10 && this.playerPos.y > 0.2) {
      return "wood";
    }
    // Village plaza cobblestone
    if (Math.abs(x) < 22 && Math.abs(z) < 22) {
      return "stone";
    }
    // Ancient Ruins stone platform
    if (Math.hypot(x - 75, z - (-45)) < 22) {
      return "stone";
    }
    // Molten Caldera boss arena stone floor
    if (Math.hypot(x - (-65), z - 60) < 32) {
      return "stone";
    }
    // Dirt roads around village
    if (Math.abs(x) < 36 && Math.abs(z) < 36) {
      return "dirt";
    }
    return "grass";
  }

  // Update active character appearance & weapon
  public setCharacter(char: PlayableCharacter) {
    this.activeCharacter = char;
    this.playerGroup.remove(this.playerModel.root);
    this.playerModel = this.buildAnimeCharacter(char);
    this.playerGroup.add(this.playerModel.root);
    this.animationController.setModel(this.playerModel, char.weaponType);
    this.animationController.setWeaponType(char.weaponType);
  }

  // Spawn NPCs with interactive indicators and distinctive visual gear
  private spawnNPCs() {
    const npcDefs = [
      { id: "thorne", name: "Elder Thorne", role: "Sunvale Elder", pos: new THREE.Vector3(0, 0, -10), color: 0x3b82f6 },
      { id: "seraphina", name: "Seraphina", role: "Alchemist", pos: new THREE.Vector3(12, 0, -8), color: 0x10b981 },
      { id: "gerald", name: "Gerald the Smith", role: "Blacksmith", pos: new THREE.Vector3(-14, 0, -6), color: 0xf59e0b },
      { id: "sylas", name: "Sylas the Explorer", role: "Cartographer", pos: new THREE.Vector3(35, 0, 15), color: 0x8b5cf6 },
    ];

    npcDefs.forEach((def) => {
      let g: THREE.Group;
      if (def.id === "thorne") {
        g = this.entityVisualBuilder.buildElderThorne();
      } else if (def.id === "seraphina") {
        g = this.entityVisualBuilder.buildSeraphina();
      } else if (def.id === "gerald") {
        g = this.entityVisualBuilder.buildGerald();
      } else if (def.id === "sylas") {
        g = this.entityVisualBuilder.buildSylas();
      } else {
        g = new THREE.Group();
      }

      const y = this.terrainHeightMap(def.pos.x, def.pos.z);
      g.position.set(def.pos.x, y, def.pos.z);
      this.scene.add(g);

      // Register collision for NPCs so player cannot walk straight through them
      this.collisionSystem.addCylinderCollider(`npc_${def.id}`, def.pos.x, def.pos.z, 0.65, y, y + 2.2);

      this.npcs.push({
        id: def.id,
        name: def.name,
        role: def.role,
        mesh: g,
        pos: g.position,
      });

      // Register NPC Living Animation Controller (Req 64-67)
      this.animRegistry.registerNPC(def.id, def.role);
    });
  }

  // Spawn treasure chests
  private spawnChests() {
    const chestLocations: [string, number, number, string][] = [
      ["chest_01", 8, -14, "Common Chest"],
      ["chest_02", 48, 8, "Rare Chest"],
      ["chest_03", 82, -40, "Epic Chest"],
      ["chest_04", -50, 48, "Volcanic Chest"],
      ["chest_05", -12, 28, "Sunvale Cache"],
    ];

    chestLocations.forEach(([id, cx, cz, tier]) => {
      const chestGroup = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(1.2, 0.7, 0.9);
      const boxMat = new THREE.MeshStandardMaterial({
        color: tier === "Epic Chest" ? 0x9333ea : 0x78350f,
        roughness: 0.6,
        metalness: 0.4,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 0.35;
      box.castShadow = true;
      chestGroup.add(box);

      // Hinged Lid
      const lidGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.2, 12, 1, false, 0, Math.PI);
      lidGeo.rotateZ(Math.PI / 2);
      const lidMat = new THREE.MeshStandardMaterial({
        color: tier === "Epic Chest" ? 0xa855f7 : 0xb45309,
        roughness: 0.5,
        metalness: 0.5,
      });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set(0, 0.7, 0);
      lid.castShadow = true;
      chestGroup.add(lid);

      const cy = this.terrainHeightMap(cx, cz);
      chestGroup.position.set(cx, cy, cz);
      this.scene.add(chestGroup);

      this.chests.push({
        id,
        mesh: chestGroup,
        opened: false,
        pos: chestGroup.position,
        tier,
      });
    });
  }

  // Spawn Waystones
  private spawnWaystones() {
    const waystonePoints = [
      { id: "way_haven", name: "Sunvale Haven Plaza", pos: [0, -2] },
      { id: "way_glade", name: "Whispering Glade Crossing", pos: [40, 10] },
      { id: "way_ruins", name: "Ancient Beacon Sanctum", pos: [75, -45] },
      { id: "way_caldera", name: "Caldera of the Colossus", pos: [-65, 60] },
    ];

    waystonePoints.forEach((w) => {
      const wg = new THREE.Group();
      const pGeo = new THREE.CylinderGeometry(0.8, 1.2, 4.2, 6);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.y = 2.1;
      pillar.castShadow = true;
      wg.add(pillar);

      // Floating crystal head
      const cGeo = new THREE.OctahedronGeometry(0.7, 0);
      const cMat = new THREE.MeshStandardMaterial({
        color: w.id === "way_haven" ? 0x38bdf8 : 0x94a3b8,
        emissive: w.id === "way_haven" ? 0x0284c7 : 0x000000,
        emissiveIntensity: 0.9,
      });
      const crystal = new THREE.Mesh(cGeo, cMat);
      crystal.position.y = 4.8;
      wg.add(crystal);

      const wy = this.terrainHeightMap(w.pos[0], w.pos[1]);
      wg.position.set(w.pos[0], wy, w.pos[1]);
      this.scene.add(wg);

      this.waystones.push({
        id: w.id,
        name: w.name,
        mesh: wg,
        unlocked: w.id === "way_haven",
        pos: wg.position,
      });
    });
  }

  // Spawn herbs & crystal nodes
  private spawnGatheringNodes() {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 24 + (i % 5) * 12;
      const nx = Math.cos(angle) * dist;
      const nz = Math.sin(angle) * dist;
      const ny = this.terrainHeightMap(nx, nz);

      const isCrystal = i % 2 === 0;
      const g = new THREE.Group();

      if (isCrystal) {
        // Glowing Crystal cluster
        const cMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        });
        for (let c = 0; c < 3; c++) {
          const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 5), cMat);
          crystal.position.set((c - 1) * 0.35, 0.6, (Math.random() - 0.5) * 0.3);
          crystal.rotation.z = (c - 1) * 0.3;
          g.add(crystal);
        }
      } else {
        // Sunvale Goldpetal flower
        const fMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.5 });
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), fMat);
        flower.position.y = 0.45;
        g.add(flower);
      }

      g.position.set(nx, ny, nz);
      this.scene.add(g);

      this.nodes.push({
        id: `node_${i}`,
        type: isCrystal ? "crystal" : "herb",
        mesh: g,
        collected: false,
        pos: g.position,
      });
    }
  }

  // Spawn Ancient Totems for elemental puzzle
  private spawnTotems() {
    const totemDefs = [
      { id: "totem_gale", element: AetherElement.GALE, pos: [68, -48], color: 0x10b981 },
      { id: "totem_ember", element: AetherElement.EMBER, pos: [78, -48], color: 0xef4444 },
      { id: "totem_volt", element: AetherElement.VOLT, pos: [73, -40], color: 0x8b5cf6 },
    ];

    totemDefs.forEach((t) => {
      const g = new THREE.Group();
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 3.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
      );
      pillar.position.y = 1.6;
      pillar.castShadow = true;
      g.add(pillar);

      // Elemental rune orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.3,
        })
      );
      orb.position.y = 3.6;
      g.add(orb);

      const ty = this.terrainHeightMap(t.pos[0], t.pos[1]);
      g.position.set(t.pos[0], ty, t.pos[1]);
      this.scene.add(g);

      this.totems.push({
        id: t.id,
        element: t.element,
        mesh: g,
        activated: false,
        pos: g.position,
      });
    });
  }

  // Spawn Enemies & Boss
  private spawnEnemies() {
    // 1. Aetherling Stalkers in Whispering Glade
    const stalkerSpawns: [number, number][] = [
      [32, 8],
      [42, 16],
      [48, -4],
      [55, 20],
    ];

    stalkerSpawns.forEach(([sx, sz], idx) => {
      const { root: g, tail } = this.entityVisualBuilder.buildAetherlingStalker();
      const sy = this.terrainHeightMap(sx, sz);
      g.position.set(sx, sy, sz);
      this.scene.add(g);

      const stalkerId = `stalker_${idx}`;
      const stalkerCtrl = this.animRegistry.registerMonster(stalkerId, "aetherling");
      stalkerCtrl.setMeshParts({ tail });

      this.enemies.push({
        id: stalkerId,
        name: "Aetherling Stalker",
        type: "aetherling",
        mesh: g,
        hp: 850,
        maxHp: 850,
        stagger: 120,
        maxStagger: 120,
        isVulnerable: false,
        vulnerableTimer: 0,
        atk: 65,
        elementStatusTimer: 0,
        state: "idle",
        pos: g.position,
        spawnPos: g.position.clone(),
        velocity: new THREE.Vector3(),
        attackCooldown: 1.5,
      });
    });

    // 2. Ruin Vanguard in the ancient ruins
    const rvx = 72;
    const rvz = -42;
    const rvy = this.terrainHeightMap(rvx, rvz);
    const rvGroup = this.entityVisualBuilder.buildRuinVanguard();
    rvGroup.position.set(rvx, rvy, rvz);
    this.scene.add(rvGroup);

    // Register collision for Vanguard
    this.collisionSystem.addCylinderCollider("vanguard_01_body", rvx, rvz, 1.4, rvy, rvy + 4.0);

    this.animRegistry.registerMonster("vanguard_01", "vanguard");

    this.enemies.push({
      id: "vanguard_01",
      name: "Ruin Vanguard Automaton",
      type: "vanguard",
      mesh: rvGroup,
      hp: 2200,
      maxHp: 2200,
      stagger: 280,
      maxStagger: 280,
      isVulnerable: false,
      vulnerableTimer: 0,
      atk: 130,
      elementStatusTimer: 0,
      state: "idle",
      pos: rvGroup.position,
      spawnPos: rvGroup.position.clone(),
      velocity: new THREE.Vector3(),
      attackCooldown: 2.2,
    });

    // 3. World Boss: Resonant Colossus: Ignis-Titan in Caldera
    const bx = -65;
    const bz = 60;
    const by = this.terrainHeightMap(bx, bz);
    const { root: bossGroup, torso: bTorso, head: bHead, core: bCore, fists: bossFists } =
      this.entityVisualBuilder.buildIgnisTitan();

    this.bossAnimationController.setParts(bTorso, bHead, bCore, bossFists);

    bossGroup.position.set(bx, by, bz);
    this.scene.add(bossGroup);

    // Register collision for Boss Colossus
    this.collisionSystem.addCylinderCollider("boss_titan_body", bx, bz, 3.2, by, by + 10.0);

    this.enemies.push({
      id: "boss_titan",
      name: "Resonant Colossus: Ignis-Titan",
      type: "boss",
      mesh: bossGroup,
      hp: 7500,
      maxHp: 7500,
      stagger: 600,
      maxStagger: 600,
      isVulnerable: false,
      vulnerableTimer: 0,
      atk: 220,
      elementStatusTimer: 0,
      state: "idle",
      pos: bossGroup.position,
      spawnPos: bossGroup.position.clone(),
      velocity: new THREE.Vector3(),
      attackCooldown: 3.0,
      phase: 1,
    });
  }

  // Setup Controls, Camera, Movement & Input Manager (Req 10-26, 75-80)
  private setupInputs() {
    this.cameraController = new CameraController(this.camera, this.controlConfig, this.collisionSystem);
    this.inputManager = new InputManager(this.container, {
      onInteract: () => {
        if (this.currentInteractionAction) {
          this.currentInteractionAction();
        }
      },
      onAttack: (isHeavy) => {
        this.triggerAttack(isHeavy);
      },
      onDodge: () => {
        this.triggerDodge();
      },
      onJump: () => {
        this.jump();
      },
      onSkill: () => {
        this.triggerSkill();
      },
      onUltimate: () => {
        this.triggerUltimate();
      },
    });

    this.movementController = new MovementController(
      this.playerPos,
      this.controlConfig,
      this.collisionSystem,
      this.cameraController,
      this.inputManager
    );
  }

  // Jump with physics & landing sound trigger (Req 40, 41, 68)
  private jump() {
    if (this.isGrounded && this.activeCharacter.stats.stamina >= 8) {
      if (this.movementController.jump()) {
        this.isGrounded = false;
        this.animState = "JUMP";
        this.animationController.requestState("JUMP_START", 0.08);
        this.activeCharacter.stats.stamina -= 8;
        audio.playJumpSound();
      }
    }
  }

  // Attack combo chain with anticipation, strike, recovery (Req 60, 64, 65, 66)
  public triggerAttack(isHeavy = false) {
    if (this.isAttacking && this.attackPhase === "anticipation") return;
    if (this.activeCharacter.stats.stamina < (isHeavy ? 12 : 5)) return;

    this.isAttacking = true;
    this.isHeavyAttack = isHeavy;
    this.animState = isHeavy ? "HEAVY_ATTACK" : "ATTACK";
    this.attackPhase = "anticipation";

    // Trigger state machine transition & combo advance in AnimationController
    this.animationController.triggerAttack(isHeavy);

    // Weapon weight determines anticipation duration (Greatsword slower, Sword/Spear/Catalyst snappy)
    const isGreatsword = this.activeCharacter.weaponType === "Greatsword";
    this.attackPhaseTimer = isHeavy ? 0.28 : isGreatsword ? 0.18 : 0.08;
    this.attackAnimTime = 0;
    this.activeCharacter.stats.stamina = Math.max(0, this.activeCharacter.stats.stamina - (isHeavy ? 12 : 6));
    this.comboStep = isHeavy ? 3 : (this.comboStep + 1) % 3;
    this.comboTimer = 1.4;

    audio.playWeaponSlash(this.activeCharacter.weaponType, this.comboStep);
  }

  // Hit test against enemies in range (called during strike phase)
  private performAttackHitCheck(isHeavy: boolean) {
    const attackRange = isHeavy ? 4.4 : 3.6;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotation);

    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const toEnemy = enemy.pos.clone().sub(this.playerPos);
      const dist = toEnemy.length();

      if (dist <= attackRange) {
        toEnemy.normalize();
        const dot = forward.dot(toEnemy);
        if (dot > 0.25) {
          // Hit connected!
          this.applyDamageToEnemy(enemy, isHeavy);
        }
      }
    });
  }

  // Character Skill (Q)
  public triggerSkill() {
    if (this.skillCooldownTimer > 0) return;
    this.skillCooldownTimer = this.activeCharacter.skillCooldown;
    this.isUsingSkill = true;

    this.animationController.triggerSkill();
    audio.playSkillSound(this.activeCharacter.element);
    this.callbacks.onNotification(`${this.activeCharacter.name}: ${this.activeCharacter.skillName}!`);

    // Big elemental pulse
    this.spawnParticleBurst(this.playerPos, this.activeCharacter.accentColor, 40);

    // Hit all enemies in 7m radius with elemental effect
    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dist = enemy.pos.distanceTo(this.playerPos);
      if (dist < 7.5) {
        this.applyDamageToEnemy(enemy, true, this.activeCharacter.element);
      }
    });

    setTimeout(() => {
      this.isUsingSkill = false;
    }, 600);
  }

  // Ultimate (R)
  public triggerUltimate() {
    if (this.activeCharacter.stats.energy < this.activeCharacter.ultimateEnergyCost) {
      this.callbacks.onNotification("Energy not ready!", "item");
      return;
    }
    this.activeCharacter.stats.energy = 0;
    this.isUsingUltimate = true;

    this.animationController.triggerUltimate();
    audio.playUltimateSound();
    this.callbacks.onNotification(`BURST: ${this.activeCharacter.ultimateName}!!`, "boss");

    // Camera punch-in (Req 23)
    this.cameraController.punchInDistance(3.5, 800);

    // Massive elemental explosion
    this.spawnParticleBurst(this.playerPos, this.activeCharacter.avatarColor, 80);

    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dist = enemy.pos.distanceTo(this.playerPos);
      if (dist < 14) {
        // High burst damage
        const ultDmg = this.activeCharacter.stats.atk * 3.5;
        this.dealDamage(enemy, ultDmg, true, this.activeCharacter.element);
      }
    });

    setTimeout(() => {
      this.isUsingUltimate = false;
    }, 1200);
  }

  // Dodge & Perfect Dodge (Req 44, 45, 46)
  public triggerDodge() {
    if (this.isDodging || this.activeCharacter.stats.stamina < 18) return;

    this.isDodging = true;
    this.dodgeTimer = this.controlConfig.dodgeDuration;
    this.isInvulnerable = true;
    this.activeCharacter.stats.stamina -= 18;
    this.animState = "DODGE";
    this.animationController.triggerDodge();

    // Dash impulse via MovementController
    this.movementController.triggerDodge(this.controlConfig.dodgeImpulse);

    // Check for Perfect Dodge (if any enemy is in active attack swing within 4.5m)
    let triggeredPerfect = false;
    this.enemies.forEach((enemy) => {
      if (enemy.state === "attack" && enemy.pos.distanceTo(this.playerPos) < 5.0) {
        triggeredPerfect = true;
      }
    });

    audio.playDodgeSound(triggeredPerfect);

    if (triggeredPerfect) {
      this.triggerPerfectDodge();
    }
  }

  // Perfect Dodge slow-motion trigger
  private triggerPerfectDodge() {
    this.timeSlowdown = 0.25;
    this.timeSlowdownTimer = 2.0; // 2 seconds slowmo
    this.activeCharacter.stats.stamina = Math.min(
      this.activeCharacter.stats.maxStamina,
      this.activeCharacter.stats.stamina + 35
    );
    this.callbacks.onNotification("⚡ PERFECT DODGE! Time Dilation Activated! ⚡", "boss");
    this.spawnParticleBurst(this.playerPos, "#38bdf8", 30);
  }

  // Damage calculation & Elemental Reactions
  private applyDamageToEnemy(enemy: EnemyEntity, isSkill = false, element?: AetherElement) {
    const char = this.activeCharacter;
    let baseDmg = char.stats.atk * (isSkill ? 1.8 : 1.0 + this.comboStep * 0.3);
    const isCrit = Math.random() < char.stats.critRate;
    if (isCrit) {
      baseDmg *= 1 + char.stats.critDmg;
    }

    const appliedElement = element || char.element;
    this.dealDamage(enemy, baseDmg, isCrit, appliedElement);

    // Stagger meter reduction
    const staggerDmg = isSkill ? 60 : 25 + (char.weaponType === "Greatsword" ? 40 : 0);
    enemy.stagger = Math.max(0, enemy.stagger - staggerDmg);

    if (enemy.stagger === 0 && !enemy.isVulnerable) {
      enemy.isVulnerable = true;
      enemy.vulnerableTimer = 6.0;
      enemy.state = "stagger";
      audio.playHitSound(true, true);
      this.callbacks.onNotification(`STAGGER BREAK! ${enemy.name} is vulnerable!`, "boss");
    } else {
      audio.playHitSound(isCrit, false);
    }

    // Energy recharge on hit
    char.stats.energy = Math.min(char.stats.maxEnergy, char.stats.energy + 8);
  }

  // Handle elemental reaction matrix
  private dealDamage(enemy: EnemyEntity, rawDmg: number, isCrit: boolean, element?: AetherElement) {
    let finalDmg = rawDmg;
    if (enemy.isVulnerable) {
      finalDmg *= 2.0; // 200% damage when staggered!
    }

    let reactionName: string | undefined;

    // Check elemental reactions
    if (enemy.elementStatus && element && enemy.elementStatus !== element) {
      const prev = enemy.elementStatus;
      const curr = element;

      if ((prev === "Ember" && curr === "Bloom") || (prev === "Bloom" && curr === "Ember")) {
        reactionName = "CONFLAGRATION!";
        finalDmg *= 2.2;
        this.callbacks.onElementalReaction({
          id: Math.random().toString(),
          name: "Conflagration!",
          description: "Massive fiery aether detonation!",
          color: "#f97316",
          timestamp: Date.now(),
          x: enemy.pos.x,
          y: enemy.pos.y + 2,
          z: enemy.pos.z,
        });
        this.spawnParticleBurst(enemy.pos, "#f97316", 45);
      } else if ((prev === "Tide" && curr === "Volt") || (prev === "Volt" && curr === "Tide")) {
        reactionName = "CHAIN DISCHARGE!";
        finalDmg *= 1.8;
        this.callbacks.onElementalReaction({
          id: Math.random().toString(),
          name: "Chain Discharge!",
          description: "Lightning arcs to all nearby foes!",
          color: "#8b5cf6",
          timestamp: Date.now(),
          x: enemy.pos.x,
          y: enemy.pos.y + 2,
          z: enemy.pos.z,
        });
        this.spawnParticleBurst(enemy.pos, "#8b5cf6", 35);
      } else if ((prev === "Stone" && curr === "Gale") || (prev === "Gale" && curr === "Stone")) {
        reactionName = "DUST BARRIER!";
        this.activeCharacter.stats.hp = Math.min(
          this.activeCharacter.stats.maxHp,
          this.activeCharacter.stats.hp + 200
        );
        this.callbacks.onElementalReaction({
          id: Math.random().toString(),
          name: "Dust Barrier!",
          description: "Protective shield formed around player!",
          color: "#eab308",
          timestamp: Date.now(),
          x: this.playerPos.x,
          y: this.playerPos.y + 2,
          z: this.playerPos.z,
        });
      } else if ((prev === "Ember" && curr === "Volt") || (prev === "Volt" && curr === "Ember")) {
        reactionName = "OVERCHARGE!";
        finalDmg *= 1.9;
        enemy.stagger = 0; // Instant stagger
      }

      enemy.elementStatus = undefined; // Consumed
    } else if (element) {
      enemy.elementStatus = element;
      enemy.elementStatusTimer = 6.0;
    }

    finalDmg = Math.round(finalDmg);
    enemy.hp = Math.max(0, enemy.hp - finalDmg);

    // Floating damage number
    this.callbacks.onDamageNumber({
      id: Math.random().toString(),
      amount: finalDmg,
      isCrit,
      element,
      reactionName,
      x: enemy.pos.x + (Math.random() - 0.5) * 0.8,
      y: enemy.pos.y + 2.2,
      z: enemy.pos.z + (Math.random() - 0.5) * 0.8,
    });

    // Check death
    if (enemy.hp <= 0 && enemy.state !== "dead") {
      enemy.state = "dead";
      this.callbacks.onEnemyKilled(enemy.id, enemy.name);
      this.callbacks.onNotification(`Defeated ${enemy.name}! (+EXP & Shards)`, "quest");
      this.spawnParticleBurst(enemy.pos, "#facc15", 30);

      // Hide or remove after delay
      setTimeout(() => {
        enemy.mesh.visible = false;
      }, 1200);
    }
  }

  // Particle burst generator
  private spawnParticleBurst(pos: THREE.Vector3, colorHex: string, count = 25) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 1.2;
      positions[i * 3 + 2] = pos.z;

      velocities[i * 3] = (Math.random() - 0.5) * 8;
      velocities[i * 3 + 1] = Math.random() * 7 + 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.particles.push({
      mesh: points,
      velocities,
      life: 0.6,
      maxLife: 0.6,
    });
  }

  // Fast-travel teleport
  public teleportTo(pos: [number, number, number]) {
    this.movementController.setPosition(pos[0], pos[1] + 1, pos[2]);
    this.playerPos.copy(this.movementController.getPosition());
    this.playerVelocity.set(0, 0, 0);
    this.spawnParticleBurst(this.playerPos, "#38bdf8", 40);
    this.callbacks.onNotification("Resonated with Waystone!", "quest");
  }

  // Main Loop
  private startLoop() {
    const loop = (currentTime: number) => {
      const rawDelta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      const delta = Math.min(rawDelta, 0.1) * this.timeSlowdown;

      // Update Time Slowdown
      if (this.timeSlowdownTimer > 0) {
        this.timeSlowdownTimer -= rawDelta;
        if (this.timeSlowdownTimer <= 0) {
          this.timeSlowdown = 1.0;
        }
      }

      this.frameCount++;
      if (currentTime - this.lastFpsUpdate >= 500) {
        this.fpsCounter = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
        this.frameTimeCounter = Math.round(rawDelta * 1000 * 10) / 10;
        this.frameCount = 0;
        this.lastFpsUpdate = currentTime;
      }

      this.update(delta);
      this.render();

      this.reqId = requestAnimationFrame(loop);
    };

    this.reqId = requestAnimationFrame(loop);
  }

  // Frame update
  private update(delta: number) {
    if (this.godMode) {
      this.activeCharacter.stats.hp = this.activeCharacter.stats.maxHp;
      this.activeCharacter.stats.stamina = this.activeCharacter.stats.maxStamina;
      this.activeCharacter.stats.energy = this.activeCharacter.stats.maxEnergy;
    }

    // 1. Process Camera Input (Req 13-26)
    const mouseDelta = this.inputManager.consumeMouseDelta();
    const wheelDelta = this.inputManager.consumeWheelDelta();
    this.cameraController.handleMouseMove(mouseDelta.x, mouseDelta.y);
    if (wheelDelta !== 0) {
      this.cameraController.handleWheelZoom(wheelDelta);
    }

    const animTime = performance.now() * 0.006;

    // 2. Player Movement & Physics (Req 2-9, 27-30, 33-36, 60-61, 75-80)
    this.movementController.setAttacking(this.isAttacking);
    const moveResult = this.movementController.update(
      delta,
      this.activeCharacter.stats.stamina,
      (x, z) => this.terrainHeightMap(x, z)
    );

    this.playerPos.copy(this.movementController.getPosition());
    this.playerRotation = this.movementController.getRotation();
    this.isGrounded = moveResult.isGrounded;
    this.isSprinting = this.movementController.isSprintActive();
    const isMoving = moveResult.isMoving;
    this.playerVelocity.copy(this.movementController.getVelocity());

    // Stamina drain during sprint
    if (this.isSprinting && isMoving) {
      this.activeCharacter.stats.stamina = Math.max(0, this.activeCharacter.stats.stamina - delta * 12);
      if (this.activeCharacter.stats.stamina <= 0) {
        this.isSprinting = false;
      }
    } else {
      // Regenerate stamina
      this.activeCharacter.stats.stamina = Math.min(
        this.activeCharacter.stats.maxStamina,
        this.activeCharacter.stats.stamina + delta * 20
      );
    }

    // Landing detection (Req 68)
    if (moveResult.justLanded) {
      this.currentSurface = this.getSurfaceAt(this.playerPos.x, this.playerPos.z);
      audio.playLandSound(this.currentSurface);
    }
    this.wasGrounded = this.isGrounded;

    // Footsteps distance accumulator (Req 68)
    if (isMoving && this.isGrounded) {
      const stepDistance = this.isSprinting ? 3.0 : 2.0;
      this.footstepAccumulator += moveResult.currentSpeed * delta;
      if (this.footstepAccumulator >= stepDistance) {
        this.footstepAccumulator = 0;
        this.currentSurface = this.getSurfaceAt(this.playerPos.x, this.playerPos.z);
        audio.playFootstep(this.currentSurface);
        if (this.currentSurface === "water") {
          this.spawnParticleBurst(this.playerPos, "#38bdf8", 6);
        }
      }
    }

    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.y = this.playerRotation;

    // 2. Character Model Animations with Master Animation Architecture (Req 1-100)
    this.animRegistry.tickFrame();
    this.animationController.update(
      delta,
      this.playerVelocity,
      this.isGrounded,
      this.isSprinting,
      this.playerPos,
      this.playerRotation,
      () => {
        // Combat hit frame event: damage check synchronized to strike impact keyframe (Req 81, 82, 83)
        this.performAttackHitCheck(this.isHeavyAttack);
      },
      () => {
        // Footstep contact frame event: foot contact matching ground surface (Req 80)
        this.currentSurface = this.getSurfaceAt(this.playerPos.x, this.playerPos.z);
        audio.playFootstep(this.currentSurface);
      }
    );

    // Keep attack state machine in sync for gameplay flags
    if (this.isAttacking) {
      this.attackPhaseTimer -= delta;
      if (this.attackPhase === "anticipation" && this.attackPhaseTimer <= 0) {
        this.attackPhase = "strike";
        this.attackPhaseTimer = this.isHeavyAttack ? 0.22 : 0.14;
      } else if (this.attackPhase === "strike" && this.attackPhaseTimer <= 0) {
        this.attackPhase = "recovery";
        this.attackPhaseTimer = this.isHeavyAttack ? 0.2 : 0.12;
      } else if (this.attackPhase === "recovery" && this.attackPhaseTimer <= 0) {
        this.attackPhase = "none";
        this.isAttacking = false;
      }
    }

    // Cooldowns
    if (this.skillCooldownTimer > 0) {
      this.skillCooldownTimer = Math.max(0, this.skillCooldownTimer - delta);
    }
    if (this.dodgeTimer > 0) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - delta);
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvulnerable = false;
      }
    }
    // Attack combo & input buffer check (Req 48, 49)
    this.inputManager.updateBuffer(delta);
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        if (this.inputManager.consumeAttackBuffer()) {
          this.triggerAttack();
        } else {
          this.comboStep = 0;
          this.isAttacking = false;
          this.movementController.setAttacking(false);
        }
      }
    }

    // 3. Update Camera Orbit & Follow (Req 13-26, 38)
    this.cameraController.update(
      delta,
      this.playerPos,
      this.isSprinting,
      isMoving,
      (x, z) => this.terrainHeightMap(x, z)
    );

    // 4. Update Enemies AI
    let activeBoss: EnemyEntity | null = null;
    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      if (enemy.type === "boss") activeBoss = enemy;

      const distToPlayer = enemy.pos.distanceTo(this.playerPos);

      // Stagger recovery
      if (enemy.isVulnerable) {
        enemy.vulnerableTimer -= delta;
        if (enemy.vulnerableTimer <= 0) {
          enemy.isVulnerable = false;
          enemy.stagger = enemy.maxStagger;
          enemy.state = "idle";
        }
      }

      // Attack cooldown
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta);

      // Update enemy specialized animation controllers (Req 55-63)
      if (enemy.type === "boss") {
        this.bossAnimationController.update(
          delta,
          enemy.mesh,
          enemy.state === "chase",
          enemy.state === "attack",
          enemy.isVulnerable,
          enemy.hp <= 0,
          () => {
            // Ground slam / heavy fist impact frame! (Req 61, 62)
            this.cameraController.shake(0.35, 320);
            this.spawnParticleBurst(enemy.pos, "#f97316", 40);
          }
        );
      } else {
        const monsterCtrl = this.animRegistry.getMonster(enemy.id);
        if (monsterCtrl && this.animRegistry.shouldUpdateEntity(distToPlayer)) {
          monsterCtrl.update(
            delta,
            enemy.mesh,
            enemy.state === "chase",
            enemy.state === "attack",
            enemy.isVulnerable,
            enemy.hp <= 0,
            distToPlayer
          );
        }
      }

      // Simple AI state machine
      if (!enemy.isVulnerable) {
        const aggroRange = enemy.type === "boss" ? 35 : 18;
        if (distToPlayer < aggroRange) {
          enemy.state = "chase";
          const dir = this.playerPos.clone().sub(enemy.pos).setY(0).normalize();
          enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);

          const attackDistance = enemy.type === "boss" ? 6.5 : 2.4;
          if (distToPlayer > attackDistance) {
            const spd = enemy.type === "boss" ? 2.8 : 4.2;
            enemy.pos.addScaledVector(dir, spd * delta);
            enemy.pos.y = this.terrainHeightMap(enemy.pos.x, enemy.pos.z);
          } else if (enemy.attackCooldown <= 0) {
            // Trigger enemy attack
            enemy.state = "attack";
            enemy.attackCooldown = enemy.type === "boss" ? 3.2 : 2.0;

            // Deal damage if player is within range and not dodging
            setTimeout(() => {
              if (enemy.hp > 0 && !this.isInvulnerable) {
                const currentDist = enemy.pos.distanceTo(this.playerPos);
                if (currentDist < attackDistance + 1.5) {
                  const dmg = Math.max(10, enemy.atk - this.activeCharacter.stats.def * 0.4);
                  this.activeCharacter.stats.hp = Math.max(0, this.activeCharacter.stats.hp - Math.round(dmg));
                  audio.playHitSound(false, false);
                  this.animationController.triggerHit({ direction: "FRONT", intensity: 1.0 });
                  if (this.activeCharacter.stats.hp <= 0) {
                    this.animationController.triggerDeath();
                  }
                  this.callbacks.onDamageNumber({
                    id: Math.random().toString(),
                    amount: Math.round(dmg),
                    isCrit: false,
                    x: this.playerPos.x,
                    y: this.playerPos.y + 1.8,
                    z: this.playerPos.z,
                  });
                }
              }
            }, 400);
          }
        } else {
          enemy.state = "idle";
        }
      }
    });

    // 5. Update Living NPC Animations & Head Tracking (Req 64-67)
    this.npcs.forEach((npc) => {
      const npcCtrl = this.animRegistry.getNPC(npc.id);
      if (npcCtrl && this.animRegistry.shouldUpdateEntity(npc.pos.distanceTo(this.playerPos))) {
        npcCtrl.update(delta, npc.mesh, this.playerPos);
      }
    });

    // Update Boss UI Callback
    if (activeBoss) {
      this.callbacks.onBossStateUpdate({
        name: (activeBoss as EnemyEntity).name,
        hp: (activeBoss as EnemyEntity).hp,
        maxHp: (activeBoss as EnemyEntity).maxHp,
        phase: (activeBoss as EnemyEntity).phase || 1,
        isVulnerable: (activeBoss as EnemyEntity).isVulnerable,
      });
    } else {
      this.callbacks.onBossStateUpdate(null);
    }

    // 5. Update Interactive Proximity & Prompts
    this.checkInteractions();

    // 6. Update Particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.life -= delta;
      if (part.life <= 0) {
        this.scene.remove(part.mesh);
        this.particles.splice(p, 1);
      } else {
        const posAttr = part.mesh.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          posAttr.setX(i, posAttr.getX(i) + part.velocities[i * 3] * delta);
          posAttr.setY(i, posAttr.getY(i) + part.velocities[i * 3 + 1] * delta);
          posAttr.setZ(i, posAttr.getZ(i) + part.velocities[i * 3 + 2] * delta);
          part.velocities[i * 3 + 1] -= 9.8 * delta; // Gravity on particles
        }
        posAttr.needsUpdate = true;
      }
    }

    // Atmospheric particles update (falling leaves, dust motes, rain droplets) (Req 52)
    if (this.atmosphericLeaves) {
      const posAttr = this.atmosphericLeaves.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let py = posAttr.getY(i) - delta * 1.6;
        let px = posAttr.getX(i) + Math.sin(animTime + i) * delta * 0.8;
        let pz = posAttr.getZ(i) + Math.cos(animTime + i) * delta * 0.8;
        if (py < 0.2) py = 12 + Math.random() * 4;
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
    }
    if (this.atmosphericDust) {
      const posAttr = this.atmosphericDust.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let py = posAttr.getY(i) + Math.sin(animTime * 0.8 + i) * delta * 0.25;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;
    }
    if (this.atmosphericRain && (this.atmosphericRain.material as THREE.PointsMaterial).opacity > 0) {
      const posAttr = this.atmosphericRain.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let py = posAttr.getY(i) - delta * 22;
        if (py < 0) py = 20;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;
    }

    // Adaptive Dynamic BGM State (Req 58, 59: Exploration, Village, Combat, Boss)
    const distToVillage = this.playerPos.length();
    const distToCaldera = this.playerPos.distanceTo(new THREE.Vector3(-65, this.playerPos.y, 60));
    const isBossCombat = !!(activeBoss && (activeBoss as EnemyEntity).hp > 0 && distToCaldera < 40);
    const isGeneralCombat = this.enemies.some((e) => e.hp > 0 && (e.state === "chase" || e.state === "attack"));

    if (isBossCombat) {
      audio.setBgmState("boss");
    } else if (isGeneralCombat) {
      audio.setBgmState("combat");
    } else if (distToVillage < 26) {
      audio.setBgmState("village");
    } else {
      audio.setBgmState("exploration");
    }

    // 7. Rotating Objects (Windmill, Monolith) & Water Surface Animation
    if ((this as any).windmillBlades) {
      (this as any).windmillBlades.rotation.z -= delta * 0.8;
    }
    if ((this as any).floatingMonolith) {
      (this as any).floatingMonolith.rotation.y += delta * 0.5;
      (this as any).floatingMonolith.position.y = 6 + Math.sin(animTime * 0.8) * 0.4;
    }
    if (this.waterSystemUpdater) {
      this.waterSystemUpdater(animTime);
    }

    // 8. Stats update callback
    this.callbacks.onPlayerStatsUpdate({
      hp: this.activeCharacter.stats.hp,
      maxHp: this.activeCharacter.stats.maxHp,
      stamina: this.activeCharacter.stats.stamina,
      maxStamina: this.activeCharacter.stats.maxStamina,
      energy: this.activeCharacter.stats.energy,
      maxEnergy: this.activeCharacter.stats.maxEnergy,
    });

    // 9. Minimap Update Callback
    const minimapEntities = [
      ...this.enemies.filter((e) => e.hp > 0).map((e) => ({ id: e.id, type: "enemy" as const, pos: [e.pos.x, e.pos.z] as [number, number], name: e.name })),
      ...this.npcs.map((n) => ({ id: n.id, type: "npc" as const, pos: [n.pos.x, n.pos.z] as [number, number], name: n.name })),
      ...this.chests.filter((c) => !c.opened).map((c) => ({ id: c.id, type: "chest" as const, pos: [c.pos.x, c.pos.z] as [number, number], name: c.tier })),
      ...this.waystones.map((w) => ({ id: w.id, type: "waystone" as const, pos: [w.pos.x, w.pos.z] as [number, number], name: w.name })),
    ];

    this.callbacks.onMinimapUpdate({
      playerPos: [this.playerPos.x, this.playerPos.z],
      playerRot: this.playerRotation,
      entities: minimapEntities,
    });
  }

  // Check proximity for [E] Interaction prompt
  private checkInteractions() {
    const interactRange = 3.5;
    let foundPrompt: string | null = null;
    let action: (() => void) | undefined = undefined;

    // Check NPCs
    for (const npc of this.npcs) {
      if (npc.pos.distanceTo(this.playerPos) < interactRange) {
        foundPrompt = `Press [E] to talk to ${npc.name}`;
        action = () => {
          this.callbacks.onInteractPrompt(null);
          // Set living NPC interaction & smooth turn toward player (Req 66, 67)
          this.animRegistry.getNPC(npc.id)?.setInteracting(true, this.playerPos, npc.pos);
          window.dispatchEvent(new CustomEvent("open_npc_dialogue", { detail: npc.id }));
        };
        break;
      }
    }

    // Check Chests
    if (!foundPrompt) {
      for (const chest of this.chests) {
        if (!chest.opened && chest.pos.distanceTo(this.playerPos) < interactRange) {
          foundPrompt = `Press [E] to open ${chest.tier}`;
          action = () => {
            chest.opened = true;
            // Open animation: rotate lid
            chest.mesh.children[1].rotation.x = -Math.PI * 0.45;
            audio.playChestOpen();
            this.callbacks.onChestOpened(chest.id);
            this.callbacks.onNotification(`Opened ${chest.tier}! Obtained Aether Shards & Crystals!`, "quest");
            this.spawnParticleBurst(chest.pos, "#facc15", 35);
          };
          break;
        }
      }
    }

    // Check Waystones
    if (!foundPrompt) {
      for (const way of this.waystones) {
        if (!way.unlocked && way.pos.distanceTo(this.playerPos) < interactRange + 0.5) {
          foundPrompt = `Press [E] to resonate with ${way.name}`;
          action = () => {
            way.unlocked = true;
            (way.mesh.children[1] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 1.0,
            });
            audio.playFanfare();
            this.callbacks.onWaystoneUnlocked(way.id, way.name);
            this.callbacks.onNotification(`Unlocked Waystone: ${way.name}!`, "quest");
            this.spawnParticleBurst(way.pos, "#38bdf8", 40);
          };
          break;
        }
      }
    }

    // Check Gathering Nodes
    if (!foundPrompt) {
      for (const node of this.nodes) {
        if (!node.collected && node.pos.distanceTo(this.playerPos) < interactRange) {
          const nodeName = node.type === "crystal" ? "Aether Crystal" : "Sunvale Goldpetal";
          foundPrompt = `Press [E] to harvest ${nodeName}`;
          action = () => {
            node.collected = true;
            node.mesh.visible = false;
            audio.playCollectSound();
            const itemId = node.type === "crystal" ? "mat_aether_crystal" : "mat_sunvale_herb";
            this.callbacks.onCollectItem(itemId, 2, nodeName);
            this.callbacks.onNotification(`Gathered 2x ${nodeName}`, "item");
            this.spawnParticleBurst(node.pos, node.type === "crystal" ? "#06b6d4" : "#84cc16", 20);
          };
          break;
        }
      }
    }

    this.currentInteractionAction = action;
    this.callbacks.onInteractPrompt(foundPrompt, action);
  }

  // Render Scene
  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // Graphics Quality Preset & Screen Shake Configuration
  public setGraphicsQuality(quality: "Low" | "Medium" | "High" | "Ultra") {
    if (quality === "Low") {
      this.renderer.setPixelRatio(0.85);
      this.renderer.shadowMap.enabled = false;
      this.camera.far = 200;
    } else if (quality === "Medium") {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.camera.far = 300;
    } else if (quality === "High") {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.camera.far = 400;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.camera.far = 500;
    }
    this.camera.updateProjectionMatrix();
  }

  public setScreenShake(enabled: boolean) {
    this.screenShakeEnabled = enabled;
  }

  // Emotes & Gestures
  public playEmote(emote: EmoteType) {
    this.activeEmote = emote;
    this.emoteTimer = 4.0;
    if (emote === "wave") this.animationController.requestState("EMOTE_WAVE");
    else if (emote === "sit") this.animationController.requestState("EMOTE_SIT");
    else if (emote === "dance") this.animationController.requestState("EMOTE_DANCE");
    else if (emote === "victory") this.animationController.requestState("EMOTE_VICTORY");
    else if (emote === "bow") this.animationController.requestState("EMOTE_BOW");

    if (emote === "victory") {
      this.spawnParticleBurst(this.playerPos, "#facc15", 30);
      audio.playLevelUp();
    } else if (emote === "wave") {
      this.spawnParticleBurst(this.playerPos, "#38bdf8", 15);
    }
  }

  // Photography Mode (Req 70-73)
  public setPhotoMode(enabled: boolean) {
    this.isPhotoMode = enabled;
    this.cameraController.setPhotoMode(enabled);
    if (!enabled) {
      this.camera.fov = this.controlConfig.cameraNormalFov;
      this.camera.updateProjectionMatrix();
    }
  }

  public setPhotoCamera(fov: number, distance: number, heightOffset: number, yawDelta = 0) {
    this.photoFov = fov;
    this.photoDistance = distance;
    this.photoHeightOffset = heightOffset;
    this.photoYawDelta = yawDelta;
    this.cameraController.setPhotoParams(distance, heightOffset);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  public captureScreenshot(): string {
    // Render high quality snapshot
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }

  // God Mode Toggle
  public setGodMode(enabled: boolean) {
    this.godMode = enabled;
  }

  // Control Context Management (Req 51, 52)
  public setInputContext(context: InputContext) {
    this.inputManager.setContext(context);
  }

  public setCameraSensitivity(sens: number) {
    this.cameraController.setSensitivity(sens);
  }

  public getControlConfig(): ControlConfig {
    return { ...this.controlConfig };
  }

  public updateControlConfig(partial: Partial<ControlConfig>) {
    Object.assign(this.controlConfig, partial);
  }

  // Developer Debug & Control Performance Monitoring (Req 74)
  public getDebugStats(): DebugStats {
    const vel = this.movementController ? this.movementController.getVelocity() : new THREE.Vector3();
    const axes = this.inputManager ? this.inputManager.getMovementAxes() : { inputForward: 0, inputRight: 0 };
    return {
      fps: this.fpsCounter,
      frameTimeMs: this.frameTimeCounter,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      activeEnemies: this.enemies.filter((e) => e.hp > 0).length,
      playerX: Math.round(this.playerPos.x * 10) / 10,
      playerY: Math.round(this.playerPos.y * 10) / 10,
      playerZ: Math.round(this.playerPos.z * 10) / 10,
      timeString: this.currentTimeString,
      weather: this.currentWeatherName,
      // Control & Physics Diagnostics (Req 74)
      keysPressed: this.inputManager ? this.inputManager.getRawKeysPressed() : {},
      cameraYawDeg: this.cameraController ? this.cameraController.getYawDegrees() : 0,
      cameraPitchDeg: this.cameraController ? this.cameraController.getPitchDegrees() : 0,
      playerVelocity: [
        Math.round(vel.x * 100) / 100,
        Math.round(vel.y * 100) / 100,
        Math.round(vel.z * 100) / 100,
      ],
      movementVector: [axes.inputRight, axes.inputForward],
      isGrounded: this.movementController ? this.movementController.isGroundedState() : this.isGrounded,
      isSprinting: this.movementController ? this.movementController.isSprintActive() : this.isSprinting,
      currentSpeed: Math.round(Math.hypot(vel.x, vel.z) * 10) / 10,
      inputContext: this.inputManager ? this.inputManager.getContext() : "GAMEPLAY",
      animState: this.animationController ? this.animationController.stateMachine.getCurrentState() : this.animState,
      pointerLocked: this.inputManager ? this.inputManager.getPointerLockState() : false,
      animDebugData: this.animationController ? this.animationController.getDebugData() : undefined,
    };
  }

  // Animation Debug & Developer Test Mode (Req 97 & 98)
  public getAnimationDebugData(): AnimationDebugData {
    return this.animationController.getDebugData();
  }

  public setAnimationTestMode(active: boolean, state?: AnimationState) {
    this.animationController.setTestMode(active, state);
  }

  public setAnimationScrubTime(time: number) {
    this.animationController.setTestTimeScrub(time);
  }

  public spawnDebugEnemy(type: "stalker" | "automaton" | "boss") {
    // Spawn 8 units in front of player
    const spawnDir = new THREE.Vector3(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation));
    const pos = this.playerPos.clone().addScaledVector(spawnDir, 8);
    pos.y = this.terrainHeightMap(pos.x, pos.z);

    const enemyGroup = new THREE.Group();
    let hp = 400;
    let name = "Spawned Aetherling Stalker";
    let color = 0x8b5cf6;
    let scale = 1.0;

    if (type === "automaton") {
      hp = 900;
      name = "Spawned Vanguard Automaton";
      color = 0x0284c7;
      scale = 1.4;
    } else if (type === "boss") {
      hp = 2500;
      name = "Spawned Caldera Sovereign";
      color = 0xef4444;
      scale = 2.2;
    }

    const body = new THREE.Mesh(
      new THREE.DodecahedronGeometry(scale, 1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
    );
    body.position.y = scale;
    body.castShadow = true;
    enemyGroup.add(body);

    enemyGroup.position.copy(pos);
    this.scene.add(enemyGroup);

    this.enemies.push({
      id: "debug_" + Math.random().toString().slice(2, 7),
      name,
      type: type === "boss" ? "boss" : "aetherling",
      mesh: enemyGroup,
      hp,
      maxHp: hp,
      stagger: 100,
      maxStagger: 100,
      isVulnerable: false,
      vulnerableTimer: 0,
      atk: type === "boss" ? 85 : 40,
      elementStatusTimer: 0,
      state: "chase",
      pos: enemyGroup.position,
      spawnPos: pos.clone(),
      velocity: new THREE.Vector3(),
      attackCooldown: 1.5,
    });

    this.spawnParticleBurst(pos, "#ef4444", 35);
    this.callbacks.onNotification(`Spawned ${name}!`, "quest");
  }

  // World Lighting presets (Req 51: soft daylight, warm sun not overly orange, dark blue night with cool blue moonlight)
  public setTimeOfDayPreset(time: "dawn" | "noon" | "dusk" | "midnight") {
    if (time === "noon") {
      this.sunLight.intensity = 1.65;
      this.sunLight.color.setHex(0xfff7ed); // warm soft daylight, not overly orange
      this.ambientLight.intensity = 0.65;
      this.ambientLight.color.setHex(0xffeedd);
      this.moonLight.intensity = 0.05;
      if (this.scene.fog && (this.scene.fog as THREE.FogExp2).color) {
        (this.scene.fog as THREE.FogExp2).color.setHex(0xa7d8ff);
      }
      this.currentTimeString = "12:00";
    } else if (time === "dusk") {
      this.sunLight.intensity = 1.0;
      this.sunLight.color.setHex(0xfb923c);
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0xfecdd3);
      this.moonLight.intensity = 0.3;
      this.moonLight.color.setHex(0x7dd3fc);
      if (this.scene.fog && (this.scene.fog as THREE.FogExp2).color) {
        (this.scene.fog as THREE.FogExp2).color.setHex(0xfbcfe8);
      }
      this.currentTimeString = "18:30";
    } else if (time === "midnight") {
      this.sunLight.intensity = 0.05;
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x1e293b); // dark blue environment
      this.moonLight.intensity = 0.95;
      this.moonLight.color.setHex(0x7dd3fc); // cool blue moonlight
      if (this.scene.fog && (this.scene.fog as THREE.FogExp2).color) {
        (this.scene.fog as THREE.FogExp2).color.setHex(0x0f172a);
      }
      this.currentTimeString = "00:00";
    } else {
      this.sunLight.intensity = 1.25;
      this.sunLight.color.setHex(0xfef08a);
      this.ambientLight.intensity = 0.55;
      this.ambientLight.color.setHex(0xfef3c7);
      this.moonLight.intensity = 0.15;
      if (this.scene.fog && (this.scene.fog as THREE.FogExp2).color) {
        (this.scene.fog as THREE.FogExp2).color.setHex(0xfef08a);
      }
      this.currentTimeString = "06:30";
    }
  }

  // Weather & atmosphere presets (Req 52: fog, wind, falling leaves, dust, rain)
  public setWeatherPreset(weather: "Clear" | "Rain" | "Windstorm" | "Aether Fog" | "Aurora") {
    this.currentWeatherName = weather;
    if (this.atmosphericRain) {
      (this.atmosphericRain.material as THREE.PointsMaterial).opacity = weather === "Rain" ? 0.85 : 0;
    }
    if (weather === "Aether Fog") {
      this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.015);
    } else if (weather === "Rain") {
      this.scene.fog = new THREE.FogExp2(0x64748b, 0.012);
    } else if (weather === "Windstorm") {
      this.scene.fog = new THREE.FogExp2(0x94a3b8, 0.008);
    } else if (weather === "Aurora") {
      this.scene.fog = new THREE.FogExp2(0x818cf8, 0.006);
    } else {
      this.scene.fog = new THREE.FogExp2(0xa7d8ff, 0.0035);
    }
    this.callbacks.onNotification(`Atmosphere shifted to: ${weather}`, "quest");
  }

  // Resize handler
  public handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Dispose on unmount
  public dispose() {
    if (this.reqId) {
      cancelAnimationFrame(this.reqId);
    }
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
