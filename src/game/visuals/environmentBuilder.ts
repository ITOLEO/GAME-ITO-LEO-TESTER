/**
 * EnvironmentBuilder - Architectural & Spatial World Construction.
 * Builds stylized anime village buildings, blacksmith forge, market stalls,
 * windmill, ruins, arena perimeter, and registers all physical collision volumes.
 */

import * as THREE from "three";
import { MaterialFactory } from "./materialFactory";
import { CollisionSystem } from "../controls/collisionSystem";

export class EnvironmentBuilder {
  private materials = MaterialFactory.getInstance();

  /**
   * Builds the entire Sunvale Haven Village architecture with physical colliders.
   */
  public buildVillage(
    scene: THREE.Scene,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ): { windmillBlades: THREE.Group } {
    const villageGroup = new THREE.Group();

    // 1. Upgraded Stylized Windmill
    const windmillBlades = this.buildWindmill(villageGroup, terrainHeightFn, collisionSystem);

    // 2. Upgraded Half-Timbered Cottages
    const cottagePositions: [number, number, number, number, string][] = [
      [-18, 0, -8, 0.25, "west_cottage"],
      [14, 0, -12, -0.4, "northeast_cottage"],
      [-12, 0, 14, 0.1, "southwest_cottage"],
      [16, 0, 16, -0.2, "southeast_cottage"],
    ];

    cottagePositions.forEach(([cx, cy, cz, rotY, id]) => {
      this.buildCottage(villageGroup, cx, cz, rotY, id, terrainHeightFn, collisionSystem);
    });

    // 3. Blacksmith Forge at (-14, 0, -6)
    this.buildBlacksmithForge(villageGroup, -14, -6, terrainHeightFn, collisionSystem);

    // 4. Market Stall at (4, 0, -16)
    this.buildMarketStall(villageGroup, 4, -16, terrainHeightFn, collisionSystem);

    // 5. Village Square Well at (0, 0, 4)
    this.buildVillageWell(villageGroup, 0, 4, terrainHeightFn, collisionSystem);

    // 6. Fences & Wooden Benches
    this.buildVillageFences(villageGroup, terrainHeightFn, collisionSystem);

    // 7. Directional Signposts & Streetlamps
    this.buildVillageStreetlamps(villageGroup, terrainHeightFn);

    scene.add(villageGroup);
    return { windmillBlades };
  }

  /**
   * Stylized Architectural Windmill with Stone Base and Timber Rotor
   */
  private buildWindmill(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ): THREE.Group {
    const wx = -8;
    const wz = -22;
    const wy = terrainHeightFn(wx, wz);
    const windmill = new THREE.Group();
    windmill.position.set(wx, wy, wz);

    // Stone base (masonry foundation)
    const baseGeo = new THREE.CylinderGeometry(3.6, 4.4, 7.5, 12);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.getStoneWallMaterial());
    baseMesh.position.y = 3.75;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    windmill.add(baseMesh);

    // Timber upper tower
    const towerGeo = new THREE.CylinderGeometry(2.8, 3.5, 8.5, 10);
    const towerMesh = new THREE.Mesh(towerGeo, this.materials.getTimberMaterial());
    towerMesh.position.y = 11.75;
    towerMesh.castShadow = true;
    windmill.add(towerMesh);

    // Observation Balcony with Railing
    const balconyGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.4, 12);
    const balcony = new THREE.Mesh(balconyGeo, this.materials.getTimberMaterial());
    balcony.position.y = 7.7;
    windmill.add(balcony);

    // Conical Shingled Roof
    const roofGeo = new THREE.ConeGeometry(4.2, 5.5, 10);
    const roof = new THREE.Mesh(roofGeo, this.materials.getRoofMaterial(true));
    roof.position.y = 18.5;
    roof.castShadow = true;
    windmill.add(roof);

    // Rotor Hub & Lattice Blades
    const blades = new THREE.Group();
    blades.position.set(0, 14.5, 3.4);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.9, 8),
      this.materials.getTimberMaterial()
    );
    hub.rotation.x = Math.PI / 2;
    blades.add(hub);

    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });

    for (let b = 0; b < 4; b++) {
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = (b * Math.PI) / 2;

      // Timber spar
      const spar = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 10.5, 0.2),
        this.materials.getTimberMaterial()
      );
      spar.position.y = 5.25;
      bladeArm.add(spar);

      // Canvas sail
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 8.5), canvasMat);
      sail.position.set(0.8, 5.5, 0.05);
      sail.castShadow = true;
      bladeArm.add(sail);

      blades.add(bladeArm);
    }

    windmill.add(blades);

    // Windmill Door & Porch
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 0.2),
      this.materials.getTimberMaterial()
    );
    door.position.set(0, 1.2, 4.3);
    windmill.add(door);

    parent.add(windmill);

    // Register physical collision cylinder
    collisionSystem.addCylinderCollider("windmill_tower", wx, wz, 4.4, wy, wy + 20);

    return blades;
  }

  /**
   * Half-Timbered Anime Fantasy Cottage
   */
  private buildCottage(
    parent: THREE.Group,
    cx: number,
    cz: number,
    rotY: number,
    id: string,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const cy = terrainHeightFn(cx, cz);
    const house = new THREE.Group();
    house.position.set(cx, cy, cz);
    house.rotation.y = rotY;

    // 1. Stone Foundation Plinth
    const plinthGeo = new THREE.BoxGeometry(8.6, 1.2, 7.6);
    const plinth = new THREE.Mesh(plinthGeo, this.materials.getStoneWallMaterial());
    plinth.position.y = 0.6;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    house.add(plinth);

    // 2. White Plaster Walls with Timber Corner Posts
    const wallGeo = new THREE.BoxGeometry(8.0, 4.2, 7.0);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 3.3;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Timber Corner Beams
    const timberMat = this.materials.getTimberMaterial();
    const beamGeo = new THREE.BoxGeometry(0.5, 4.3, 0.5);
    for (const bx of [-3.9, 3.9]) {
      for (const bz of [-3.4, 3.4]) {
        const beam = new THREE.Mesh(beamGeo, timberMat);
        beam.position.set(bx, 3.3, bz);
        beam.castShadow = true;
        house.add(beam);
      }
    }

    // Horizontal Timber Braces
    const hBrace = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.35, 7.1), timberMat);
    hBrace.position.y = 3.2;
    house.add(hBrace);

    // 3. Sloped Gabled Tiled Roof with Overhang
    const roofLength = 9.2;
    const roofDepth = 8.4;
    const roofHeight = 3.6;

    // Prismatic gabled roof
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-roofDepth / 2, 0);
    roofShape.lineTo(0, roofHeight);
    roofShape.lineTo(roofDepth / 2, 0);
    roofShape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: roofLength,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 2,
    };
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    roofGeo.center();
    const roofMesh = new THREE.Mesh(roofGeo, this.materials.getRoofMaterial(false));
    roofMesh.rotation.y = Math.PI / 2;
    roofMesh.position.y = 6.9;
    roofMesh.castShadow = true;
    house.add(roofMesh);

    // 4. Stone Chimney with Smoke Particle
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 4.8, 1.0),
      this.materials.getStoneWallMaterial()
    );
    chimney.position.set(2.4, 6.8, -1.8);
    chimney.castShadow = true;
    house.add(chimney);

    // 5. Arched Front Door & Porch
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.25), timberMat);
    door.position.set(0, 2.1, 3.55);
    house.add(door);

    const doorHandle = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      this.materials.getGoldTrimMaterial()
    );
    doorHandle.position.set(0.5, 2.0, 3.7);
    house.add(doorHandle);

    // Warm Porch Lantern
    const porchLight = new THREE.PointLight(0xfef08a, 1.4, 9);
    porchLight.position.set(0, 3.5, 4.2);
    house.add(porchLight);

    const lanternHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.35),
      this.materials.getStylizedMetalMaterial(0x334155)
    );
    lanternHousing.position.set(0, 3.5, 4.0);
    house.add(lanternHousing);

    // 6. Warm Stained Windows
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    for (const wx of [-2.4, 2.4]) {
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), winMat);
      windowMesh.position.set(wx, 3.2, 3.55);
      house.add(windowMesh);
    }

    parent.add(house);

    // Register accurate AABB Box Collider for collision sliding
    const halfW = 4.4;
    const halfD = 3.9;
    collisionSystem.addBoxCollider(
      id,
      cx - halfW,
      cy,
      cz - halfD,
      cx + halfW,
      cy + 8.5,
      cz + halfD
    );
  }

  /**
   * Blacksmith Forge with Anvil, Hearth, and Tool Rack
   */
  private buildBlacksmithForge(
    parent: THREE.Group,
    fx: number,
    fz: number,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const fy = terrainHeightFn(fx, fz);
    const forgeGroup = new THREE.Group();
    forgeGroup.position.set(fx, fy, fz);

    // Stone Forge Hearth
    const hearth = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 2.4),
      this.materials.getStoneWallMaterial()
    );
    hearth.position.set(0, 0.9, 0);
    hearth.castShadow = true;
    forgeGroup.add(hearth);

    // Fiery Burning Coals
    const fireMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.4, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xf97316,
        emissiveIntensity: 2.0,
      })
    );
    fireMesh.position.set(0, 1.85, 0);
    forgeGroup.add(fireMesh);

    // Warm forge fire light
    const forgeLight = new THREE.PointLight(0xf97316, 2.5, 12);
    forgeLight.position.set(0, 2.4, 0);
    forgeGroup.add(forgeLight);

    // Iron Anvil on Oak Stump
    const stump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8),
      this.materials.getTimberMaterial()
    );
    stump.position.set(2.2, 0.4, 1.2);
    stump.castShadow = true;
    forgeGroup.add(stump);

    const anvil = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 1.1),
      this.materials.getStylizedMetalMaterial(0x1e293b)
    );
    anvil.position.set(2.2, 0.95, 1.2);
    anvil.castShadow = true;
    forgeGroup.add(anvil);

    // Blacksmith Protective Canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    for (const postX of [-2.0, 2.0]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.0), canopyMat);
      post.position.set(postX, 2.0, 2.2);
      post.castShadow = true;
      forgeGroup.add(post);
    }
    const canopyRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.2, 3.8),
      this.materials.getTimberMaterial()
    );
    canopyRoof.position.set(0, 4.0, 1.0);
    canopyRoof.castShadow = true;
    forgeGroup.add(canopyRoof);

    parent.add(forgeGroup);

    // Collision
    collisionSystem.addBoxCollider(
      "blacksmith_forge",
      fx - 2.5,
      fy,
      fz - 1.8,
      fx + 2.5,
      fy + 4.5,
      fz + 2.5
    );
  }

  /**
   * Market Stall with Striped Fabric Awning and Crates
   */
  private buildMarketStall(
    parent: THREE.Group,
    mx: number,
    mz: number,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const my = terrainHeightFn(mx, mz);
    const stall = new THREE.Group();
    stall.position.set(mx, my, mz);

    // Wooden Counter Table
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.0, 1.6),
      this.materials.getTimberMaterial()
    );
    table.position.set(0, 0.5, 0);
    table.castShadow = true;
    stall.add(table);

    // Striped Awning
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant blue anime market
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), awningMat);
    awning.position.set(0, 3.2, 0.2);
    awning.rotation.x = Math.PI * 0.35;
    awning.castShadow = true;
    stall.add(awning);

    // Awning Support Poles
    for (const px of [-1.7, 1.7]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.5),
        this.materials.getTimberMaterial()
      );
      pole.position.set(px, 1.75, 0.8);
      stall.add(pole);
    }

    // Goods on counter (fruits, potions)
    const fruitColors = [0xef4444, 0xf59e0b, 0x10b981];
    fruitColors.forEach((color, i) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.3, 0.5),
        this.materials.getTimberMaterial()
      );
      crate.position.set(-1.0 + i * 1.0, 1.15, 0);
      stall.add(crate);

      const fruit = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      fruit.position.set(-1.0 + i * 1.0, 1.35, 0);
      stall.add(fruit);
    });

    parent.add(stall);

    // Collision
    collisionSystem.addBoxCollider("market_stall", mx - 2.0, my, mz - 1.2, mx + 2.0, my + 3.6, mz + 1.2);
  }

  /**
   * Village Town Well
   */
  private buildVillageWell(
    parent: THREE.Group,
    wx: number,
    wz: number,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const wy = terrainHeightFn(wx, wz);
    const well = new THREE.Group();
    well.position.set(wx, wy, wz);

    // Stone circular rim
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 1.1, 12, 1, true),
      this.materials.getStoneWallMaterial()
    );
    rim.position.y = 0.55;
    rim.castShadow = true;
    well.add(rim);

    // Deep water disc
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.4 })
    );
    water.rotateX(-Math.PI / 2);
    water.position.y = 0.3;
    well.add(water);

    // Wooden A-frame roof over well
    for (const px of [-1.3, 1.3]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.6),
        this.materials.getTimberMaterial()
      );
      post.position.set(px, 1.3, 0);
      well.add(post);
    }
    const wellRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.0, 1.4, 4),
      this.materials.getRoofMaterial(true)
    );
    wellRoof.position.y = 3.0;
    wellRoof.rotation.y = Math.PI / 4;
    wellRoof.castShadow = true;
    well.add(wellRoof);

    parent.add(well);

    // Collision
    collisionSystem.addCylinderCollider("village_well", wx, wz, 1.8, wy, wy + 3.5);
  }

  /**
   * Rustic Wooden Fences around perimeter plots
   */
  private buildVillageFences(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number,
    collisionSystem: CollisionSystem
  ) {
    const fenceSegments: [number, number, number, number][] = [
      [-18, 5, 8, 0], // x, z, length, rotY
      [14, 4, 7, 0],
      [-6, -15, 6, Math.PI / 2],
    ];

    fenceSegments.forEach(([fx, fz, len, rot], idx) => {
      const fy = terrainHeightFn(fx, fz);
      const fg = new THREE.Group();
      fg.position.set(fx, fy, fz);
      fg.rotation.y = rot;

      const posts = Math.floor(len / 2) + 1;
      for (let p = 0; p < posts; p++) {
        const px = (p - (posts - 1) / 2) * 2;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 1.4),
          this.materials.getTimberMaterial()
        );
        post.position.set(px, 0.7, 0);
        post.castShadow = true;
        fg.add(post);
      }

      // 2 horizontal rails
      for (const ry of [0.45, 0.95]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.12, 0.1),
          this.materials.getTimberMaterial()
        );
        rail.position.set(0, ry, 0);
        fg.add(rail);
      }

      parent.add(fg);

      // Low collider
      collisionSystem.addBoxCollider(
        `fence_${idx}`,
        fx - (rot === 0 ? len / 2 : 0.4),
        fy,
        fz - (rot === 0 ? 0.4 : len / 2),
        fx + (rot === 0 ? len / 2 : 0.4),
        fy + 1.4,
        fz + (rot === 0 ? 0.4 : len / 2)
      );
    });
  }

  /**
   * Stylized Directional Signposts & Streetlamps
   */
  private buildVillageStreetlamps(
    parent: THREE.Group,
    terrainHeightFn: (x: number, z: number) => number
  ) {
    const lampPositions: [number, number][] = [
      [3, -14],
      [3, -2],
      [3, 10],
      [-10, 0],
    ];

    lampPositions.forEach(([lx, lz]) => {
      const ly = terrainHeightFn(lx, lz);
      const lamp = new THREE.Group();
      lamp.position.set(lx, ly, lz);

      // Cast iron pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 4.2),
        this.materials.getStylizedMetalMaterial(0x1e293b)
      );
      pole.position.y = 2.1;
      pole.castShadow = true;
      lamp.add(pole);

      // Lantern cage with glowing amber core
      const cage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.5,
          roughness: 0.2,
        })
      );
      cage.position.y = 4.2;
      lamp.add(cage);

      const lampLight = new THREE.PointLight(0xfef08a, 1.2, 10);
      lampLight.position.y = 4.2;
      lamp.add(lampLight);

      parent.add(lamp);
    });
  }
}
