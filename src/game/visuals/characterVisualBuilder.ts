/**
 * CharacterVisualBuilder - High-Fidelity Stylized Anime Character Generator.
 * Creates an expressive anime protagonist model with layered clothing, boots,
 * gauntlets, facial features, blink-ready eyes, dynamic hair, and modular sockets.
 */

import * as THREE from "three";
import { PlayableCharacter } from "../../types/game";
import { AnimeModelParts } from "../animation/PlayerAnimationRig";
import { MaterialFactory } from "./materialFactory";
import { WeaponVisualBuilder } from "./weaponVisualBuilder";

export class CharacterVisualBuilder {
  private static instance: CharacterVisualBuilder;
  private materials = MaterialFactory.getInstance();
  private weaponBuilder = WeaponVisualBuilder.getInstance();

  private constructor() {}

  public static getInstance(): CharacterVisualBuilder {
    if (!CharacterVisualBuilder.instance) {
      CharacterVisualBuilder.instance = new CharacterVisualBuilder();
    }
    return CharacterVisualBuilder.instance;
  }

  public buildCharacter(char: PlayableCharacter): AnimeModelParts {
    const root = new THREE.Group();

    // 1. Materials
    const accentColor = new THREE.Color(char.accentColor);
    const avatarColor = new THREE.Color(char.avatarColor);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffe2cf, // Warm healthy anime skin tone
      roughness: 0.7,
      metalness: 0.0,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.55,
      metalness: 0.05,
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark sleek under-tunic
      roughness: 0.8,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: avatarColor,
      roughness: 0.45,
      metalness: 0.1,
    });
    const goldTrimMat = this.materials.getGoldTrimMaterial();
    const leatherMat = this.materials.getTimberMaterial();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });

    // 2. Torso (Vest + Layered High-Collar Jacket)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.3, 1.05, 8),
      vestMat
    );
    body.position.y = 1.35;
    body.castShadow = true;
    root.add(body);

    // Adventurer Jacket Lapels & Front Flaps
    const jacketFlapL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.08), jacketMat);
    jacketFlapL.position.set(-0.16, 0.0, 0.28);
    body.add(jacketFlapL);

    const jacketFlapR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.08), jacketMat);
    jacketFlapR.position.set(0.16, 0.0, 0.28);
    body.add(jacketFlapR);

    // High Standing Collar
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 0.25, 8, 1, true),
      jacketMat
    );
    collar.position.set(0, 0.55, 0);
    body.add(collar);

    // Gold Chest Emblem / Crest
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), goldTrimMat);
    crest.position.set(0, 0.25, 0.32);
    body.add(crest);

    // Adventurer Leather Belt with Buckle & Hip Pouch
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 8), leatherMat);
    belt.position.set(0, -0.42, 0);
    body.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), goldTrimMat);
    buckle.position.set(0, -0.42, 0.32);
    body.add(buckle);

    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.12), leatherMat);
    pouch.position.set(0.32, -0.45, 0.05);
    body.add(pouch);

    // 3. Head & Sculpted Anime Face
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), skinMat);
    head.position.y = 2.05;
    head.castShadow = true;
    root.add(head);

    // Cute blush decals on cheeks
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.35 });
    for (const bx of [-0.22, 0.22]) {
      const blush = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), blushMat);
      blush.position.set(bx, 1.98, 0.33);
      blush.rotation.y = bx > 0 ? -0.2 : 0.2;
      root.add(blush);
    }

    // 4. Expressive Anime Eyes (using Iris Canvas Texture)
    const eyeTexture = this.materials.getAnimeEyeTexture(char.accentColor, "#0f172a");
    const eyeMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true,
    });
    const eyeGeo = new THREE.PlaneGeometry(0.16, 0.12);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.13, 2.06, 0.34);
    leftEye.rotation.y = 0.15;
    root.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.13, 2.06, 0.34);
    rightEye.rotation.y = -0.15;
    root.add(rightEye);

    // Anime Eyebrows
    const browMat = new THREE.MeshBasicMaterial({ color: avatarColor });
    for (const bx of [-0.13, 0.13]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), browMat);
      brow.position.set(bx, 2.15, 0.34);
      brow.rotation.z = bx > 0 ? -0.15 : 0.15;
      root.add(brow);
    }

    // 5. Multi-Layered Stylized Anime Hair
    const hair = new THREE.Group();

    // Bangs framing face
    for (let b = 0; b < 5; b++) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 4), hairMat);
      bang.position.set((b - 2) * 0.09, 2.18, 0.31);
      bang.rotation.x = 0.2;
      bang.rotation.z = (b - 2) * 0.15;
      hair.add(bang);
    }

    // Side locks
    for (const sx of [-0.3, 0.3]) {
      const sidelock = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.5, 4), hairMat);
      sidelock.position.set(sx, 2.05, 0.12);
      sidelock.rotation.z = sx > 0 ? -0.2 : 0.2;
      hair.add(sidelock);
    }

    // Spiky top crown
    for (let h = 0; h < 6; h++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 5), hairMat);
      spike.position.set(
        Math.sin(h * 1.05) * 0.22,
        2.32 + Math.cos(h * 0.8) * 0.06,
        Math.cos(h * 1.05) * 0.18 - 0.08
      );
      spike.rotation.x = -0.3 + (Math.random() - 0.5) * 0.3;
      spike.rotation.z = (h - 2.5) * 0.25;
      hair.add(spike);
    }

    // Dynamic flowing ponytail/back tuft for secondary spring physics
    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 5), hairMat);
    ponytail.position.set(0, 2.2, -0.28);
    ponytail.rotation.x = -Math.PI * 0.35;
    hair.add(ponytail);

    root.add(hair);

    // 6. Double-Split Hero Cape / Scarf
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 1.25),
      new THREE.MeshStandardMaterial({
        color: avatarColor,
        side: THREE.DoubleSide,
        roughness: 0.75,
      })
    );
    cape.position.set(0, 1.25, -0.36);
    cape.rotation.x = 0.22;
    cape.castShadow = true;
    root.add(cape);

    // 7. Arms with Shoulder Pauldrons & Combat Gauntlets
    const armGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.75, 8);

    // Left Arm
    const leftArm = new THREE.Group();
    const lMesh = new THREE.Mesh(armGeo, jacketMat);
    lMesh.position.y = -0.35;
    leftArm.add(lMesh);

    // Shoulder pauldron
    const lPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), goldTrimMat);
    lPauldron.scale.set(1.2, 0.8, 1.1);
    lPauldron.position.set(0, 0, 0);
    leftArm.add(lPauldron);

    // Forearm Gauntlet & Bracer
    const lGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.35, 8), leatherMat);
    lGauntlet.position.y = -0.52;
    leftArm.add(lGauntlet);

    leftArm.position.set(-0.52, 1.7, 0);
    root.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    const rMesh = new THREE.Mesh(armGeo, jacketMat);
    rMesh.position.y = -0.35;
    rightArm.add(rMesh);

    const rPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), goldTrimMat);
    rPauldron.scale.set(1.2, 0.8, 1.1);
    rPauldron.position.set(0, 0, 0);
    rightArm.add(rPauldron);

    const rGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.35, 8), leatherMat);
    rGauntlet.position.y = -0.52;
    rightArm.add(rGauntlet);

    rightArm.position.set(0.52, 1.7, 0);
    root.add(rightArm);

    // 8. Legs with Travel Trousers & Cuffed Adventurer Boots
    const legGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.85, 8);

    // Left Leg
    const leftLeg = new THREE.Group();
    const llMesh = new THREE.Mesh(legGeo, pantsMat);
    llMesh.position.y = -0.42;
    leftLeg.add(llMesh);

    // Boot & Knee guard
    const lBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.45, 8), bootMat);
    lBoot.position.y = -0.65;
    leftLeg.add(lBoot);

    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.28), bootMat);
    lFoot.position.set(0, -0.85, 0.08);
    leftLeg.add(lFoot);

    leftLeg.position.set(-0.2, 0.85, 0);
    root.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    const rlMesh = new THREE.Mesh(legGeo, pantsMat);
    rlMesh.position.y = -0.42;
    rightLeg.add(rlMesh);

    const rBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.45, 8), bootMat);
    rBoot.position.y = -0.65;
    rightLeg.add(rBoot);

    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.28), bootMat);
    rFoot.position.set(0, -0.85, 0.08);
    rightLeg.add(rFoot);

    rightLeg.position.set(0.2, 0.85, 0);
    root.add(rightLeg);

    // 9. Sockets System for attachments
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

    // 10. Stylized Anime Weapon
    const weapon = this.weaponBuilder.buildWeapon(char.weaponType, char.accentColor);
    weapon.position.set(0, 0, 0.1);
    weapon.rotation.x = Math.PI / 4;
    sockets.rightHand.add(weapon);

    // 11. Crescent Slash Arc
    const arcGeo = new THREE.RingGeometry(1.2, 1.8, 20, 1, 0, Math.PI * 0.75);
    const arcMat = new THREE.MeshBasicMaterial({
      color: accentColor,
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
}
