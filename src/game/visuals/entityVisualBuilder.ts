/**
 * EntityVisualBuilder - Upgraded Visual Models for NPCs, Monsters, and World Boss.
 * Provides distinct anime silhouettes, role-specific attire/props, and glowing elemental inlays.
 */

import * as THREE from "three";
import { MaterialFactory } from "./materialFactory";

export class EntityVisualBuilder {
  private static instance: EntityVisualBuilder;
  private materials = MaterialFactory.getInstance();

  private constructor() {}

  public static getInstance(): EntityVisualBuilder {
    if (!EntityVisualBuilder.instance) {
      EntityVisualBuilder.instance = new EntityVisualBuilder();
    }
    return EntityVisualBuilder.instance;
  }

  // --- 1. UPGRADED NPCS ---

  public buildElderThorne(): THREE.Group {
    const root = new THREE.Group();
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.75 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const goldMat = this.materials.getGoldTrimMaterial();

    // Robe Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.52, 1.6, 8), robeMat);
    body.position.y = 0.8;
    body.castShadow = true;
    root.add(body);

    // Gold hem trim
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.08, 8), goldMat);
    hem.position.y = 0.08;
    root.add(hem);

    // Head with wise silver beard
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), skinMat);
    head.position.y = 1.8;
    root.add(head);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 6), hairMat);
    beard.position.set(0, 1.6, 0.22);
    beard.rotation.x = 0.3;
    root.add(beard);

    // Elder Staff with Glowing Amber Gem
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8),
      this.materials.getTimberMaterial()
    );
    staff.position.set(0.5, 1.05, 0.2);
    staff.castShadow = true;
    root.add(staff);

    const staffGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    staffGem.position.set(0.5, 2.15, 0.2);
    root.add(staffGem);

    this.addInteractiveDiamond(root);
    return root;
  }

  public buildSeraphina(): THREE.Group {
    const root = new THREE.Group();
    const dressMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });

    // Dress & Apron
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.55, 8), dressMat);
    body.position.y = 0.78;
    body.castShadow = true;
    root.add(body);

    const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.85), apronMat);
    apron.position.set(0, 0.85, 0.38);
    root.add(apron);

    // Alchemical Potion Vials at belt
    const potionColors = [0x10b981, 0x06b6d4, 0xa855f7];
    potionColors.forEach((color, i) => {
      const vial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.16, 6),
        new THREE.MeshBasicMaterial({ color })
      );
      vial.position.set(-0.25 + i * 0.25, 0.72, 0.36);
      root.add(vial);
    });

    // Head & Brass Goggles
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.78;
    root.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 10), hairMat);
    hair.position.set(0, 1.85, -0.05);
    root.add(hair);

    const goggles = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.1, 0.12),
      this.materials.getGoldTrimMaterial()
    );
    goggles.position.set(0, 1.95, 0.22);
    root.add(goggles);

    this.addInteractiveDiamond(root);
    return root;
  }

  public buildGerald(): THREE.Group {
    const root = new THREE.Group();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const apronMat = this.materials.getTimberMaterial();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5caa6, roughness: 0.75 });

    // Muscular Torso & Heavy Leather Apron
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1.6, 8), pantsMat);
    body.position.y = 0.8;
    body.castShadow = true;
    root.add(body);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.1, 0.1), apronMat);
    apron.position.set(0, 0.8, 0.32);
    root.add(apron);

    // Bare arms with soot
    for (const ax of [-0.48, 0.48]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.7, 6), skinMat);
      arm.position.set(ax, 1.1, 0);
      root.add(arm);
    }

    // Heavy Smithing Hammer at hip
    const hammerHilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6),
      this.materials.getTimberMaterial()
    );
    hammerHilt.position.set(0.42, 0.65, 0.2);
    hammerHilt.rotation.z = 0.3;
    root.add(hammerHilt);

    const hammerHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.35),
      this.materials.getStylizedMetalMaterial(0x1e293b)
    );
    hammerHead.position.set(0.52, 0.95, 0.2);
    root.add(hammerHead);

    // Head with smith bandana
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), skinMat);
    head.position.y = 1.8;
    root.add(head);

    const bandana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    bandana.position.set(0, 1.95, 0);
    root.add(bandana);

    this.addInteractiveDiamond(root);
    return root;
  }

  public buildSylas(): THREE.Group {
    const root = new THREE.Group();
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.8 });
    const leatherMat = this.materials.getTimberMaterial();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.32, 1.55, 8), jacketMat);
    body.position.y = 0.78;
    body.castShadow = true;
    root.add(body);

    // Leather Map Satchel across chest
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.68), leatherMat);
    strap.position.set(0, 1.0, 0);
    strap.rotation.z = 0.5;
    root.add(strap);

    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.18), leatherMat);
    satchel.position.set(-0.35, 0.65, 0.15);
    root.add(satchel);

    // Head with feathered ranger hat
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
    head.position.y = 1.78;
    root.add(head);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 8), jacketMat);
    hat.position.set(0, 2.05, 0);
    root.add(hat);

    const feather = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.35, 4),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    feather.position.set(0.22, 2.15, 0.1);
    feather.rotation.z = -0.4;
    root.add(feather);

    this.addInteractiveDiamond(root);
    return root;
  }

  private addInteractiveDiamond(group: THREE.Group) {
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    diamond.position.y = 2.5;
    group.add(diamond);
  }

  // --- 2. UPGRADED ENEMIES ---

  /**
   * Upgraded Aetherling Stalker (Anime Shadow Wolf with glowing horns and spine)
   */
  public buildAetherlingStalker(): { root: THREE.Group; tail: THREE.Mesh } {
    const root = new THREE.Group();
    const beastMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Midnight shadow
      roughness: 0.6,
      metalness: 0.15,
    });
    const aetherGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Muscular Quadruped Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 1.8), beastMat);
    body.position.y = 0.68;
    body.castShadow = true;
    root.add(body);

    // Glowing Spine Plates
    for (let p = 0; p < 4; p++) {
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), aetherGlowMat);
      plate.position.set(0, 1.15, -0.6 + p * 0.4);
      plate.rotation.x = -0.2;
      root.add(plate);
    }

    // Predatory Head & Glowing Eyes
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.75, 5), beastMat);
    head.position.set(0, 0.95, 0.9);
    head.rotation.x = Math.PI * 0.45;
    head.castShadow = true;
    root.add(head);

    for (const ex of [-0.14, 0.14]) {
      const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05), aetherGlowMat);
      eye.position.set(ex, 1.05, 1.15);
      root.add(eye);
    }

    // Twin Spiraling Aether Horns
    for (const hx of [-0.18, 0.18]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.75, 5), aetherGlowMat);
      horn.position.set(hx, 1.35, 0.75);
      horn.rotation.set(0.4, 0, -hx * 0.8);
      root.add(horn);
    }

    // Dynamic Segmented Tail for Spring Physics
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 5), beastMat);
    tail.position.set(0, 0.75, -1.0);
    tail.rotation.x = -Math.PI * 0.35;
    root.add(tail);

    return { root, tail };
  }

  /**
   * Upgraded Ruin Vanguard Automaton (Ancient Golem with glowing optic eye & runes)
   */
  public buildRuinVanguard(): THREE.Group {
    const root = new THREE.Group();
    const stonePlateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.45,
      metalness: 0.65,
    });
    const runeRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Heavy Plated Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.3, 1.3), stonePlateMat);
    torso.position.y = 2.1;
    torso.castShadow = true;
    root.add(torso);

    // Glowing Chest Core Conduit
    const coreRune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 0.1), runeRedMat);
    coreRune.position.set(0, 2.1, 0.68);
    root.add(coreRune);

    // Cyclopean Head with Glowing Optic Sensor
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.8), stonePlateMat);
    head.position.set(0, 3.4, 0.1);
    root.add(head);

    const opticLens = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), runeRedMat);
    opticLens.position.set(0, 3.4, 0.52);
    root.add(opticLens);

    // Massive Spiked Fist & Armor Plates
    for (const fx of [-1.2, 1.2]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.6), stonePlateMat);
      arm.position.set(fx, 1.9, 0.2);
      arm.castShadow = true;
      root.add(arm);

      const maceFist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), stonePlateMat);
      maceFist.position.set(fx, 0.9, 0.2);
      root.add(maceFist);
    }

    return root;
  }

  /**
   * Upgraded Resonant Colossus: Ignis-Titan (Monumental Volcanic Boss)
   */
  public buildIgnisTitan(): {
    root: THREE.Group;
    torso: THREE.Mesh;
    head: THREE.Mesh;
    core: THREE.Mesh;
    fists: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      flatShading: true,
    });
    const magmaGlowMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xf97316,
      emissiveIntensity: 2.0,
      roughness: 0.3,
    });

    // Colossal Basalt Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.0, 3.2), basaltMat);
    torso.position.y = 4.8;
    torso.castShadow = true;
    root.add(torso);

    // Pulsating Subterranean Magma Core
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 1), magmaGlowMat);
    core.position.set(0, 4.9, 1.6);
    root.add(core);

    // Core Volumetric Point Light
    const coreLight = new THREE.PointLight(0xf97316, 3.5, 25);
    coreLight.position.set(0, 4.9, 1.8);
    root.add(coreLight);

    // Colossal Horned Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.0), basaltMat);
    head.position.set(0, 8.0, 0.4);
    head.castShadow = true;
    root.add(head);

    // Massive Jagged Obsidian Horns
    for (const hx of [-1.4, 1.4]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 5), magmaGlowMat);
      horn.position.set(hx, 9.4, 0.4);
      horn.rotation.z = -hx * 0.45;
      root.add(horn);
    }

    // Heavy Stone Fists with Molten Chains
    const fists: THREE.Mesh[] = [];
    for (const fx of [-3.6, 3.6]) {
      const fist = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 1.8), basaltMat);
      fist.position.set(fx, 3.8, 0.6);
      fist.castShadow = true;
      root.add(fist);
      fists.push(fist);

      // Molten knuckles
      const knuckles = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 1.9), magmaGlowMat);
      knuckles.position.set(fx, 2.6, 0.6);
      root.add(knuckles);
    }

    return { root, torso, head, core, fists };
  }
}
