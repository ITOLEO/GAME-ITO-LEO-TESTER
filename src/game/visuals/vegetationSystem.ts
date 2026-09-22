/**
 * VegetationSystem - Instanced Foliage, 4 Distinct Tree Species, Boulders & Ground Clutter.
 * Enforces strict road clearance validation and registers colliders for all large natural obstacles.
 */

import * as THREE from "three";
import { MaterialFactory } from "./materialFactory";
import { RoadClearanceValidator } from "./roadClearanceValidator";
import { CollisionSystem } from "../controls/collisionSystem";

export class VegetationSystem {
  private materials = MaterialFactory.getInstance();
  private validator = RoadClearanceValidator.getInstance();

  /**
   * Spawns stylized trees, rocks, bushes, and instanced flowers across the world.
   */
  public buildVegetation(
    scene: THREE.Scene,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const vegGroup = new THREE.Group();

    // 1. Spawning 4 Distinct Tree Species
    this.spawnVariedTrees(vegGroup, terrainHeightFn, collisionSystem);

    // 2. Spawning Natural Rocks & Boulders
    this.spawnRocksAndBoulders(vegGroup, terrainHeightFn, collisionSystem);

    // 3. Spawning Instanced Wildflowers & Grass Clumps
    this.spawnInstancedFlowers(vegGroup, terrainHeightFn);

    scene.add(vegGroup);
  }

  /**
   * Spawns 4 distinct tree species with organic placement rules
   */
  private spawnVariedTrees(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const oakMat = this.materials.getStylizedFoliageMaterial(0x16a34a); // Rich anime emerald
    const willowMat = this.materials.getStylizedFoliageMaterial(0xc084fc); // Ethereal lavender aether
    const pineMat = this.materials.getStylizedFoliageMaterial(0x065f46); // Deep mountain pine
    const birchMat = this.materials.getStylizedFoliageMaterial(0xf59e0b); // Golden amber
    const trunkMat = this.materials.getTimberMaterial();
    const whiteBarkMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });

    let treeIndex = 0;
    const targetTreeCount = 110;
    let attempts = 0;

    while (treeIndex < targetTreeCount && attempts < 500) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 115;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      // Validate road clearance & building exclusion
      if (!this.validator.isValidObjectLocation(tx, tz, 2.4)) {
        continue;
      }

      const ty = terrainHeightFn(tx, tz);
      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);

      // Determine tree species based on location and height
      const isHighElevation = ty > 2.5;
      const isNearRuins = Math.hypot(tx - 75, tz - (-45)) < 45;
      const isNearRiver = Math.abs(tx - 18) < 18;

      let species: "oak" | "willow" | "pine" | "birch" = "oak";
      if (isHighElevation) {
        species = "pine";
      } else if (isNearRuins) {
        species = "willow";
      } else if (isNearRiver && Math.random() < 0.6) {
        species = "birch";
      } else {
        species = treeIndex % 3 === 0 ? "birch" : "oak";
      }

      if (species === "oak") {
        this.buildSunvaleOak(tree, trunkMat, oakMat);
      } else if (species === "willow") {
        this.buildAetherWillow(tree, trunkMat, willowMat);
      } else if (species === "pine") {
        this.buildHighlandPine(tree, trunkMat, pineMat);
      } else {
        this.buildGoldenBirch(tree, whiteBarkMat, birchMat);
      }

      parent.add(tree);

      // Register collision for trunk
      collisionSystem.addCylinderCollider(`world_tree_${treeIndex}`, tx, tz, 0.85, ty, ty + 12);
      treeIndex++;
    }
  }

  /**
   * Species 1: Sunvale Oak (Lush cloud canopy, sturdy trunk)
   */
  private buildSunvaleOak(group: THREE.Group, trunkMat: THREE.Material, leafMat: THREE.Material) {
    const height = 4.0 + Math.random() * 2.0;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, height, 7), trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Layered cloud puffs (3 overlapping stylized dodecahedrons)
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const radius = (3.4 - l * 0.7) * (0.85 + Math.random() * 0.3);
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), leafMat);
      canopy.position.set(
        (Math.random() - 0.5) * 0.6,
        height + l * 1.6,
        (Math.random() - 0.5) * 0.6
      );
      canopy.castShadow = true;
      group.add(canopy);
    }
  }

  /**
   * Species 2: Aether Willow (Graceful, glowing lavender-pink foliage near ruins)
   */
  private buildAetherWillow(group: THREE.Group, trunkMat: THREE.Material, leafMat: THREE.Material) {
    const height = 5.0 + Math.random() * 1.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, height, 6), trunkMat);
    trunk.position.y = height / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Sweeping canopy with subtle aether glow
    const crown = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 10), leafMat);
    crown.scale.set(1.2, 0.75, 1.2);
    crown.position.y = height + 1.2;
    crown.castShadow = true;
    group.add(crown);

    // Hanging drooping blossom tendrils
    for (let d = 0; d < 5; d++) {
      const angle = (d / 5) * Math.PI * 2;
      const tendril = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 5), leafMat);
      tendril.position.set(Math.cos(angle) * 2.2, height - 0.4, Math.sin(angle) * 2.2);
      tendril.rotation.x = Math.PI;
      group.add(tendril);
    }
  }

  /**
   * Species 3: Highland Pine (Tiered conical evergreen for hills)
   */
  private buildHighlandPine(group: THREE.Group, trunkMat: THREE.Material, leafMat: THREE.Material) {
    const height = 6.0 + Math.random() * 2.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, height, 6), trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // 4 Tiered conical foliage needles
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const radius = 3.2 - t * 0.65;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 2.2, 7), leafMat);
      cone.position.y = height * 0.45 + t * 1.6;
      cone.castShadow = true;
      group.add(cone);
    }
  }

  /**
   * Species 4: Golden Birch (Slender white trunk with amber foliage)
   */
  private buildGoldenBirch(group: THREE.Group, trunkMat: THREE.Material, leafMat: THREE.Material) {
    const height = 5.2 + Math.random() * 1.8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, height, 6), trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Slender oval crown
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), leafMat);
    crown.scale.set(0.9, 1.4, 0.9);
    crown.position.y = height + 1.2;
    crown.castShadow = true;
    group.add(crown);
  }

  /**
   * Spawns natural stylized rock outcrops and large anchor boulders
   */
  private spawnRocksAndBoulders(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });

    const boulderSpots: [number, number, number][] = [
      [22, -18, 2.2],
      [-28, -8, 2.8],
      [42, -22, 3.2],
      [-38, 24, 2.5],
      [58, 28, 3.0],
      [-52, -18, 3.4],
      [68, -12, 2.6],
    ];

    boulderSpots.forEach(([bx, bz, scale], idx) => {
      if (!this.validator.isValidObjectLocation(bx, bz, scale)) return;

      const by = terrainHeightFn(bx, bz);
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), rockMat);
      boulder.position.set(bx, by + scale * 0.45, bz);
      boulder.rotation.set(idx * 0.7, idx * 1.3, idx * 0.4);
      boulder.scale.set(1.2, 0.85, 1.0);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      parent.add(boulder);

      // Register collision for prominent boulders
      collisionSystem.addCylinderCollider(`boulder_${idx}`, bx, bz, scale * 1.1, by, by + scale * 2);
    });
  }

  /**
   * Spawns instanced wildflowers & grass clusters (buttercups, chamomile, aether lilies)
   */
  private spawnInstancedFlowers(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number
  ) {
    const count = 350;
    const flowerGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
    flowerGeo.rotateX(Math.PI);
    const flowerMat = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    const instancedMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    const flowerColors = [
      0xfacc15, // Golden buttercup
      0x38bdf8, // Aether lily
      0xffffff, // White chamomile
      0xf472b6, // Fairy blossom
    ];

    let validCount = 0;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 110;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Disallow flowers on stone roads or in deep water
      if (this.validator.isNearMainRoad(x, z, 2.5) || Math.abs(x - 18) < 5.0) {
        continue;
      }

      const y = terrainHeightFn(x, z);
      position.set(x, y + 0.18, z);
      rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
      const s = 0.75 + Math.random() * 0.6;
      scale.set(s, s, s);

      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      instancedMesh.setMatrixAt(validCount, matrix);

      color.setHex(flowerColors[validCount % flowerColors.length]);
      instancedMesh.setColorAt(validCount, color);
      validCount++;
    }

    instancedMesh.count = validCount;
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    parent.add(instancedMesh);
  }
}
