/**
 * WeaponVisualBuilder - High-Fidelity Stylized Anime Weapon Meshes.
 * Builds distinct silhouettes for Sword, Greatsword, Spear, Catalyst/Grimoire, and Bow.
 */

import * as THREE from "three";
import { WeaponType } from "../../types/game";
import { MaterialFactory } from "./materialFactory";

export class WeaponVisualBuilder {
  private static instance: WeaponVisualBuilder;
  private materials = MaterialFactory.getInstance();

  private constructor() {}

  public static getInstance(): WeaponVisualBuilder {
    if (!WeaponVisualBuilder.instance) {
      WeaponVisualBuilder.instance = new WeaponVisualBuilder();
    }
    return WeaponVisualBuilder.instance;
  }

  public buildWeapon(weaponType: WeaponType, accentColorHex: string): THREE.Group {
    const group = new THREE.Group();
    const accentColor = new THREE.Color(accentColorHex);

    switch (weaponType) {
      case "Greatsword":
        this.buildGreatsword(group, accentColor);
        break;
      case "Spear":
        this.buildSpear(group, accentColor);
        break;
      case "Catalyst":
        this.buildCatalyst(group, accentColor);
        break;
      case "Bow":
        this.buildBow(group, accentColor);
        break;
      case "Sword":
      default:
        this.buildSword(group, accentColor);
        break;
    }

    return group;
  }

  /**
   * 1. Stylized One-Handed Sword (Solaris Edge / Knight Blade)
   */
  private buildSword(group: THREE.Group, accentColor: THREE.Color) {
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: accentColor,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.85,
    });
    const goldMat = this.materials.getGoldTrimMaterial();
    const gripMat = this.materials.getTimberMaterial();

    // Central Fuller Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.18), bladeMat);
    blade.position.y = 0.65;
    blade.castShadow = true;
    group.add(blade);

    // Tapered Blade Tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), bladeMat);
    tip.position.y = 1.45;
    tip.rotation.y = Math.PI / 4;
    tip.castShadow = true;
    group.add(tip);

    // Swept Crossguard with Embedded Crystal
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.45), goldMat);
    guard.position.y = -0.04;
    guard.castShadow = true;
    group.add(guard);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06),
      new THREE.MeshBasicMaterial({ color: accentColor })
    );
    gem.position.set(0, -0.04, 0);
    group.add(gem);

    // Leather Wrapped Grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8), gripMat);
    grip.position.y = -0.22;
    group.add(grip);

    // Faceted Pommel
    const pommel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07), goldMat);
    pommel.position.y = -0.4;
    group.add(pommel);
  }

  /**
   * 2. Massive Colossal Greatsword (Pyre Cleaver)
   */
  private buildGreatsword(group: THREE.Group, accentColor: THREE.Color) {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.85,
    });
    const magmaEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: accentColor,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.9,
    });
    const goldMat = this.materials.getGoldTrimMaterial();

    // Heavy Broad Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.38), steelMat);
    blade.position.y = 0.95;
    blade.castShadow = true;
    group.add(blade);

    // Glowing Core Channel
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.08), magmaEdgeMat);
    core.position.y = 0.95;
    group.add(core);

    // Serrated Back Edge
    for (let s = 0; s < 4; s++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 3), steelMat);
      tooth.position.set(0, 0.6 + s * 0.35, -0.24);
      tooth.rotation.x = -Math.PI * 0.4;
      group.add(tooth);
    }

    // Heavy Dual-Ring Crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.65), goldMat);
    guard.position.y = -0.05;
    group.add(guard);

    // Elongated Two-Handed Hilt
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8),
      this.materials.getTimberMaterial()
    );
    grip.position.y = -0.35;
    group.add(grip);

    // Counterweight Heavy Pommel
    const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), goldMat);
    pommel.position.y = -0.65;
    group.add(pommel);
  }

  /**
   * 3. Fluid Aerodynamic Polearm / Spear (Zephyr Lance)
   */
  private buildSpear(group: THREE.Group, accentColor: THREE.Color) {
    const shaftMat = this.materials.getTimberMaterial();
    const spearHeadMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: accentColor,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.9,
    });
    const goldMat = this.materials.getGoldTrimMaterial();

    // Long Ash Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), shaftMat);
    shaft.position.y = 0.3;
    shaft.castShadow = true;
    group.add(shaft);

    // Tapered Spearhead
    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 4), spearHeadMat);
    spearHead.position.y = 1.65;
    spearHead.castShadow = true;
    group.add(spearHead);

    // Winged Cross Fins
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.18), goldMat);
    wingL.position.set(0, 1.35, 0.12);
    group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.18), goldMat);
    wingR.position.set(0, 1.35, -0.12);
    group.add(wingR);

    // Bottom Counterweight Spike
    const butt = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), goldMat);
    butt.position.y = -0.9;
    butt.rotation.x = Math.PI;
    group.add(butt);
  }

  /**
   * 4. Floating Arcane Grimoire / Catalyst (Aether Codex)
   */
  private buildCatalyst(group: THREE.Group, accentColor: THREE.Color) {
    const bookCoverMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.6,
    });
    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: accentColor,
      emissiveIntensity: 0.3,
      roughness: 0.8,
    });
    const goldMat = this.materials.getGoldTrimMaterial();

    // Book Cover Spine & Boards
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.18), bookCoverMat);
    cover.position.y = 0.55;
    cover.castShadow = true;
    group.add(cover);

    // Gold Corner Protectors
    for (const cx of [-0.25, 0.25]) {
      for (const cy of [0.25, 0.85]) {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), goldMat);
        corner.position.set(cx, cy, 0);
        group.add(corner);
      }
    }

    // Glowing Gilded Runic Pages
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.68, 0.15), pageMat);
    pages.position.set(0.03, 0.55, 0);
    group.add(pages);

    // Orbiting Aether Shards (Hovering focus gems)
    for (let s = 0; s < 3; s++) {
      const angle = (s / 3) * Math.PI * 2;
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: accentColor })
      );
      shard.position.set(Math.cos(angle) * 0.45, 0.55 + (s - 1) * 0.15, Math.sin(angle) * 0.45);
      group.add(shard);
    }
  }

  /**
   * 5. Recurve Composite Bow (Gale Whisper)
   */
  private buildBow(group: THREE.Group, accentColor: THREE.Color) {
    const limbMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.6,
    });
    const stringMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const gripMat = this.materials.getTimberMaterial();

    // Central Grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), gripMat);
    grip.position.y = 0.5;
    group.add(grip);

    // Upper & Lower Curved Limbs
    const upperLimb = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 12, Math.PI * 0.65), limbMat);
    upperLimb.position.set(0, 0.85, -0.15);
    upperLimb.rotation.z = Math.PI * 0.2;
    group.add(upperLimb);

    const lowerLimb = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 12, Math.PI * 0.65), limbMat);
    lowerLimb.position.set(0, 0.15, -0.15);
    lowerLimb.rotation.z = Math.PI * 0.8;
    group.add(lowerLimb);

    // Glowing Elemental String
    const stringLine = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.25), stringMat);
    stringLine.position.set(0, 0.5, 0.18);
    group.add(stringLine);
  }
}
