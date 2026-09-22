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
  private playerModel: {
    root: THREE.Group;
    body: THREE.Mesh;
    head: THREE.Mesh;
    hair: THREE.Group;
    eyes: THREE.Mesh;
    cape: THREE.Mesh;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    weapon: THREE.Group;
    slashArc: THREE.Mesh;
    sockets: {
      head: THREE.Group;
      chest: THREE.Group;
      back: THREE.Group;
      hip: THREE.Group;
      leftHand: THREE.Group;
      rightHand: THREE.Group;
      foot: THREE.Group;
    };
  };
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

  // Camera Orbit
  private cameraYaw = 0;
  private cameraPitch = 0.35;
  private cameraDistance = 5.5;
  private isPointerLocked = false;
  private isDraggingMouse = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

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

    // Build World (Terrain, Village, Ruins, Caldera, Trees)
    this.buildWorld();

    // Build Player Model & Rig
    this.playerGroup = new THREE.Group();
    this.playerModel = this.buildAnimeCharacter(this.activeCharacter);
    this.playerGroup.add(this.playerModel.root);
    this.scene.add(this.playerGroup);

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
    // 1. Terrain Mesh
    const terrainSize = 320;
    const terrainSegs = 96;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colorAttr = new Float32Array(posAttr.count * 3);

    const grassColor = new THREE.Color(0x56ab2f);
    const lushColor = new THREE.Color(0xa8e063);
    const rockColor = new THREE.Color(0x78716c);
    const pathColor = new THREE.Color(0xd7ccc8);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.terrainHeightMap(x, z);
      posAttr.setY(i, y);

      // Path carving to ruins and glade
      const distToGladePath = Math.abs(z - Math.sin(x * 0.04) * 8);
      const isPath = x > -15 && x < 80 && distToGladePath < 4.5;

      let c = grassColor.clone();
      if (isPath) {
        c.lerp(pathColor, 0.85);
      } else if (y > 3.0) {
        c.lerp(rockColor, 0.7);
      } else {
        c.lerp(lushColor, (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 0.25 + 0.3);
      }

      colorAttr[i * 3] = c.r;
      colorAttr[i * 3 + 1] = c.g;
      colorAttr[i * 3 + 2] = c.b;
    }

    terrainGeo.setAttribute("color", new THREE.BufferAttribute(colorAttr, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // 2. Sparkling River
    const riverGeo = new THREE.PlaneGeometry(280, 14);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.2,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.position.set(18, -0.4, 0);
    river.rotation.y = 0.2;
    this.scene.add(river);

    // River Bridge
    const bridgeGeo = new THREE.BoxGeometry(7, 0.6, 18);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(18, 0.5, 0);
    bridge.rotation.y = 0.2;
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.scene.add(bridge);

    // 3. Sunvale Haven Buildings
    this.buildVillageArchitecture();

    // 4. Stylized Anime Trees & Foliage
    this.buildFoliage();

    // 5. Ancient Ruins
    this.buildAncientRuins();

    // 6. Molten Caldera Boss Arena
    this.buildCalderaArena();
  }

  // Sunvale Haven village
  private buildVillageArchitecture() {
    // Village Windmill
    const windmill = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(2.5, 3.8, 14, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, roughness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 7;
    tower.castShadow = true;
    windmill.add(tower);

    const roofGeo = new THREE.ConeGeometry(4, 5, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 16.5;
    windmill.add(roof);

    // Blades
    const blades = new THREE.Group();
    blades.position.set(0, 12, 3.2);
    for (let b = 0; b < 4; b++) {
      const bladeGeo = new THREE.BoxGeometry(1.2, 9, 0.15);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 4.5;
      const bladeHolder = new THREE.Group();
      bladeHolder.rotation.z = (b * Math.PI) / 2;
      bladeHolder.add(blade);
      blades.add(bladeHolder);
    }
    windmill.add(blades);
    windmill.position.set(-8, 0, -22);
    this.scene.add(windmill);

    // Animate blades in loop
    (this as any).windmillBlades = blades;

    // Cottages
    const cottagePositions: [number, number, number][] = [
      [-18, 0, -8],
      [14, 0, -12],
      [-12, 0, 14],
      [16, 0, 16],
    ];

    cottagePositions.forEach(([cx, cy, cz]) => {
      const house = new THREE.Group();
      const baseGeo = new THREE.BoxGeometry(8, 5, 7);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 2.5;
      base.castShadow = true;
      base.receiveShadow = true;
      house.add(base);

      // Timber beams
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
      for (const bx of [-3.9, 3.9]) {
        for (const bz of [-3.4, 3.4]) {
          const corner = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 0.4), beamMat);
          corner.position.set(bx, 2.6, bz);
          house.add(corner);
        }
      }

      // Roof
      const hRoofGeo = new THREE.ConeGeometry(6.5, 4, 4);
      const hRoofMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 });
      const hRoof = new THREE.Mesh(hRoofGeo, hRoofMat);
      hRoof.position.y = 6.8;
      hRoof.rotation.y = Math.PI / 4;
      hRoof.scale.set(1.1, 1, 0.9);
      hRoof.castShadow = true;
      house.add(hRoof);

      // Warm glowing lantern at doorway
      const lantern = new THREE.PointLight(0xfef08a, 1.2, 8);
      lantern.position.set(0, 3, 3.8);
      house.add(lantern);

      house.position.set(cx, cy + this.terrainHeightMap(cx, cz), cz);
      this.scene.add(house);
    });

    // Village Plaza Lanterns & Benches
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    for (const lz of [-14, -2, 10]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.8), lanternMat);
      pole.position.set(3, 1.9, lz);
      this.scene.add(pole);

      const lampLight = new THREE.PointLight(0xfef08a, 0.9, 7);
      lampLight.position.set(3, 3.6, lz);
      this.scene.add(lampLight);
    }
  }

  // Stylized anime foliage
  private buildFoliage() {
    const treeMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.8,
      flatShading: true,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
    });

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 110;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      // Don't spawn on caldera or inside village plaza
      if (tx < -40 && tz > 40) continue;
      if (Math.abs(tx) < 22 && Math.abs(tz) < 22) continue;

      const ty = this.terrainHeightMap(tx, tz);
      const tree = new THREE.Group();

      const trunkHeight = 3.5 + Math.random() * 2;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, trunkHeight, 6),
        trunkMat
      );
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      // Anime cloud canopy (overlapping dodecahedrons)
      const layers = 3;
      for (let l = 0; l < layers; l++) {
        const radius = (3.2 - l * 0.7) * (0.8 + Math.random() * 0.4);
        const crown = new THREE.Mesh(
          new THREE.DodecahedronGeometry(radius, 1),
          treeMat
        );
        crown.position.y = trunkHeight + l * 1.8;
        crown.castShadow = true;
        tree.add(crown);
      }

      tree.position.set(tx, ty, tz);
      this.scene.add(tree);
    }
  }

  // Ancient Aether Ruins
  private buildAncientRuins() {
    const ruinsGroup = new THREE.Group();
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

    colCoords.forEach(([cx, cz]) => {
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

    const rx = 75;
    const rz = -45;
    ruinsGroup.position.set(rx, this.terrainHeightMap(rx, rz), rz);
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

  // Stylized anime character mesh builder with modular Sockets (Req 63)
  private buildAnimeCharacter(char: PlayableCharacter) {
    const root = new THREE.Group();

    // Body material (jacket/tunic)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: char.accentColor,
      roughness: 0.6,
    });
    // Skin material
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4,
      roughness: 0.8,
    });
    // Hair material
    const hairMat = new THREE.MeshStandardMaterial({
      color: char.avatarColor,
      roughness: 0.5,
    });

    // 1. Torso
    const bodyGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.0, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.35;
    body.castShadow = true;
    root.add(body);

    // 2. Head
    const headGeo = new THREE.SphereGeometry(0.36, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.05;
    head.castShadow = true;
    root.add(head);

    // 3. Anime Eyes
    const eyeGeo = new THREE.PlaneGeometry(0.12, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 2.08, 0.35);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 2.08, 0.35);
    root.add(leftEye, rightEye);

    // 4. Stylized Anime Hair (layered spiky cones)
    const hair = new THREE.Group();
    for (let h = 0; h < 7; h++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 5), hairMat);
      spike.position.set(
        Math.sin(h * 1.0) * 0.26,
        2.32 + Math.cos(h * 0.8) * 0.08,
        Math.cos(h * 1.0) * 0.2 - 0.05
      );
      spike.rotation.x = -0.3 + (Math.random() - 0.5) * 0.4;
      spike.rotation.z = (h - 3) * 0.3;
      hair.add(spike);
    }
    root.add(hair);

    // 5. Flowing Cape / Scarf
    const capeGeo = new THREE.PlaneGeometry(0.65, 1.1);
    const capeMat = new THREE.MeshStandardMaterial({
      color: char.avatarColor,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.3, -0.38);
    cape.rotation.x = 0.2;
    root.add(cape);

    // 6. Arms
    const armMat = new THREE.MeshStandardMaterial({ color: char.accentColor, roughness: 0.7 });
    const leftArm = new THREE.Group();
    const lMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75), armMat);
    lMesh.position.y = -0.35;
    leftArm.add(lMesh);
    leftArm.position.set(-0.52, 1.7, 0);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75), armMat);
    rMesh.position.y = -0.35;
    rightArm.add(rMesh);
    rightArm.position.set(0.52, 1.7, 0);
    root.add(rightArm);

    // 7. Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const leftLeg = new THREE.Group();
    const llMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.85), legMat);
    llMesh.position.y = -0.42;
    leftLeg.add(llMesh);
    leftLeg.position.set(-0.2, 0.85, 0);
    root.add(leftLeg);

    const rightLeg = new THREE.Group();
    const rlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.85), legMat);
    rlMesh.position.y = -0.42;
    rightLeg.add(rlMesh);
    rightLeg.position.set(0.2, 0.85, 0);
    root.add(rightLeg);

    // 8. Sockets System (Req 63: head, chest, back, hip, leftHand, rightHand, foot)
    const sockets = {
      head: new THREE.Group(),
      chest: new THREE.Group(),
      back: new THREE.Group(),
      hip: new THREE.Group(),
      leftHand: new THREE.Group(),
      rightHand: new THREE.Group(),
      foot: new THREE.Group(),
    };

    head.add(sockets.head);
    body.add(sockets.chest);
    body.add(sockets.back);
    sockets.back.position.set(0, 0.1, -0.32);
    body.add(sockets.hip);
    sockets.hip.position.set(0.32, -0.35, 0);
    leftArm.add(sockets.leftHand);
    sockets.leftHand.position.set(0, -0.7, 0.15);
    rightArm.add(sockets.rightHand);
    sockets.rightHand.position.set(0, -0.7, 0.15);
    leftLeg.add(sockets.foot);
    sockets.foot.position.set(0, -0.85, 0.1);

    // 9. Glowing Elemental Weapon - attached to rightHand socket
    const weapon = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: char.accentColor,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const bladeGeo = new THREE.BoxGeometry(0.08, 1.25, 0.22);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.55;
    blade.castShadow = true;
    weapon.add(blade);

    // Guard & Hilt
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    hilt.position.y = -0.15;
    weapon.add(hilt);

    weapon.position.set(0, 0, 0.1);
    weapon.rotation.x = Math.PI / 4;
    sockets.rightHand.add(weapon);

    // 10. Slash Arc Effect (Crescent curve)
    const arcGeo = new THREE.RingGeometry(1.2, 1.8, 16, 1, 0, Math.PI * 0.7);
    const arcMat = new THREE.MeshBasicMaterial({
      color: char.accentColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const slashArc = new THREE.Mesh(arcGeo, arcMat);
    slashArc.position.set(0, 1.3, 0.6);
    slashArc.rotation.x = -Math.PI / 2;
    root.add(slashArc);

    return {
      root,
      body,
      head,
      hair,
      eyes: leftEye,
      cape,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      weapon,
      slashArc,
      sockets,
    };
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
  }

  // Spawn NPCs with interactive indicators
  private spawnNPCs() {
    const npcDefs = [
      { id: "thorne", name: "Elder Thorne", role: "Sunvale Elder", pos: new THREE.Vector3(0, 0, -10), color: 0x3b82f6 },
      { id: "seraphina", name: "Seraphina", role: "Alchemist", pos: new THREE.Vector3(12, 0, -8), color: 0x10b981 },
      { id: "gerald", name: "Gerald the Smith", role: "Blacksmith", pos: new THREE.Vector3(-14, 0, -6), color: 0xf59e0b },
      { id: "sylas", name: "Sylas the Explorer", role: "Cartographer", pos: new THREE.Vector3(35, 0, 15), color: 0x8b5cf6 },
    ];

    npcDefs.forEach((def) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.45, 1.6),
        new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 })
      );
      body.position.y = 0.8;
      body.castShadow = true;
      g.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffdfc4 })
      );
      head.position.y = 1.8;
      g.add(head);

      // Floating interactive prompt diamond
      const icon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.25),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      icon.position.y = 2.5;
      g.add(icon);

      const y = this.terrainHeightMap(def.pos.x, def.pos.z);
      g.position.set(def.pos.x, y, def.pos.z);
      this.scene.add(g);

      this.npcs.push({
        id: def.id,
        name: def.name,
        role: def.role,
        mesh: g,
        pos: g.position,
      });
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
      const g = new THREE.Group();
      // Anime wolf/beast body
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.8), bodyMat);
      body.position.y = 0.65;
      body.castShadow = true;
      g.add(body);

      // Glowing aether horn
      const hornMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 5), hornMat);
      horn.position.set(0, 1.25, 0.7);
      horn.rotation.x = 0.5;
      g.add(horn);

      const sy = this.terrainHeightMap(sx, sz);
      g.position.set(sx, sy, sz);
      this.scene.add(g);

      this.enemies.push({
        id: `stalker_${idx}`,
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
    const rvGroup = new THREE.Group();
    const vanguardMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const vgTorso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), vanguardMat);
    vgTorso.position.y = 2.0;
    vgTorso.castShadow = true;
    rvGroup.add(vgTorso);

    const vgEye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    vgEye.position.set(0, 2.3, 0.65);
    rvGroup.add(vgEye);

    rvGroup.position.set(rvx, rvy, rvz);
    this.scene.add(rvGroup);

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
    const bossGroup = new THREE.Group();

    const titanRockMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, flatShading: true });
    const titanMagmaMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xf97316,
      emissiveIntensity: 1.5,
      roughness: 0.3,
    });

    const bTorso = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.5, 2.8), titanRockMat);
    bTorso.position.y = 4.5;
    bTorso.castShadow = true;
    bossGroup.add(bTorso);

    // Glowing Magma Core
    const bCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 1), titanMagmaMat);
    bCore.position.set(0, 4.6, 1.4);
    bossGroup.add(bCore);

    // Titan Head & Crown Horns
    const bHead = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 1.8), titanRockMat);
    bHead.position.set(0, 7.5, 0.4);
    bHead.castShadow = true;
    bossGroup.add(bHead);

    for (const hx of [-1.2, 1.2]) {
      const bHorn = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 5), titanMagmaMat);
      bHorn.position.set(hx, 8.8, 0.4);
      bHorn.rotation.z = -hx * 0.4;
      bossGroup.add(bHorn);
    }

    // Heavy Stone Fists
    for (const fx of [-3.2, 3.2]) {
      const bFist = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), titanRockMat);
      bFist.position.set(fx, 3.5, 0.5);
      bFist.castShadow = true;
      bossGroup.add(bFist);
    }

    bossGroup.position.set(bx, by, bz);
    this.scene.add(bossGroup);

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

  // Setup Mouse & Keyboard
  private setupInputs() {
    window.addEventListener("keydown", (e) => {
      this.keysPressed[e.code] = true;

      if (e.code === "KeyE") {
        if (this.currentInteractionAction) {
          this.currentInteractionAction();
        }
      } else if (e.code === "KeyQ") {
        this.triggerSkill();
      } else if (e.code === "KeyR") {
        this.triggerUltimate();
      } else if (e.code === "Space") {
        this.jump();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysPressed[e.code] = false;
    });

    // Mouse combat & camera
    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click = Attack
        this.triggerAttack();
      } else if (e.button === 2) {
        // Right click = Dodge
        this.triggerDodge();
      }
      this.isDraggingMouse = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener("mouseup", () => {
      this.isDraggingMouse = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isDraggingMouse || this.isPointerLocked) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.cameraYaw -= deltaX * 0.004;
        this.cameraPitch = Math.max(0.08, Math.min(1.2, this.cameraPitch + deltaY * 0.0035));
      }
    });

    // Zoom
    this.container.addEventListener("wheel", (e) => {
      this.cameraDistance = Math.max(3.2, Math.min(9.5, this.cameraDistance + e.deltaY * 0.006));
    });

    // Prevent context menu
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // Jump with landing sound trigger (Req 68)
  private jump() {
    if (this.isGrounded && this.activeCharacter.stats.stamina >= 10) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      this.animState = "JUMP";
      this.activeCharacter.stats.stamina -= 8;
      audio.playJumpSound();
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

    audio.playUltimateSound();
    this.callbacks.onNotification(`BURST: ${this.activeCharacter.ultimateName}!!`, "boss");

    // Camera punch-in
    this.cameraDistance = 3.5;
    setTimeout(() => {
      this.cameraDistance = 5.5;
    }, 800);

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

  // Dodge & Perfect Dodge
  public triggerDodge() {
    if (this.isDodging || this.activeCharacter.stats.stamina < 18) return;

    this.isDodging = true;
    this.dodgeTimer = 0.35;
    this.isInvulnerable = true;
    this.activeCharacter.stats.stamina -= 18;

    // Dash impulse in movement or facing direction
    const dashDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotation);
    this.playerVelocity.x = dashDir.x * 16;
    this.playerVelocity.z = dashDir.z * 16;

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
    this.playerPos.set(pos[0], pos[1] + 1, pos[2]);
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

    // 1. Player Movement & Physics
    let moveX = 0;
    let moveZ = 0;

    if (this.keysPressed["KeyW"] || this.keysPressed["ArrowUp"]) moveZ += 1;
    if (this.keysPressed["KeyS"] || this.keysPressed["ArrowDown"]) moveZ -= 1;
    if (this.keysPressed["KeyA"] || this.keysPressed["ArrowLeft"]) moveX -= 1;
    if (this.keysPressed["KeyD"] || this.keysPressed["ArrowRight"]) moveX += 1;

    this.isSprinting = !!(this.keysPressed["ShiftLeft"] || this.keysPressed["ShiftRight"]);
    if (this.isSprinting && (moveX !== 0 || moveZ !== 0)) {
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

    const moveVector = new THREE.Vector3(moveX, 0, moveZ);
    const isMoving = moveVector.lengthSq() > 0.01;

    if (isMoving) {
      moveVector.normalize();
      // Rotate by camera yaw
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const targetRotation = Math.atan2(moveVector.x, moveVector.z);
      // Smooth player turn
      let angleDiff = targetRotation - this.playerRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.playerRotation += angleDiff * Math.min(1, delta * 14);

      const speed = this.isSprinting ? 9.5 : 5.2;
      this.playerVelocity.x = moveVector.x * speed;
      this.playerVelocity.z = moveVector.z * speed;
    } else {
      this.playerVelocity.x *= 0.82;
      this.playerVelocity.z *= 0.82;
    }

    // Gravity & Ground Height
    this.playerVelocity.y -= 22 * delta;
    this.playerPos.addScaledVector(this.playerVelocity, delta);

    const terrainY = this.terrainHeightMap(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= terrainY) {
      this.playerPos.y = terrainY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Landing detection (Req 68)
    if (!this.wasGrounded && this.isGrounded) {
      this.currentSurface = this.getSurfaceAt(this.playerPos.x, this.playerPos.z);
      audio.playLandSound(this.currentSurface);
    }
    this.wasGrounded = this.isGrounded;

    // Footsteps distance accumulator (Req 68)
    if (isMoving && this.isGrounded) {
      const stepDistance = this.isSprinting ? 3.0 : 2.0;
      this.footstepAccumulator += (this.isSprinting ? 9.5 : 5.2) * delta;
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

    // 2. Character Model Animations with State Machine & Blending (Req 64, 65, 66)
    const animTime = performance.now() * 0.006;
    if (isMoving && this.isGrounded) {
      this.activeEmote = null;
      this.playerModel.root.position.y = 0;
      this.playerModel.body.rotation.set(0, 0, 0);
      this.playerModel.head.rotation.set(0, 0, 0);
      const runCycle = animTime * (this.isSprinting ? 2.2 : 1.5);
      this.playerModel.leftLeg.rotation.x = Math.sin(runCycle) * 0.8;
      this.playerModel.rightLeg.rotation.x = -Math.sin(runCycle) * 0.8;
      this.playerModel.leftArm.rotation.x = -Math.sin(runCycle) * 0.6;
      if (!this.isAttacking) {
        this.playerModel.rightArm.rotation.x = Math.sin(runCycle) * 0.6;
      }
      this.playerModel.cape.rotation.x = 0.4 + Math.sin(runCycle * 2) * 0.15;
    } else if (this.activeEmote) {
      this.emoteTimer -= delta;
      if (this.emoteTimer <= 0) {
        this.activeEmote = null;
        this.playerModel.root.position.y = 0;
        this.playerModel.body.rotation.set(0, 0, 0);
        this.playerModel.head.rotation.set(0, 0, 0);
      } else {
        if (this.activeEmote === "wave") {
          this.playerModel.rightArm.rotation.z = Math.sin(animTime * 4) * 0.4 + 1.8;
          this.playerModel.rightArm.rotation.x = -0.4;
          this.playerModel.leftArm.rotation.set(0, 0, 0);
        } else if (this.activeEmote === "sit") {
          this.playerModel.root.position.y = -0.55;
          this.playerModel.leftLeg.rotation.x = Math.PI * 0.45;
          this.playerModel.rightLeg.rotation.x = Math.PI * 0.45;
          this.playerModel.leftArm.rotation.x = 0.3;
          this.playerModel.rightArm.rotation.x = 0.3;
        } else if (this.activeEmote === "dance") {
          this.playerModel.body.rotation.y = Math.sin(animTime * 3) * 0.6;
          this.playerModel.leftArm.rotation.z = -1.2 + Math.sin(animTime * 3.5) * 0.4;
          this.playerModel.rightArm.rotation.z = 1.2 - Math.sin(animTime * 3.5) * 0.4;
          this.playerModel.root.position.y = Math.abs(Math.sin(animTime * 3.5)) * 0.2;
        } else if (this.activeEmote === "victory") {
          this.playerModel.leftArm.rotation.z = -2.2;
          this.playerModel.rightArm.rotation.z = 2.2;
          this.playerModel.body.scale.set(1.05, 1.05, 1.05);
        } else if (this.activeEmote === "bow") {
          this.playerModel.body.rotation.x = 0.55;
          this.playerModel.head.rotation.x = 0.35;
        } else if (this.activeEmote === "laugh") {
          this.playerModel.head.rotation.x = -0.3;
          this.playerModel.body.position.y = Math.sin(animTime * 6) * 0.08;
        }
      }
    } else {
      // Idle breathing
      this.playerModel.root.position.y = 0;
      this.playerModel.body.rotation.set(0, 0, 0);
      this.playerModel.head.rotation.set(0, 0, 0);
      const breath = Math.sin(animTime * 0.5) * 0.04;
      this.playerModel.body.scale.set(1 + breath, 1 + breath, 1 + breath);
      this.playerModel.leftLeg.rotation.x *= 0.8;
      this.playerModel.rightLeg.rotation.x *= 0.8;
      this.playerModel.leftArm.rotation.x = Math.sin(animTime * 0.5) * 0.1;
      this.playerModel.cape.rotation.x = 0.2 + Math.sin(animTime * 0.4) * 0.08;
    }

    // Attack phase update: anticipation -> strike -> recovery (Req 60, 64, 65, 66)
    if (this.isAttacking) {
      this.attackPhaseTimer -= delta;
      if (this.attackPhase === "anticipation") {
        this.playerModel.rightArm.rotation.x = -1.15;
        this.playerModel.body.rotation.y = -0.22;
        if (this.attackPhaseTimer <= 0) {
          this.attackPhase = "strike";
          this.attackPhaseTimer = this.isHeavyAttack ? 0.22 : 0.14;
          (this.playerModel.slashArc.material as THREE.MeshBasicMaterial).opacity = 0.95;
          this.playerModel.slashArc.rotation.z = Math.random() * Math.PI * 2;
          this.performAttackHitCheck(this.isHeavyAttack);
        }
      } else if (this.attackPhase === "strike") {
        this.playerModel.rightArm.rotation.x = 1.35;
        this.playerModel.body.rotation.y = 0.35;
        if (this.attackPhaseTimer <= 0) {
          this.attackPhase = "recovery";
          this.attackPhaseTimer = this.isHeavyAttack ? 0.2 : 0.12;
        }
      } else if (this.attackPhase === "recovery") {
        this.playerModel.rightArm.rotation.x = THREE.MathUtils.lerp(this.playerModel.rightArm.rotation.x, 0.2, delta * 12);
        this.playerModel.body.rotation.y = THREE.MathUtils.lerp(this.playerModel.body.rotation.y, 0, delta * 12);
        if (this.attackPhaseTimer <= 0) {
          this.attackPhase = "none";
          this.isAttacking = false;
        }
      }
    }

    // Slash Arc Fade
    const arcMat = this.playerModel.slashArc.material as THREE.MeshBasicMaterial;
    if (arcMat.opacity > 0) {
      arcMat.opacity = Math.max(0, arcMat.opacity - delta * 4);
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
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboStep = 0;
        this.isAttacking = false;
      }
    }

    // 3. Update Camera Orbit
    const activeDistance = this.isPhotoMode ? this.photoDistance : this.cameraDistance;
    const activeHeight = this.isPhotoMode ? this.photoHeightOffset : 1.8;
    const activeYaw = this.isPhotoMode ? this.cameraYaw + this.photoYawDelta : this.cameraYaw;
    const camOffset = new THREE.Vector3(
      Math.sin(activeYaw) * Math.cos(this.cameraPitch) * activeDistance,
      Math.sin(this.cameraPitch) * activeDistance + activeHeight,
      Math.cos(activeYaw) * Math.cos(this.cameraPitch) * activeDistance
    );
    const targetCamPos = this.playerPos.clone().add(camOffset);
    // Don't clip through terrain
    const minCamY = this.terrainHeightMap(targetCamPos.x, targetCamPos.z) + 0.5;
    if (targetCamPos.y < minCamY) targetCamPos.y = minCamY;

    this.camera.position.lerp(targetCamPos, delta * 12);
    this.camera.lookAt(this.playerPos.x, this.playerPos.y + (this.isPhotoMode ? activeHeight * 0.8 : 1.5), this.playerPos.z);

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

    // 7. Rotating Objects (Windmill, Monolith)
    if ((this as any).windmillBlades) {
      (this as any).windmillBlades.rotation.z -= delta * 0.8;
    }
    if ((this as any).floatingMonolith) {
      (this as any).floatingMonolith.rotation.y += delta * 0.5;
      (this as any).floatingMonolith.position.y = 6 + Math.sin(animTime * 0.8) * 0.4;
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
          // Dispatch custom event for React to open Dialogue
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
    if (emote === "victory") {
      this.spawnParticleBurst(this.playerPos, "#facc15", 30);
      audio.playLevelUp();
    } else if (emote === "wave") {
      this.spawnParticleBurst(this.playerPos, "#38bdf8", 15);
    }
  }

  // Photography Mode
  public setPhotoMode(enabled: boolean) {
    this.isPhotoMode = enabled;
    if (!enabled) {
      this.camera.fov = 58;
      this.camera.updateProjectionMatrix();
    }
  }

  public setPhotoCamera(fov: number, distance: number, heightOffset: number, yawDelta = 0) {
    this.photoFov = fov;
    this.photoDistance = distance;
    this.photoHeightOffset = heightOffset;
    this.photoYawDelta = yawDelta;
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

  // Developer Debug & Performance Monitoring
  public getDebugStats(): DebugStats {
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
    };
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
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
