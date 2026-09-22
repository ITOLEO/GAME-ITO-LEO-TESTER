/**
 * Environmental Collision System
 * Handles character obstacle collision sliding and camera occlusion avoidance
 */

import * as THREE from "three";

export interface BoxCollider {
  type: "box";
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface CylinderCollider {
  type: "cylinder";
  id: string;
  center: THREE.Vector2; // X, Z
  radius: number;
  minY: number;
  maxY: number;
}

export type WorldCollider = BoxCollider | CylinderCollider;

export class CollisionSystem {
  private colliders: WorldCollider[] = [];

  constructor() {
    this.initDefaultColliders();
  }

  // Pre-register known environmental structures
  private initDefaultColliders() {
    // Village Windmill at (-8, 0, -22)
    this.addCylinderCollider("windmill", -8, -22, 3.8, 0, 16);

    // Village Cottages (base 8m x 5m x 7m)
    const cottagePositions: [number, number, number][] = [
      [-18, 0, -8],
      [14, 0, -12],
      [-12, 0, 14],
      [16, 0, 16],
    ];

    cottagePositions.forEach(([cx, cy, cz], idx) => {
      this.addBoxCollider(`cottage_${idx}`, cx - 4.2, cy, cz - 3.8, cx + 4.2, cy + 6.0, cz + 3.8);
    });

    // Ancient Ruins Sanctum at (75, -45)
    // Central Monolith
    this.addBoxCollider("ruins_monolith", 75 - 1.6, 0, -45 - 1.6, 75 + 1.6, 12, -45 + 1.6);

    // 6 Outer Ring Columns around (75, -45)
    for (let c = 0; c < 6; c++) {
      const angle = (c * Math.PI) / 3;
      const colX = 75 + Math.cos(angle) * 18;
      const colZ = -45 + Math.sin(angle) * 18;
      this.addCylinderCollider(`ruins_col_${c}`, colX, colZ, 1.4, 0, 12);
    }

    // Molten Caldera Boss Arena Perimeter Pillars at (-70, 50)
    for (let p = 0; p < 12; p++) {
      const angle = (p * Math.PI) / 6;
      const px = -70 + Math.cos(angle) * 32;
      const pz = 50 + Math.sin(angle) * 32;
      this.addCylinderCollider(`caldera_pillar_${p}`, px, pz, 2.0, 0, 14);
    }

    // Significant Trees / Trunks
    const prominentTrees: [number, number][] = [
      [-5, -15],
      [8, -20],
      [-22, 5],
      [25, -5],
      [-30, -30],
      [40, 20],
      [-50, 25],
    ];
    prominentTrees.forEach(([tx, tz], i) => {
      this.addCylinderCollider(`tree_${i}`, tx, tz, 0.9, 0, 10);
    });
  }

  private debugGroup: THREE.Group | null = null;

  public getAllColliders(): WorldCollider[] {
    return this.colliders;
  }

  public toggleDebugVisualizer(scene: THREE.Scene): boolean {
    if (this.debugGroup) {
      scene.remove(this.debugGroup);
      this.debugGroup = null;
      return false;
    }

    this.debugGroup = new THREE.Group();
    const boxWireMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const cylWireMat = new THREE.MeshBasicMaterial({ color: 0xeab308, wireframe: true });

    for (const col of this.colliders) {
      if (col.type === "box") {
        const size = col.max.clone().sub(col.min);
        const center = col.min.clone().add(col.max).multiplyScalar(0.5);
        const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const mesh = new THREE.Mesh(geo, boxWireMat);
        mesh.position.copy(center);
        this.debugGroup.add(mesh);
      } else {
        const height = col.maxY - col.minY;
        const geo = new THREE.CylinderGeometry(col.radius, col.radius, height, 10);
        const mesh = new THREE.Mesh(geo, cylWireMat);
        mesh.position.set(col.center.x, col.minY + height / 2, col.center.y);
        this.debugGroup.add(mesh);
      }
    }

    scene.add(this.debugGroup);
    return true;
  }

  public addBoxCollider(id: string, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) {
    this.colliders.push({
      type: "box",
      id,
      min: new THREE.Vector3(minX, minY, minZ),
      max: new THREE.Vector3(maxX, maxY, maxZ),
    });
  }

  public addCylinderCollider(id: string, x: number, z: number, radius: number, minY = 0, maxY = 15) {
    this.colliders.push({
      type: "cylinder",
      id,
      center: new THREE.Vector2(x, z),
      radius,
      minY,
      maxY,
    });
  }

  /**
   * Resolves player movement against world obstacles with natural sliding along tangents.
   * Tests X and Z independently to prevent getting stuck when moving diagonally into a wall.
   */
  public resolvePlayerMovement(
    currentPos: THREE.Vector3,
    desiredDelta: THREE.Vector3,
    playerRadius = 0.45
  ): THREE.Vector3 {
    let newX = currentPos.x + desiredDelta.x;
    let newZ = currentPos.z + desiredDelta.z;
    const playerY = currentPos.y;

    // Test X-axis movement
    let collidedX = false;
    for (const col of this.colliders) {
      if (this.testCollision(newX, playerY, currentPos.z, playerRadius, col)) {
        collidedX = true;
        break;
      }
    }
    if (collidedX) {
      newX = currentPos.x; // Block X movement, permit Z sliding
    }

    // Test Z-axis movement
    let collidedZ = false;
    for (const col of this.colliders) {
      if (this.testCollision(newX, playerY, newZ, playerRadius, col)) {
        collidedZ = true;
        break;
      }
    }
    if (collidedZ) {
      newZ = currentPos.z; // Block Z movement, permit X sliding
    }

    return new THREE.Vector3(newX - currentPos.x, desiredDelta.y, newZ - currentPos.z);
  }

  private testCollision(x: number, y: number, z: number, radius: number, collider: WorldCollider): boolean {
    if (collider.type === "box") {
      if (y < collider.min.y || y > collider.max.y) return false;
      const closestX = Math.max(collider.min.x, Math.min(x, collider.max.x));
      const closestZ = Math.max(collider.min.z, Math.min(z, collider.max.z));
      const dx = x - closestX;
      const dz = z - closestZ;
      return dx * dx + dz * dz < radius * radius;
    } else {
      if (y < collider.minY || y > collider.maxY) return false;
      const dx = x - collider.center.x;
      const dz = z - collider.center.y;
      const totalR = radius + collider.radius;
      return dx * dx + dz * dz < totalR * totalR;
    }
  }

  /**
   * Prevents camera from clipping through buildings, pillars, or terrain.
   * Checks ray from player eye/chest to desired camera position.
   * Returns adjusted camera position if obstructed.
   */
  public resolveCameraObstruction(
    lookTarget: THREE.Vector3,
    desiredCamPos: THREE.Vector3,
    terrainHeightFn: (x: number, z: number) => number,
    camRadius = 0.35
  ): THREE.Vector3 {
    const rayDir = desiredCamPos.clone().sub(lookTarget);
    const maxDist = rayDir.length();
    if (maxDist < 0.1) return desiredCamPos;

    rayDir.normalize();
    let closestDist = maxDist;

    // Sample along the ray for terrain intersection
    const stepCount = 14;
    for (let i = 1; i <= stepCount; i++) {
      const sampleDist = (i / stepCount) * maxDist;
      const samplePoint = lookTarget.clone().addScaledVector(rayDir, sampleDist);
      const groundY = terrainHeightFn(samplePoint.x, samplePoint.z) + camRadius;
      if (samplePoint.y < groundY) {
        // Obstructed by terrain
        closestDist = Math.min(closestDist, Math.max(1.8, sampleDist - camRadius * 1.5));
        break;
      }
    }

    // Test obstacles along the camera ray
    for (const col of this.colliders) {
      if (col.type === "box") {
        const hitDist = this.intersectRayBox(lookTarget, rayDir, col.min, col.max, maxDist);
        if (hitDist !== null && hitDist > 0.5) {
          closestDist = Math.min(closestDist, Math.max(1.8, hitDist - camRadius * 1.2));
        }
      } else {
        const hitDist = this.intersectRayCylinder(lookTarget, rayDir, col.center, col.radius + camRadius, col.minY, col.maxY, maxDist);
        if (hitDist !== null && hitDist > 0.5) {
          closestDist = Math.min(closestDist, Math.max(1.8, hitDist - camRadius * 1.2));
        }
      }
    }

    if (closestDist < maxDist) {
      return lookTarget.clone().addScaledVector(rayDir, closestDist);
    }

    return desiredCamPos;
  }

  private intersectRayBox(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    min: THREE.Vector3,
    max: THREE.Vector3,
    maxDist: number
  ): number | null {
    let tmin = (min.x - origin.x) / (dir.x !== 0 ? dir.x : 0.000001);
    let tmax = (max.x - origin.x) / (dir.x !== 0 ? dir.x : 0.000001);
    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (min.y - origin.y) / (dir.y !== 0 ? dir.y : 0.000001);
    let tymax = (max.y - origin.y) / (dir.y !== 0 ? dir.y : 0.000001);
    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if (tmin > tymax || tymin > tmax) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (min.z - origin.z) / (dir.z !== 0 ? dir.z : 0.000001);
    let tzmax = (max.z - origin.z) / (dir.z !== 0 ? dir.z : 0.000001);
    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if (tmin > tzmax || tzmin > tmax) return null;
    if (tzmin > tmin) tmin = tzmin;

    if (tmin > 0 && tmin < maxDist) return tmin;
    return null;
  }

  private intersectRayCylinder(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    center: THREE.Vector2,
    radius: number,
    minY: number,
    maxY: number,
    maxDist: number
  ): number | null {
    const ox = origin.x - center.x;
    const oz = origin.z - center.y;
    const dx = dir.x;
    const dz = dir.z;

    const a = dx * dx + dz * dz;
    if (a < 0.000001) return null;

    const b = 2 * (ox * dx + oz * dz);
    const c = ox * ox + oz * oz - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return null;

    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t > 0 && t < maxDist) {
      const hitY = origin.y + dir.y * t;
      if (hitY >= minY && hitY <= maxY) {
        return t;
      }
    }
    return null;
  }
}
