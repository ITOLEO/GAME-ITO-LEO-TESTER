/**
 * RoadClearanceValidator - Strict Environmental Spatial Hierarchy & Exclusion Zones.
 * Guarantees that no trees, rocks, props, or obstacles intersect roads, paths,
 * doorways, player spawn, NPC interaction areas, or combat arenas.
 */

import * as THREE from "three";

export interface SpatialExclusionZone {
  name: string;
  type: "circle" | "box";
  center: THREE.Vector2; // X, Z
  radius?: number;
  halfSize?: THREE.Vector2; // halfWidth, halfDepth
}

export class RoadClearanceValidator {
  private static instance: RoadClearanceValidator;
  private exclusionZones: SpatialExclusionZone[] = [];

  private constructor() {
    this.initExclusionZones();
  }

  public static getInstance(): RoadClearanceValidator {
    if (!RoadClearanceValidator.instance) {
      RoadClearanceValidator.instance = new RoadClearanceValidator();
    }
    return RoadClearanceValidator.instance;
  }

  private initExclusionZones() {
    // 1. Player Spawn Sanctuary
    this.exclusionZones.push({
      name: "player_spawn",
      type: "circle",
      center: new THREE.Vector2(0, 2),
      radius: 6.5,
    });

    // 2. Village Central Plaza
    this.exclusionZones.push({
      name: "village_plaza",
      type: "circle",
      center: new THREE.Vector2(0, 0),
      radius: 26.0,
    });

    // 3. Village Buildings Footprints & Approach Porches
    const buildings: [string, number, number, number][] = [
      ["cottage_west", -18, -8, 8.5],
      ["cottage_north_east", 14, -12, 8.5],
      ["cottage_south_west", -12, 14, 8.5],
      ["cottage_south_east", 16, 16, 8.5],
      ["windmill", -8, -22, 9.5],
      ["blacksmith_forge", -14, -6, 7.5],
      ["market_stall", 4, -16, 7.0],
    ];

    buildings.forEach(([name, bx, bz, rad]) => {
      this.exclusionZones.push({
        name,
        type: "circle",
        center: new THREE.Vector2(bx, bz),
        radius: rad,
      });
    });

    // 4. River Bridge Crossing & Approach Corridors
    this.exclusionZones.push({
      name: "river_bridge",
      type: "box",
      center: new THREE.Vector2(18, 0),
      halfSize: new THREE.Vector2(7.0, 14.0),
    });

    // 5. River Flow Channel (Keep water free of land trees/rocks)
    this.exclusionZones.push({
      name: "river_flow",
      type: "box",
      center: new THREE.Vector2(18, 0),
      halfSize: new THREE.Vector2(6.5, 140.0),
    });

    // 6. Ancient Ruins Sanctum & Ring
    this.exclusionZones.push({
      name: "ancient_ruins",
      type: "circle",
      center: new THREE.Vector2(75, -45),
      radius: 28.0,
    });

    // 7. Molten Caldera Boss Combat Arena (Complete central clearing for clean combat)
    this.exclusionZones.push({
      name: "caldera_boss_arena",
      type: "circle",
      center: new THREE.Vector2(-65, 60),
      radius: 36.0,
    });

    // 8. Key NPC Interaction Zones
    const npcs: [string, number, number][] = [
      ["elder_thorne", 0, -10],
      ["seraphina", 12, -8],
      ["gerald", -14, -6],
      ["sylas", 35, 15],
    ];
    npcs.forEach(([name, nx, nz]) => {
      this.exclusionZones.push({
        name: `npc_${name}`,
        type: "circle",
        center: new THREE.Vector2(nx, nz),
        radius: 4.5,
      });
    });

    // 9. Chest & Waystone Landmarks
    const landmarks: [string, number, number][] = [
      ["chest_01", 8, -14],
      ["chest_02", 48, 8],
      ["chest_03", 82, -40],
      ["chest_04", -50, 48],
      ["chest_05", -12, 28],
      ["way_haven", 0, -2],
      ["way_glade", 40, 10],
      ["way_ruins", 75, -45],
      ["way_caldera", -65, 60],
    ];
    landmarks.forEach(([name, lx, lz]) => {
      this.exclusionZones.push({
        name: `landmark_${name}`,
        type: "circle",
        center: new THREE.Vector2(lx, lz),
        radius: 4.0,
      });
    });
  }

  /**
   * Checks whether a position lies inside or crosses the Main Highway / Quest Path.
   * Path runs from Sunvale Haven (-15) across the river bridge (18) to Whispering Glade (45) and Ancient Ruins (80).
   */
  public isNearMainRoad(x: number, z: number, clearanceMargin = 4.5): boolean {
    if (x > -15 && x < 85) {
      const roadZ = Math.sin(x * 0.04) * 8;
      if (Math.abs(z - roadZ) < clearanceMargin) {
        return true;
      }
    }
    // Road connecting village to Caldera (-10 to -65)
    if (x < -10 && x > -70) {
      const calderaRoadZ = ((-x - 10) / 55) * 55; // Slopes towards z = 60
      if (Math.abs(z - calderaRoadZ) < clearanceMargin) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validates whether an environmental object (Tree, Large Boulder, Heavy Prop)
   * can be placed at (x, z) without violating road clearance or overlapping buildings.
   */
  public isValidObjectLocation(x: number, z: number, objectRadius = 1.0): boolean {
    // 1. Road check
    if (this.isNearMainRoad(x, z, 3.5 + objectRadius)) {
      return false;
    }

    // 2. Exclusion zones check
    for (const zone of this.exclusionZones) {
      if (zone.type === "circle") {
        const distSq = (x - zone.center.x) ** 2 + (z - zone.center.y) ** 2;
        const totalR = (zone.radius || 5) + objectRadius;
        if (distSq < totalR * totalR) {
          return false;
        }
      } else if (zone.type === "box" && zone.halfSize) {
        const dx = Math.abs(x - zone.center.x);
        const dz = Math.abs(z - zone.center.y);
        if (dx < zone.halfSize.x + objectRadius && dz < zone.halfSize.y + objectRadius) {
          return false;
        }
      }
    }

    // 3. Map boundary limits
    if (Math.hypot(x, z) > 155) {
      return false;
    }

    return true;
  }
}
